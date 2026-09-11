/**
 * Placeholder — weightSchema is used identically by wasteItem (creation,
 * receipt) and disposalOrRecoveryCode (creation, receipt).
 */
import { weightSchema } from '../../../../docs/collections/data/sharedSchemas.js'

const weight = {
  metric: 'Tonnes',
  amount: 0.5,
  isEstimate: true
}

test('accepts a valid weight', () => {
  const { error } = weightSchema.validate(weight)
  expect(error).toBeUndefined()
})

describe('metric', () => {
  test('is required', () => {
    const { metric, ...withoutMetric } = weight
    const { error } = weightSchema.validate(withoutMetric)
    expect(error).toBeDefined()
  })

  test.todo('rejects a value outside Grams/Kilograms/Tonnes')
})

describe('amount', () => {
  test('is required', () => {
    const { amount, ...withoutAmount } = weight
    const { error } = weightSchema.validate(withoutAmount)
    expect(error).toBeDefined()
  })

  test.todo('rejects zero or negative amounts')
})

describe('isEstimate', () => {
  test('is required', () => {
    const { isEstimate, ...withoutIsEstimate } = weight
    const { error } = weightSchema.validate(withoutIsEstimate)
    expect(error).toBeDefined()
  })

  test.todo('rejects a non-boolean value (strict mode)')
})
