// Guards the OpenAPI 3.1.0 / JSON Schema 2020-12 alignment recorded in D-003.
//
// Both specs are hand-edited, so the risk this covers is a 3.0-ism creeping
// back in later rather than a mistake in the original migration: `nullable:`
// and the boolean form of `exclusiveMinimum` are the two constructs that a
// 3.0-shaped habit reintroduces most easily, and neither is legal in 3.1.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

// `__dirname` rather than `import.meta.url`, matching docs/event-model/validate:
// babel-jest transpiles this to CommonJS, where `import.meta` isn't available.
const apiDir = path.join(__dirname, '..', '..', 'docs', 'api')
const schemaRoot = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'event-model',
  'schemas'
)

const specs = ['openapi.yaml', 'openapi-beta-1.yaml']

/** Every key/value pair in the document, flattened, so keyword checks don't
 *  depend on where in the tree a schema object happens to sit. */
function* walk(node, trail = []) {
  if (Array.isArray(node)) {
    for (const [i, v] of node.entries()) yield* walk(v, [...trail, i])
    return
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      yield [[...trail, k].join('.'), k, v]
      yield* walk(v, [...trail, k])
    }
  }
}

describe.each(specs)('%s', (file) => {
  const doc = yaml.load(readFileSync(path.join(apiDir, file), 'utf-8'))

  it('declares OpenAPI 3.1.0', () => {
    expect(doc.openapi).toBe('3.1.0')
  })

  it('uses no `nullable` (3.0-only; 3.1 spells this as a type union)', () => {
    const found = [...walk(doc)]
      .filter(([, k]) => k === 'nullable')
      .map(([p]) => p)
    expect(found).toEqual([])
  })

  it('uses no boolean `exclusiveMinimum`/`exclusiveMaximum` (3.1 takes a number)', () => {
    const found = [...walk(doc)]
      .filter(
        ([, k, v]) =>
          /^exclusive(Minimum|Maximum)$/.test(k) && typeof v === 'boolean'
      )
      .map(([p]) => p)
    expect(found).toEqual([])
  })
})

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
