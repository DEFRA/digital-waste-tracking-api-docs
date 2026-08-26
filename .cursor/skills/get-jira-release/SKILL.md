---
name: get-jira-release
description: Fetches a single Jira release (version) and its issues by version name or id. Use when the user asks for one release, tickets in a release, or release details. For a list of all releases, use get-list-of-jira-releases.
---

# Get Jira release

Fetches one release's details and issues to `.tmp/jira-releases/<project>/<version-id>/`.

Site comes from `ATLASSIAN_BASE_URL` if set, otherwise the script default. Project comes from the argument if given, otherwise `JIRA_PROJECT` if set, otherwise the script default.

## Parameters

`args` is required.

- A version name or id: fetch that release from the default project.
- `PROJECT` then version name/id: fetch that release from that project.

Treat a single argument as a project key only when it matches `^[A-Z][A-Z0-9]+$` and a version follows it. A lone argument that is not a project key is a version name.

## Steps

1. From the repo root, fetch that release (quote the version name). Replace `<version>` with the name or id, and `<version-id>` with the numeric id from `release.txt`:

   ```bash
   mkdir -p .tmp/jira-releases/<project>/<version-id>

   bash .cursor/skills/get-jira-release/scripts/release.sh "<version>" <project> full > .tmp/jira-releases/<project>/<version-id>/release.txt
   bash .cursor/skills/get-jira-release/scripts/release.sh "<version>" <project> json > .tmp/jira-releases/<project>/<version-id>/release.json
   bash .cursor/skills/get-jira-release/scripts/release-issues.sh "<version>" <project> list > .tmp/jira-releases/<project>/<version-id>/issues.txt
   bash .cursor/skills/get-jira-release/scripts/release-issues.sh "<version>" <project> json > .tmp/jira-releases/<project>/<version-id>/issues.json
   ```

   If the version id is not known yet, run `release.sh` first (omit `<project>` to use the default), read the `ID:` and `Project:` lines, then write into `.tmp/jira-releases/<project>/<version-id>/`.

   Requires `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` env vars.

   Output:

   | File / folder                                      | Contents                                      |
   | -------------------------------------------------- | --------------------------------------------- |
   | `<version-id>/release.txt` / `release.json`        | One version, dates, and issue counts          |
   | `<version-id>/issues.txt` / `issues.json`          | Issues with this `fixVersion`                 |

2. **If any script fails, stop immediately.** Report the exact error to the user and ask them to fix credentials before retrying. Do not guess release contents from memory or scrape the Jira UI.

3. **Read every file** under `.tmp/jira-releases/<project>/<version-id>/` for this request.

4. Return the full contents to the caller. Do not summarise or filter.

## Scripts

| Script              | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `release.sh`        | One version's details and issue counts               |
| `release-issues.sh` | Issues with that `fixVersion` (paginated JQL search) |

## Examples

```
/get-jira-release "1.0"
/get-jira-release PROJ "1.0"
```
