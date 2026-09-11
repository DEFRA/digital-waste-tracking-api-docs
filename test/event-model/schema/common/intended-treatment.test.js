/**
 * intendedTreatmentSchema (sharedSchemas.js) — used only at creation
 * (createWasteItemSchema.intendedTreatments, creation/waste-item.test.js).
 * Both disposalOrRecoveryCode and weight are unconditionally required here,
 * unlike receipt's actualTreatmentSchema (common/actual-treatment.test.js),
 * where disposalOrRecoveryCode is optional and weight is conditional on it.
 */
import { intendedTreatmentSchema } from '../../../../docs/collections/data/sharedSchemas.js'

const intendedTreatment = {
  disposalOrRecoveryCode: 'R1',
  weight: {
    metric: 'Tonnes',
    amount: 0.5,
    isEstimate: true
  }
}

test('accepts a valid intended treatment', () => {
  const { error } = intendedTreatmentSchema.validate(intendedTreatment)
  expect(error).toBeUndefined()
})

describe('disposalOrRecoveryCode', () => {
  test('is required', () => {
    const { disposalOrRecoveryCode, ...withoutCode } = intendedTreatment
    const { error } = intendedTreatmentSchema.validate(withoutCode)
    expect(error).toBeDefined()
  })
})

describe('weight', () => {
  test('is required', () => {
    const { weight, ...withoutWeight } = intendedTreatment
    const { error } = intendedTreatmentSchema.validate(withoutWeight)
    expect(error).toBeDefined()
  })
})

test.todo(
  'rejects a disposalOrRecoveryCode not on the R1-R13/D1-D15 reference list'
)
