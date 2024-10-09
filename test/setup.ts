import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

// Setup any global configuration or mocks you need
beforeAll(() => {
  console.log('Running setup before all tests...')
  // You can initialize global variables, mocks, or anything required before tests here
})

afterAll(() => {
  console.log('Running cleanup after all tests...')
  // Clean up any resources after all tests complete
})

beforeEach(() => {
  console.log('Running before each test...')
  // Run before every test, e.g., resetting states or mocks
})

afterEach(() => {
  console.log('Running after each test...')
  // Run after each test, e.g., clearing mocks
})

// You can also add any global mock here if necessary for Electron
globalThis.mockFunction = () => {
  // Mock something here if needed
}
