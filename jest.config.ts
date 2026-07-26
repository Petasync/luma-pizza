import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // SWC schreibt den @/-Alias nur in echten import-Zeilen um — der Dateiname in
  // jest.mock('@/lib/…') bleibt unangetastet und war für Jest dann unauffindbar.
  // Diese Zuordnung macht den Alias auch dort nutzbar.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
