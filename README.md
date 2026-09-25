# digital-waste-tracking-api-docs

## Running the docs locally

```
python3 -m venv .venv
source .venv/bin/activate
pip install mkdocs-material mike mkdocs-swagger-ui-tag
mkdocs serve
```

Open http://127.0.0.1:8000/digital-waste-tracking-api-docs/

## Syncing the event-model schemas

The JSON Schemas under `docs/event-model/schemas/` are a committed copy of `waste-movement-backend`'s `src/schemas/`, which is the source of truth. `docs/api/openapi.yaml` `$ref`s them, so the copy is what makes the spec render. To pull the latest from the backend's `main`:

```
npm run schemas:sync
```

Commit whatever it changes. **Do not edit anything under that folder by hand** — a rule change is a PR against `waste-movement-backend`, then a sync. A CI check re-runs the sync on every PR and fails visibly when the committed copy has fallen behind. See `docs/event-model/schemas/README.md` for the details.

## Prettifying markdown files

Formatting rules live in `.prettierrc`. To format all markdown files in the repo:

```
npx prettier --write "**/*.md"
```

To check formatting without changing anything (e.g. in CI):

```
npx prettier --check "**/*.md"
```

### Excluding mkdocs-material admonitions

Prettier reformats indented admonition blocks (e.g. `!!! warning "..."`) by collapsing their indented body onto the same line, which breaks mkdocs-material's syntax. Precede any such block with a `<!-- prettier-ignore -->` comment so Prettier skips it:

```markdown
<!-- prettier-ignore -->
!!! warning "Internal documentation"
    This page is internal design/planning material for the delivery team...
```
