/**
 * Placeholder — hazardousSchema/hazardousComponentSchema, required on a
 * wasteItem when containsHazardous is true (creation, receipt only). The
 * containsHazardous wiring itself is tested alongside each event's
 * wasteItem, not here. See phase2-payload-resource-analysis.md §2 and §4.
 */
import {
  hazardousSchema,
  hazardousComponentSchema
} from '../../../../docs/collections/data/sharedSchemas.js'

const hazardousWithGuidanceComponents = {
  sourceOfComponents: 'GUIDANCE',
  hazCodes: ['HP_4'],
  components: [{ name: 'Mercury', concentration: 5 }]
}

test('accepts hazardous details sourced from guidance', () => {
  const { error } = hazardousSchema.validate(hazardousWithGuidanceComponents)
  expect(error).toBeUndefined()
})

test('accepts hazardous details with no components when sourceOfComponents is NOT_PROVIDED', () => {
  const { error } = hazardousSchema.validate({
    sourceOfComponents: 'NOT_PROVIDED',
    hazCodes: ['HP_4']
  })
  expect(error).toBeUndefined()
})

describe('sourceOfComponents', () => {
  test('is required', () => {
    const { error } = hazardousSchema.validate({ hazCodes: ['HP_4'] })
    expect(error).toBeDefined()
  })
})

describe('hazCodes', () => {
  test('is required', () => {
    const { error } = hazardousSchema.validate({
      sourceOfComponents: 'NOT_PROVIDED'
    })
    expect(error).toBeDefined()
  })

  test.todo('deduplicates repeated codes')
  test.todo('rejects a code not on the hazardous property code list')
})

describe('components', () => {
  test('is required when sourceOfComponents is GUIDANCE or OWN_TESTING', () => {
    const { error } = hazardousSchema.validate({
      sourceOfComponents: 'OWN_TESTING',
      hazCodes: ['HP_4']
    })
    expect(error).toBeDefined()
  })

  test('is forbidden when sourceOfComponents is NOT_PROVIDED', () => {
    const { error } = hazardousSchema.validate({
      sourceOfComponents: 'NOT_PROVIDED',
      hazCodes: ['HP_4'],
      components: [{ name: 'Mercury' }]
    })
    expect(error).toBeDefined()
  })
})

describe('hazardousComponent', () => {
  test.todo('accepts a null concentration')
})
