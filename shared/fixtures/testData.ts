import type { User } from '../types/api.types.js'

function randomId(length = 6): string {
  return Math.random().toString(36).slice(2, 2 + length)
}

export function createRandomUser(): User {
  const idPart = randomId()
  return {
    username: `user_${idPart}`,
    email: `user_${idPart}@example.com`,
    phone: `138${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`,
  }
}

export const webSearchCases = [
  { keyword: 'playwright typescript', expected: 'playwright' },
  { keyword: 'webdriverio appium', expected: 'webdriverio' },
]
