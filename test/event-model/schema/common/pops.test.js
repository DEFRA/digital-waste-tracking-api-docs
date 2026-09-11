/**
 * Placeholder — popsSchema/popComponentSchema, required on a wasteItem when
 * containsPops is true (creation, receipt only). The containsPops wiring
 * itself is tested alongside each event's wasteItem, not here.
 */
import {
  popsSchema,
  popComponentSchema
} from '../../../../docs/collections/data/sharedSchemas.js'

const popsWithGuidanceComponents = {
  sourceOfComponents: 'GUIDANCE',
  components: [{ code: 'PFOS', concentration: 12 }]
}

test('accepts pops with components sourced from guidance', () => {
  const { error } = popsSchema.validate(popsWithGuidanceComponents)
  expect(error).toBeUndefined()
})

test('accepts pops with no components when sourceOfComponents is NOT_PROVIDED', () => {
  const { error } = popsSchema.validate({ sourceOfComponents: 'NOT_PROVIDED' })
  expect(error).toBeUndefined()
})

describe('sourceOfComponents', () => {
  test('is required', () => {
    const { error } = popsSchema.validate({})
    expect(error).toBeDefined()
  })
})

describe('components', () => {
  test('is required when sourceOfComponents is GUIDANCE or OWN_TESTING', () => {
    const { error } = popsSchema.validate({ sourceOfComponents: 'GUIDANCE' })
    expect(error).toBeDefined()
  })

  test('is forbidden when sourceOfComponents is NOT_PROVIDED', () => {
    const { error } = popsSchema.validate({
      sourceOfComponents: 'NOT_PROVIDED',
      components: [{ code: 'PFOS' }]
    })
    expect(error).toBeDefined()
  })

  test('is optional when sourceOfComponents is PROVIDED_WITH_WASTE', () => {
    const { error } = popsSchema.validate({
      sourceOfComponents: 'PROVIDED_WITH_WASTE'
    })
    expect(error).toBeUndefined()
  })
})

describe('popComponent', () => {
  test.todo('rejects a code that is not on the POP reference list')
  test.todo('accepts a null concentration')

  test('accepts concentrationThresholdOperator instead of concentration', () => {
    const { error } = popComponentSchema.validate({
      code: 'PFOS',
      concentrationThresholdOperator: 'LESS_THAN'
    })
    expect(error).toBeUndefined()
  })

  test('rejects concentration and concentrationThresholdOperator together', () => {
    const { error } = popComponentSchema.validate({
      code: 'PFOS',
      concentration: 12,
      concentrationThresholdOperator: 'LESS_THAN'
    })
    expect(error).toBeDefined()
  })
})
