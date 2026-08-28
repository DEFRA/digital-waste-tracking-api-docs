---
name: sync-version-scenarios
description: Syncs Gherkin scenarios from all Jira issues on a fix version into markdown feature files under docs/collections/scenarios. Use when the user asks to capture scenarios for a version, sync ticket acceptance criteria into feature files, or populate versioned scenario docs.
---

# Sync version scenarios

Writes Gherkin from Jira tickets on one fix version into `docs/collections/scenarios/<version>/`.

Uses [get-jira-release](../get-jira-release/SKILL.md) and [get-jira-ticket](../get-jira-ticket/SKILL.md). Do not scrape the Jira UI. Do not invent scenarios.

Site and project follow those skills (`ATLASSIAN_BASE_URL`, `JIRA_PROJECT`, script defaults).

## Terminology

Use **version**, not release, milestone, or phase, when talking about the repo folders and this skill.

Jira still has fix versions. A fix version name must start with `beta-<N>:` (N is a non-negative integer). That maps to `docs/collections/scenarios/beta-<N>/`. Legacy `v<N>:` names still parse to `v<N>/`.

## Parameters

`args` is the Jira fix version name or id (quote names). Optional project key first, same rules as get-jira-release.

## Steps

1. **Fetch the Jira fix version and its issues** via get-jira-release. Stop if a script fails.

2. **Resolve the repo folder.** Run:

   ```bash
   bash .cursor/skills/sync-version-scenarios/scripts/parse-version.sh "<version-name>"
   ```

   Use the `Name:` / `.version.name` from the fetched release, not a guessed title. If the script fails, stop and tell the user the fix version must be renamed to `beta-<N>: …`.

3. **Carry forward the previous version** (duplication is required):

   ```bash
   bash .cursor/skills/sync-version-scenarios/scripts/copy-previous.sh beta-<N>
   ```

   This copies `beta-<N-1>/` into `beta-<N>/` when the previous folder exists and the target is empty. If the target already has files, it does not overwrite them with the previous tree.

4. **Fetch every issue** on that fix version. For each key, from the repo root:

   ```bash
   mkdir -p .tmp/jira-tickets/<ticket>
   bash .cursor/skills/get-jira-ticket/scripts/ticket.sh <ticket> full > .tmp/jira-tickets/<ticket>/ticket.txt
   bash .cursor/skills/get-jira-ticket/scripts/ticket.sh <ticket> json > .tmp/jira-tickets/<ticket>/ticket.json
   bash .cursor/skills/get-jira-ticket/scripts/comments.sh <ticket> list > .tmp/jira-tickets/<ticket>/comments.txt
   ```

   Ticket details and comments only. Skip attachments, GitHub, and related tickets unless a script above fails.

   If any fetch fails, stop.

5. **Extract scenarios from each Description** (rendered or wiki text in `ticket.txt` / `ticket.json`).

   Treat as Gherkin when you see `Feature:`, `Scenario:`, `Scenario Outline:`, or `Given` / `When` / `Then` (with `And` / `But`).

   - Copy that Gherkin. Do not rewrite it from scratch.
   - If there is no `Feature:` name, use the ticket summary, or match an existing feature file in this version folder.
   - If the Description has no Gherkin, do not invent it. Record the ticket under **Raised** as having no scenarios in the Description.

6. **Do not write comments into feature files.** If a comment looks like AC or Gherkin, record it under **Raised**. Ask the user before using it.

7. **Write markdown feature files** under `docs/collections/scenarios/beta-<N>/`.

   - One `.md` file per feature.
   - Group under a functional-area folder derived from the ticket (summary, feature title, and Gherkin). Slug the area name the ticket uses. Use `other/` when none is clear. Do not use a fixed list of folder names.
   - If this version already has a folder for that area under an older name, put the file under the ticket's current term and drop the old folder rather than keeping both.
   - Keep Gherkin in a fenced `gherkin` block.
   - Put `source_ticket: KEY-123` in YAML frontmatter (the real ticket key).
   - Filename: slug of the feature title, e.g. `basic-create-endpoint.md`.
   - Keep existing MkDocs frontmatter on files you update if present.

   Template:

   ````markdown
   ---
   source_ticket: KEY-123
   ---

   # Feature title

   ```gherkin
   Feature: Feature title
     Scenario: …
       Given …
       When …
       Then …
   ```
   ````

8. **Replace or drop copied files** only when this version's tickets clearly change earlier behaviour. Say what you changed and why. Prefer updating the existing file (same feature) over adding a duplicate.

9. **Update** `docs/collections/scenarios/beta-<N>/index.md` so it lists the feature pages in that version, grouped by the same functional-area folders.

   Also add that version to the collections sidebar in `tech_docs_template/main.html` (`collections_nav`) if it is missing. Link only the version index (`collections/scenarios/beta-<N>/`), not individual feature files. Do not add a top-level tab in `mkdocs.yml`. Group label is `Scenarios`; item label is `beta-<N>`.

10. **Report** to the user (do not skip this):

    | Section | Contents |
    | ------- | -------- |
    | Folder | `docs/collections/scenarios/beta-<N>/` |
    | Carry-forward | Copied from `beta-<N-1>/`, skipped (target existed), or none |
    | Written | Paths created or updated |
    | Replaced / dropped | Old feature files changed or removed, with reason |
    | Raised | Tickets with no Description Gherkin; comments that look like scenarios; anything else not written |

## Scripts

| Script             | Purpose |
| ------------------ | ------- |
| `parse-version.sh` | Print `beta-<N>` (or legacy `v<N>`) from a Jira version name, or exit 1 |
| `copy-previous.sh` | Copy `beta-<N-1>/` into `beta-<N>/` when the target is empty |

## Examples

```
/sync-version-scenarios "beta-1: Example"
/sync-version-scenarios PROJ "beta-1: Example"
```
