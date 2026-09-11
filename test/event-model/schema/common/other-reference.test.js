/**
 * Placeholder — otherReferenceSchema (otherReferencesForMovement items) is
 * identical across all four events.
 */
import { otherReferenceSchema } from '../../../../docs/collections/data/sharedSchemas.js'

const otherReference = {
  label: 'transferNoteNumber',
  reference: 'TN-2026-000123'
}

test('accepts a valid otherReference', () => {
  const { error } = otherReferenceSchema.validate(otherReference)
  expect(error).toBeUndefined()
})

describe('label', () => {
  test('is required', () => {
    const { label, ...withoutLabel } = otherReference
    const { error } = otherReferenceSchema.validate(withoutLabel)
    expect(error).toBeDefined()
  })
})

describe('reference', () => {
  test('is required', () => {
    const { reference, ...withoutReference } = otherReference
    const { error } = otherReferenceSchema.validate(withoutReference)
    expect(error).toBeDefined()
  })
})

test.todo('rejects an empty string label or reference')
