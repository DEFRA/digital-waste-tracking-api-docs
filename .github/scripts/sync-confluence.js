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

// Confluence Cloud auto-versions an attachment when you upload one with a name that already exists.
async function uploadAttachment(filePath) {
  const filename = path.basename(filePath);
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(filePath)]), filename);
  await confluenceFetch(`/${PAGE_ID}/child/attachment`, {
    method: 'POST',
    headers: { 'X-Atlassian-Token': 'nocheck' },
    body: form
  });
  console.log(`Uploaded attachment: ${filename}`);
  return filename;
}

// marked doesn't treat colon-namespaced tags (ac:image, ri:attachment) as passthrough HTML -
// it escapes them - so images are converted normally to <img> first, then swapped for the
// Confluence macro as an HTML post-processing step instead of a markdown pre-processing one.
async function uploadLocalImages(markdown, docDir) {
  const imagePattern = /!\[[^\]]*\]\((?!https?:\/\/)([^)]+)\)/g;
  for (const match of markdown.matchAll(imagePattern)) {
    await uploadAttachment(path.join(docDir, match[1]));
  }
}

function replaceImageTagsWithMacros(html) {
  return html.replace(/<img src="([^"]+)" alt="([^"]*)"\s*\/?>/g, (_, src, alt) => {
    if (/^https?:\/\//.test(src)) return _; // leave external images alone
    const filename = path.basename(src);
    return `<ac:image ac:alt="${alt}"><ri:attachment ri:filename="${filename}" /></ac:image>`;
  });
}

function normaliseTables(html) {
  let out = html.replace(/<\/?thead>/g, '').replace(/<\/?tbody>/g, '');
  out = out.replace(/<table>/g, '<table><tbody>').replace(/<\/table>/g, '</tbody></table>');
  return out;
}

async function main() {
  const raw = fs.readFileSync(DOC_PATH, 'utf8');
  const docDir = path.dirname(DOC_PATH);

  const titleMatch = raw.match(/^#\s+(.+?)\r?\n/);
  const title = titleMatch ? titleMatch[1].trim() : 'Digital Waste Tracking: software provider integration guidance';
  const bodyMarkdown = titleMatch ? raw.slice(titleMatch[0].length) : raw;

  await uploadLocalImages(bodyMarkdown, docDir);

  let html = marked.parse(bodyMarkdown);
  html = replaceImageTagsWithMacros(html);
  html = normaliseTables(html);
  html = html.replace(/<hr>/g, '<hr/>').replace(/<br>/g, '<br/>');

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
