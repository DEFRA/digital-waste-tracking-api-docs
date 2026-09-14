// Compiles every event-model JSON Schema file (schema/common/**/*.schema.json
// plus schema/<event>/**/*.schema.json, once those exist) with ajv, and
// exposes a single validate(name, payload) entry point keyed by each schema
// file's own $id (e.g. "producer.schema.json"). See
// docs/plans/20260908-event-model-json-schema.md.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { registerFormats } from './formats.js'

// `__dirname`, not `import.meta.url`/`import.meta.dirname`: babel-jest
// transpiles this file to CommonJS for the test run (per babel.config.js's
// `modules: 'auto'`), where `import.meta` isn't available but Node's
// module-wrapper-supplied `__dirname` is. Resolved relative to this module's
// own location rather than process.cwd() so it's independent of where
// `jest`/`node` is invoked from.
const schemaRoot = path.join(__dirname, '..', 'schema')

function collectSchemaFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      return collectSchemaFiles(fullPath)
    }
    return entry.endsWith('.schema.json') ? [fullPath] : []
  })
}

const ajv = new Ajv({ allErrors: true, strict: true })
addFormats(ajv)
registerFormats(ajv)

for (const file of collectSchemaFiles(schemaRoot)) {
  ajv.addSchema(JSON.parse(readFileSync(file, 'utf-8')))
}

/**
 * Validates `payload` against the schema registered under `name` (its bare
 * $id, e.g. "producer.schema.json"). Returns true/false, same as calling an
 * ajv-compiled validate function directly — use getErrors(name) after a
 * `false` result to see why.
 */
export function validate(name, payload) {
  const validateFn = ajv.getSchema(name)
  if (!validateFn) {
    throw new Error(`No schema registered with $id "${name}".`)
  }
  return validateFn(payload)
}

/**
 * The ajv validation errors from the most recent validate(name, ...) call
 * against that schema, or null if it last passed / hasn't run yet.
 */
export function getErrors(name) {
  return ajv.getSchema(name)?.errors ?? null
}

export { ajv }
