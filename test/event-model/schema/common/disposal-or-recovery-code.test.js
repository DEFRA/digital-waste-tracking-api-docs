/**
 * Placeholder — disposalOrRecoveryCodeSchema (code + weight) is identical
 * in shape at creation (required, "Intended Treatment") and receipt
 * (optional, "Actual Treatment"), but is only exported from receiptJoi.js
 * today; creationJoi.js defines a matching copy locally, unexported. Treated
 * as one shared resource here — if the duplication is ever collapsed to a
 * single import, this test keeps working unchanged. Requiredness at each
 * event is tested alongside that event's wasteItem, not here. See
 * phase2-payload-resource-analysis.md §2 and §5.
 */
import { disposalOrRecoveryCodeSchema } from '../../../../docs/collections/data/receiptJoi.js'

const disposalOrRecoveryCode = {
  code: 'R1',
  weight: {
    metric: 'Tonnes',
    amount: 0.5,
    isEstimate: true
  }
}

test('accepts a valid disposalOrRecoveryCode entry', () => {
  const { error } = disposalOrRecoveryCodeSchema.validate(
    disposalOrRecoveryCode
  )
  expect(error).toBeUndefined()
})

describe('code', () => {
  test('is required', () => {
    const { code, ...withoutCode } = disposalOrRecoveryCode
    const { error } = disposalOrRecoveryCodeSchema.validate(withoutCode)
    expect(error).toBeDefined()
  })

  test.todo(
    'rejects a code not on the disposal-or-recovery-codes reference list'
  )
})

describe('weight', () => {
  test('is required', () => {
    const { weight, ...withoutWeight } = disposalOrRecoveryCode
    const { error } = disposalOrRecoveryCodeSchema.validate(withoutWeight)
    expect(error).toBeDefined()
  })
})
