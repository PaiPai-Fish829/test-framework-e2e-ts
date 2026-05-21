import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

interface ParsedCases<T> {
  cases?: T[]
}

export function loadYamlCases<T>(fixtureRelativePath: string): T[] {
  if (!fixtureRelativePath || typeof fixtureRelativePath !== 'string') {
    throw new Error('fixtureRelativePath must be a non-empty string')
  }

  const currentFile = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFile)
  const fixtureFile = path.resolve(currentDir, '../fixtures', fixtureRelativePath)

  let raw = ''
  try {
    raw = readFileSync(fixtureFile, 'utf8')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read YAML fixture "${fixtureRelativePath}" (${fixtureFile}): ${message}`)
  }

  let parsed: ParsedCases<T>
  try {
    parsed = yaml.load(raw) as ParsedCases<T>
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse YAML fixture "${fixtureRelativePath}" (${fixtureFile}): ${message}`)
  }

  if (!Array.isArray(parsed?.cases) || parsed.cases.length === 0) {
    throw new Error(`YAML fixture "${fixtureRelativePath}" must contain a non-empty "cases" array`)
  }

  return parsed.cases
}
