import { describe, expect, it } from 'vitest'

import { maskEmail, maskPhone } from '../../../shared/utils/mask.util.js'

describe('mask util', () => {
  it('maskPhone should hide middle four digits', () => {
    expect(maskPhone('13812345678')).toBe('138****5678')
  })

  it('maskEmail should hide local part', () => {
    expect(maskEmail('autotest@example.com')).toBe('au***@example.com')
  })
})
