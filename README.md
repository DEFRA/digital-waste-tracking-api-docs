# digital-waste-tracking-api-docs

## Running the docs locally

```
python3 -m venv .venv
source .venv/bin/activate
pip install mkdocs-material mike mkdocs-swagger-ui-tag
mkdocs serve
```

Open http://127.0.0.1:8000/digital-waste-tracking-api-docs/

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
