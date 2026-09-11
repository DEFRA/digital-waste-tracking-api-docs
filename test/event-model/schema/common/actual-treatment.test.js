/**
 * actualTreatmentSchema (sharedSchemas.js) — used at receipt
 * (receiptWasteItemSchema.actualTreatments, receipt/waste-item.test.js, and
 * receiptWithoutDeliveryJoi.js's waste item). disposalOrRecoveryCode is
 * optional here (D-031 amended) — a receiving site may need to inspect or
 * weigh before confirming the code — unlike creation's intendedTreatmentSchema
 * (common/intended-treatment.test.js), where it's unconditionally required.
 * weight is required only when disposalOrRecoveryCode is supplied.
 */
import { actualTreatmentSchema } from '../../../../docs/collections/data/sharedSchemas.js'

const actualTreatment = {
  disposalOrRecoveryCode: 'R1',
  weight: {
    metric: 'Tonnes',
    amount: 0.5,
    isEstimate: true
  }
}

test('accepts a valid actual treatment with a disposalOrRecoveryCode', () => {
  const { error } = actualTreatmentSchema.validate(actualTreatment)
  expect(error).toBeUndefined()
})

test('accepts a valid actual treatment with no disposalOrRecoveryCode or weight', () => {
  const { error } = actualTreatmentSchema.validate({})
  expect(error).toBeUndefined()
})

describe('disposalOrRecoveryCode', () => {
  test('is optional', () => {
    const { disposalOrRecoveryCode, ...withoutCode } = actualTreatment
    const { error } = actualTreatmentSchema.validate(withoutCode)
    expect(error).toBeUndefined()
  })
})

describe('weight', () => {
  test('is required when disposalOrRecoveryCode is present', () => {
    const { weight, ...withoutWeight } = actualTreatment
    const { error } = actualTreatmentSchema.validate(withoutWeight)
    expect(error).toBeDefined()
  })

  test('is optional when disposalOrRecoveryCode is absent', () => {
    const { disposalOrRecoveryCode, weight, ...rest } = actualTreatment
    const { error } = actualTreatmentSchema.validate(rest)
    expect(error).toBeUndefined()
  })
})

test.todo(
  'rejects a disposalOrRecoveryCode not on the R1-R13/D1-D15 reference list'
)
