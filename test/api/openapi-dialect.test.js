// Guards the OpenAPI 3.1.0 / JSON Schema 2020-12 alignment recorded in D-003
// for the schemas synced from waste-movement-backend, which the beta specs
// $ref. The beta specs themselves are checked upstream, and openapi.yaml is a
// proof of concept that isn't tested.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// `__dirname` rather than `import.meta.url`, matching docs/event-model/validate:
// babel-jest transpiles this to CommonJS, where `import.meta` isn't available.
const schemaRoot = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'event-model',
  'schemas'
)

function collectSchemaFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return collectSchemaFiles(full)
    return entry.endsWith('.schema.json') ? [full] : []
  })
}

// D-003 holds only while the schemas the specs $ref stay on 2020-12 — the
// dialect OpenAPI 3.1 defaults to. These files are not edited here: they are
// mirrored from waste-movement-backend by `npm run schemas:sync`, so what this
// guards is an upstream dialect change arriving silently on the next sync and
// quietly breaking the alignment D-003 rests on.
describe('event-model schemas', () => {
  it('all declare the 2020-12 dialect', () => {
    const wrong = collectSchemaFiles(schemaRoot)
      .map((f) => [
        path.relative(schemaRoot, f),
        JSON.parse(readFileSync(f, 'utf-8')).$schema
      ])
      .filter(([, s]) => s !== 'https://json-schema.org/draft/2020-12/schema')
    expect(wrong).toEqual([])
  })

  // Upstream declares no `$id` deliberately — the loader keys each schema by
  // its path under src/schemas/, so a path-relative `$id` restated inside the
  // file would be resolved against the retrieval URL when served over HTTP and
  // append the path a second time, 404ing every relative $ref beneath it. That
  // was a live defect here until upstream removed them; nothing on either side
  // asserts they stay out, so this catches one arriving back on the next sync.
  it('declare no `$id` (the file path is its identity — see the mirror README)', () => {
    const withId = collectSchemaFiles(schemaRoot)
      .map((f) => [
        path.relative(schemaRoot, f),
        JSON.parse(readFileSync(f, 'utf-8')).$id
      ])
      .filter(([, id]) => id !== undefined)
    expect(withId).toEqual([])
  })
})
