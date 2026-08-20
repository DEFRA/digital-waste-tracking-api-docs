#!/usr/bin/env node
// Mirrors docs/software-provider-integration-guidance.md to its Confluence page.
// Run by .github/workflows/confluence-sync.yml on every push that touches the doc.
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const PAGE_ID = '6574604518';
const BASE_URL = 'https://eaflood.atlassian.net/wiki/rest/api/content';
const DOC_PATH = 'docs/software-provider-integration-guidance.md';

const { CONFLUENCE_USER, CONFLUENCE_API_TOKEN, GITHUB_REPOSITORY, GITHUB_REF_NAME } = process.env;
if (!CONFLUENCE_USER || !CONFLUENCE_API_TOKEN) {
  console.error('Missing CONFLUENCE_USER or CONFLUENCE_API_TOKEN secret');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${CONFLUENCE_USER}:${CONFLUENCE_API_TOKEN}`).toString('base64');
const sourceUrl = `https://github.com/${GITHUB_REPOSITORY}/blob/${GITHUB_REF_NAME}/${DOC_PATH}`;

async function confluenceFetch(pathAndQuery, options = {}) {
  const res = await fetch(`${BASE_URL}${pathAndQuery}`, {
    ...options,
    headers: { Authorization: authHeader, ...(options.headers || {}) }
  });
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${pathAndQuery} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}

// Confluence Cloud rejects a create-attachment call if the filename already exists on the page
// (400 "Cannot add a new attachment with same file name"), so an existing attachment has to go
// through the separate update-data endpoint instead of the create one.
async function findExistingAttachmentId(filename) {
  const res = await confluenceFetch(`/${PAGE_ID}/child/attachment?filename=${encodeURIComponent(filename)}`);
  const data = await res.json();
  return data.results.length > 0 ? data.results[0].id : null;
}

async function uploadAttachment(filePath) {
  const filename = path.basename(filePath);
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(filePath)]), filename);

  const existingId = await findExistingAttachmentId(filename);
  const endpoint = existingId
    ? `/${PAGE_ID}/child/attachment/${existingId}/data`
    : `/${PAGE_ID}/child/attachment`;

  await confluenceFetch(endpoint, {
    method: 'POST',
    headers: { 'X-Atlassian-Token': 'nocheck' },
    body: form
  });
  console.log(`${existingId ? 'Updated' : 'Uploaded'} attachment: ${filename}`);
  return filename;
}

// marked doesn't treat colon-namespaced tags (ac:image, ri:attachment) as passthrough HTML -
// it escapes them - so images/links are converted normally to <img>/<a> first, then swapped for
// the Confluence macros as an HTML post-processing step instead of a markdown pre-processing one.
//
// Covers both markdown image embeds (![alt](path)) and plain links to a local file
// ([text](path)) - a link to a local image or other file needs the same attachment upload as an
// embed does, or it renders as a relative href that doesn't resolve to anything on Confluence.
async function uploadLocalFiles(markdown, docDir) {
  const pattern = /!?\[[^\]]*\]\((?!https?:\/\/)(?!#)([^)]+)\)/g;
  const uploaded = new Set();
  for (const match of markdown.matchAll(pattern)) {
    const relPath = match[1];
    if (uploaded.has(relPath)) continue;
    uploaded.add(relPath);
    await uploadAttachment(path.join(docDir, relPath));
  }
}

function replaceImageTagsWithMacros(html) {
  return html.replace(/<img src="([^"]+)" alt="([^"]*)"\s*\/?>/g, (_, src, alt) => {
    if (/^https?:\/\//.test(src)) return _; // leave external images alone
    const filename = path.basename(src);
    return `<ac:image ac:alt="${alt}"><ri:attachment ri:filename="${filename}" /></ac:image>`;
  });
}

function replaceLocalLinksWithAttachmentLinks(html) {
  return html.replace(/<a href="([^"]+)">([^<]*)<\/a>/g, (full, href, text) => {
    if (href.startsWith('#') || /^https?:\/\//.test(href)) return full; // leave anchors/external links alone
    const filename = path.basename(href);
    return `<ac:link><ri:attachment ri:filename="${filename}" /><ac:plain-text-link-body><![CDATA[${text}]]></ac:plain-text-link-body></ac:link>`;
  });
}

function normaliseTables(html) {
  let out = html.replace(/<\/?thead>/g, '').replace(/<\/?tbody>/g, '');
  out = out.replace(/<table>/g, '<table><tbody>').replace(/<\/table>/g, '</tbody></table>');
  return out;
}

// Confluence anchors inline comments to page text with <ac:inline-comment-marker> tags in the
// storage body. A full-body overwrite (which is what every sync does) has no way to know about
// those tags and silently drops them, orphaning every inline comment on the page. To avoid that,
// fetch the comments that currently exist and re-wrap their anchor text in the freshly generated
// body before publishing it.
async function fetchInlineComments() {
  const comments = [];
  let next = `/${PAGE_ID}/child/comment?expand=extensions.inlineProperties&limit=200`;
  while (next) {
    const data = await (await confluenceFetch(next)).json();
    comments.push(...data.results);
    next = data._links && data._links.next
      ? next.split('?')[0] + '?' + data._links.next.split('?')[1]
      : null;
  }
  return comments
    .filter((c) => c.extensions.location === 'inline' && c.extensions.inlineProperties)
    .map((c) => ({
      id: c.id,
      ref: c.extensions.inlineProperties.markerRef,
      sel: c.extensions.inlineProperties.originalSelection
    }))
    .sort((a, b) => a.id.localeCompare(b.id)); // ascending id as a stable creation-order proxy
}

// True for the closing </a> of a table-of-contents entry, e.g. <a href="#slug">TEXT</a> - lets
// heading text get its marker on the real heading rather than its Contents-list link.
function endsInsideTocLink(body, endIdx) {
  return body.slice(endIdx, endIdx + 4) === '</a>';
}

function restoreCommentMarkers(html, comments) {
  let body = html;
  const usedOccurrences = new Map(); // sel -> how many times it's already been claimed
  let restored = 0;
  const orphaned = [];

  for (const c of comments) {
    const targetOcc = usedOccurrences.get(c.sel) || 0;
    let searchFrom = 0;
    let occ = -1;
    let placed = false;

    while (true) {
      const idx = body.indexOf(c.sel, searchFrom);
      if (idx === -1) break;
      const endIdx = idx + c.sel.length;
      if (!endsInsideTocLink(body, endIdx)) {
        occ++;
        if (occ === targetOcc) {
          body = body.slice(0, idx) +
            `<ac:inline-comment-marker ac:ref="${c.ref}">${c.sel}</ac:inline-comment-marker>` +
            body.slice(endIdx);
          placed = true;
          break;
        }
      }
      searchFrom = idx + 1;
    }

    usedOccurrences.set(c.sel, targetOcc + 1);
    if (placed) restored++;
    else orphaned.push(c);
  }

  console.log(`Restored ${restored}/${comments.length} inline comment anchors.`);
  if (orphaned.length > 0) {
    console.log(`${orphaned.length} comment(s) orphaned - their anchor text no longer appears on the page:`);
    orphaned.forEach((c) => console.log(`  ${c.id}: ${JSON.stringify(c.sel.slice(0, 60))}`));
  }
  return body;
}

async function main() {
  const raw = fs.readFileSync(DOC_PATH, 'utf8');
  const docDir = path.dirname(DOC_PATH);

  const titleMatch = raw.match(/^#\s+(.+?)\r?\n/);
  const title = titleMatch ? titleMatch[1].trim() : 'Digital Waste Tracking: software provider integration guidance';
  const bodyMarkdown = titleMatch ? raw.slice(titleMatch[0].length) : raw;

  await uploadLocalFiles(bodyMarkdown, docDir);

  let html = marked.parse(bodyMarkdown);
  html = replaceImageTagsWithMacros(html);
  html = replaceLocalLinksWithAttachmentLinks(html);
  html = normaliseTables(html);
  html = html.replace(/<hr>/g, '<hr/>').replace(/<br>/g, '<br/>');

  const inlineComments = await fetchInlineComments();
  html = restoreCommentMarkers(html, inlineComments);

  const banner =
    '<ac:structured-macro ac:name="info" ac:schema-version="1"><ac:rich-text-body><p>' +
    '<strong>This page is a mirror.</strong> The source of truth is the GitHub document at ' +
    `<a href="${sourceUrl}">${sourceUrl}</a>. Edit it there, not here &ndash; a GitHub Action keeps ` +
    'this page in sync on every push.</p></ac:rich-text-body></ac:structured-macro>';

  const storageValue = banner + html;

  const current = await (await confluenceFetch(`/${PAGE_ID}?expand=version`)).json();
  const nextVersion = current.version.number + 1;

  await confluenceFetch(`/${PAGE_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: PAGE_ID,
      type: 'page',
      title,
      version: { number: nextVersion },
      body: { storage: { value: storageValue, representation: 'storage' } }
    })
  });

  console.log(`Confluence page "${title}" updated to version ${nextVersion}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
