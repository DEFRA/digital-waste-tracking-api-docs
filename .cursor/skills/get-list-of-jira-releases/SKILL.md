---
name: get-list-of-jira-releases
description: Gets a list of all Jira project releases (versions) without fetching each release's details or issues. Use when the user asks for a list of releases, all versions, or the project release page.
---

# Get list of Jira releases

Gets every version in a project to `.tmp/jira-releases/`. Does not fetch individual release details or issues.

Site comes from `ATLASSIAN_BASE_URL` if set, otherwise the script default. Project comes from the argument if given, otherwise `JIRA_PROJECT` if set, otherwise the script default.

## Parameters

`args` is optional.

- No args: list releases for the default project.
- A project key (e.g. `PROJ`): list releases for that project.

## Steps

1. From the repo root, create the output directory and list releases only. Replace `<project>` with the project key. Omit the project argument to use the default:

   ```bash
   mkdir -p .tmp/jira-releases/<project>

   bash .cursor/skills/get-list-of-jira-releases/scripts/releases.sh <project> list > .tmp/jira-releases/<project>/releases.txt
   bash .cursor/skills/get-list-of-jira-releases/scripts/releases.sh <project> json > .tmp/jira-releases/<project>/releases.json
   ```

   If the project key is not known yet, omit it and write to `.tmp/jira-releases/releases.txt` and `.tmp/jira-releases/releases.json`, then read the project from those files.

   Do not run `release.sh` or `release-issues.sh`. This skill is the catalogue only.

   Requires `ATLASSIAN_USER` and `ATLASSIAN_TOKEN` env vars.

   Output:

   | File                         | Contents                                      |
   | ---------------------------- | --------------------------------------------- |
   | `releases.txt`               | Name, id, dates, status, issue-status counts  |
   | `releases.json`              | Raw version list                              |

2. **If any script fails, stop immediately.** Report the exact error to the user and ask them to fix credentials before retrying. Do not guess releases from memory or scrape the Jira UI.

3. **Read** `releases.txt` and `releases.json`.

4. Return the full list to the caller. Do not summarise or filter.

## Scripts

| Script        | Purpose                        |
| ------------- | ------------------------------ |
| `releases.sh` | List all versions in a project |

## Examples

```
/get-list-of-jira-releases
/get-list-of-jira-releases PROJ
```
