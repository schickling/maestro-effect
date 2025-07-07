import { describe, test, expect } from 'vitest'
import { Effect } from 'effect'
import { flow } from '../src/builder/flow-builder.js'
import { FlowCompilerService } from '../src/services/flow-compiler.js'

describe('FlowCompilerService', () => {
  test('compiles simple flow to YAML', async () => {
    await Effect.gen(function* (_) {
      const compiler = yield* _(FlowCompilerService)
      
      const testFlow = flow('Test Flow')
        .appId('com.test.app')
        .launchApp()
        .tapOn('button')
        .inputText('hello')
        .assertVisible('result')
        .build()

      const result = yield* _(compiler.compileFlow(testFlow))
      
      expect(result.files).toHaveLength(5) // config + 4 commands
      expect(result.files[0].name).toBe('000-config.yaml')
      expect(result.files[1].name).toBe('001-step.yaml')
      
      // Check config YAML
      expect(result.files[0].yaml).toContain('appId: com.test.app')
      expect(result.files[0].yaml).toContain('name: Test Flow')
      
      // Check command YAMLs
      expect(result.files[1].yaml).toContain('launchApp')
      expect(result.files[2].yaml).toContain('tapOn: button')
      expect(result.files[3].yaml).toContain('inputText: hello')
      expect(result.files[4].yaml).toContain('assertVisible: result')
    }).pipe(
      Effect.provide(FlowCompilerService.Default),
      Effect.runPromise,
    )
  })

  test('compiles single file flow', async () => {
    await Effect.gen(function* (_) {
      const compiler = yield* _(FlowCompilerService)
      
      const testFlow = flow('Single File Test')
        .appId('com.test.app')
        .launchApp()
        .tapOn('button')
        .build()

      const tempPath = '/tmp/test-flow.yaml'
      const result = yield* _(compiler.compileSingleFile(testFlow, tempPath))
      
      expect(result.path).toBe(tempPath)
      expect(result.yaml).toContain('appId: com.test.app')
      expect(result.yaml).toContain('---')
      expect(result.yaml).toContain('- launchApp')
      expect(result.yaml).toContain('- tapOn: button')
    }).pipe(
      Effect.provide(FlowCompilerService.Default),
      Effect.runPromise,
    )
  })
})