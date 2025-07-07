import { Effect, Stream, pipe } from 'effect'
import { FileSystem } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import * as Path from 'node:path'
import { Flow } from '../schemas/index.js'
import { FlowCompilerService } from './flow-compiler.js'
import { MaestroCliService, TestOptions } from './maestro-cli.js'
import { TestReporterService } from './test-reporter.js'

export interface TestRun {
  id: string
  name: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'passed' | 'failed' | 'skipped'
  error?: Error
  outputDir?: string
  steps: TestStep[]
}

export interface TestStep {
  index: number
  command: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  startTime?: Date
  endTime?: Date
  error?: Error
}

export interface RunOptions extends TestOptions {
  reporter?: 'console' | 'json' | 'quiet'
  keepTempFiles?: boolean
  stepByStep?: boolean
  screenshotOnFailure?: boolean
}

export class TestRunnerService extends Effect.Service<TestRunnerService>()('TestRunnerService', {
  effect: Effect.gen(function* () {
    const flowCompiler = yield* FlowCompilerService
    const maestroCli = yield* MaestroCliService
    const reporter = yield* TestReporterService
    const fs = yield* FileSystem.FileSystem

    const generateRunId = () => `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const runFlow = Effect.fn('TestRunnerService.runFlow')(
      (flow: Flow, options: RunOptions = {}) =>
        Effect.gen(function* () {
          const runId = generateRunId()
          const testName = flow.config?.name ?? 'Unnamed Test'

          const testRun: TestRun = {
            id: runId,
            name: testName,
            startTime: new Date(),
            status: 'running',
            steps: [],
          }

          yield* reporter.onTestStart(testRun)

          try {
            // Compile the flow to YAML files
            const compiled = yield* flowCompiler.compileFlow(flow)
            testRun.outputDir = compiled.outputDir

            // Initialize steps
            testRun.steps = flow.commands.map((_, index) => ({
              index,
              command: compiled.files[index + (flow.config ? 1 : 0)]?.name ?? `step-${index}`,
              status: 'pending' as const,
            }))

            if (options.stepByStep) {
              // Run each step individually
              for (const [index, file] of compiled.files.entries()) {
                if (file.name === '000-config.yaml') continue

                const stepIndex = flow.config ? index - 1 : index
                const step = testRun.steps[stepIndex]
                if (!step) continue

                step.status = 'running'
                step.startTime = new Date()
                yield* reporter.onStepStart(testRun, step)

                const result = yield* pipe(
                  maestroCli.test(file.path, options),
                  Effect.either,
                )

                step.endTime = new Date()

                if (result._tag === 'Left') {
                  step.status = 'failed'
                  step.error = result.left
                  yield* reporter.onStepFailure(testRun, step, result.left)

                  if (options.screenshotOnFailure) {
                    // TODO: Implement screenshot capture
                  }

                  throw result.left
                } else {
                  step.status = 'passed'
                  yield* reporter.onStepSuccess(testRun, step)
                }
              }
            } else {
              // Run all steps as a single flow
              const flowFile = Path.join(compiled.outputDir, 'flow.yaml')
              yield* flowCompiler.compileSingleFile(flow, flowFile)

              const result = yield* pipe(
                maestroCli.test(flowFile, options),
                Effect.either,
              )

              if (result._tag === 'Left') {
                testRun.steps.forEach((step) => {
                  step.status = 'failed'
                })
                throw result.left
              } else {
                testRun.steps.forEach((step) => {
                  step.status = 'passed'
                })
              }
            }

            testRun.status = 'passed'
            testRun.endTime = new Date()
            yield* reporter.onTestSuccess(testRun)

            // Cleanup temp files unless requested to keep
            if (!options.keepTempFiles && testRun.outputDir) {
              yield* flowCompiler.cleanup(testRun.outputDir)
            }

            return testRun
          } catch (error) {
            testRun.status = 'failed'
            testRun.endTime = new Date()
            testRun.error = error as Error
            yield* reporter.onTestFailure(testRun, error as Error)

            // Keep temp files on failure for debugging
            if (!options.keepTempFiles && testRun.outputDir && testRun.status === 'failed') {
              // Don't cleanup on failure - keep for debugging
            }

            return yield* Effect.fail(error)
          }
        }),
    )

    const runFlows = (flows: Flow[], options: RunOptions = {}): Stream.Stream<TestRun, never, MaestroCliService | TestReporterService | FlowCompilerService | FileSystem.FileSystem> =>
      Stream.fromIterable(flows).pipe(
        Stream.mapEffect((flow) =>
          pipe(
            runFlow(flow, options),
            Effect.either,
            Effect.map((result) => {
              if (result._tag === 'Right') {
                return result.right
              } else {
                // Continue with other flows even if one fails
                return {
                  id: generateRunId(),
                  name: flow.config?.name ?? 'Unnamed Test',
                  startTime: new Date(),
                  endTime: new Date(),
                  status: 'failed' as const,
                  error: result.left as Error,
                  steps: [],
                }
              }
            })
          )
        )
      )

    const runDirectory = Effect.fn('TestRunnerService.runDirectory')(
      (directory: string, options: RunOptions = {}) =>
        Effect.gen(function* () {
          // Find all .yaml files in directory
          const files = yield* fs.readDirectory(directory)
          const yamlFiles = files.filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))

          // Run tests using Maestro CLI directly for now
          // TODO: Parse YAML files and convert to Flow objects
          yield* maestroCli.test(directory, options)
          
          return {
            directory,
            filesRun: yamlFiles.length,
            status: 'completed' as const,
          }
        }),
    )

    return {
      runFlow,
      runFlows,
      runDirectory,
    } as const
  }),
  dependencies: [FlowCompilerService.Default, MaestroCliService.Default, TestReporterService.Default, NodeFileSystem.layer],
}) {}