import { Console, Effect } from 'effect'
import { TestRun, TestStep } from './test-runner.js'

export interface Reporter {
  onTestStart(testRun: TestRun): Effect.Effect<void>
  onTestSuccess(testRun: TestRun): Effect.Effect<void>
  onTestFailure(testRun: TestRun, error: Error): Effect.Effect<void>
  onStepStart(testRun: TestRun, step: TestStep): Effect.Effect<void>
  onStepSuccess(testRun: TestRun, step: TestStep): Effect.Effect<void>
  onStepFailure(testRun: TestRun, step: TestStep, error: Error): Effect.Effect<void>
}

export class TestReporterService extends Effect.Service<TestReporterService>()('TestReporterService', {
  effect: Effect.gen(function* () {
    const formatDuration = (start: Date, end?: Date): string => {
      if (!end) return '...'
      const duration = end.getTime() - start.getTime()
      if (duration < 1000) return `${duration}ms`
      return `${(duration / 1000).toFixed(2)}s`
    }

    const consoleReporter: Reporter = {
      onTestStart: (testRun) =>
        Console.log(`\n🎯 Starting test: ${testRun.name}`),

      onTestSuccess: (testRun) =>
        Console.log(
          `✅ Test passed: ${testRun.name} (${formatDuration(testRun.startTime, testRun.endTime)})`,
        ),

      onTestFailure: (testRun, error) =>
        Console.error(
          `❌ Test failed: ${testRun.name} (${formatDuration(testRun.startTime, testRun.endTime)})\n   ${error.message}`,
        ),

      onStepStart: (_testRun, step) =>
        Console.log(`   → Step ${step.index + 1}: ${step.command}`),

      onStepSuccess: (_testRun, step) =>
        Console.log(
          `   ✓ Step ${step.index + 1} completed (${formatDuration(step.startTime!, step.endTime)})`,
        ),

      onStepFailure: (_testRun, step, error) =>
        Console.error(
          `   ✗ Step ${step.index + 1} failed: ${error.message}`,
        ),
    }

    const jsonReporter: Reporter = {
      onTestStart: (testRun) =>
        Console.log(JSON.stringify({ event: 'test:start', testRun })),

      onTestSuccess: (testRun) =>
        Console.log(JSON.stringify({ event: 'test:success', testRun })),

      onTestFailure: (testRun, error) =>
        Console.log(
          JSON.stringify({
            event: 'test:failure',
            testRun,
            error: {
              message: error.message,
              stack: error.stack,
            },
          }),
        ),

      onStepStart: (testRun, step) =>
        Console.log(
          JSON.stringify({
            event: 'step:start',
            testId: testRun.id,
            step,
          }),
        ),

      onStepSuccess: (testRun, step) =>
        Console.log(
          JSON.stringify({
            event: 'step:success',
            testId: testRun.id,
            step,
          }),
        ),

      onStepFailure: (testRun, step, error) =>
        Console.log(
          JSON.stringify({
            event: 'step:failure',
            testId: testRun.id,
            step,
            error: {
              message: error.message,
              stack: error.stack,
            },
          }),
        ),
    }

    const quietReporter: Reporter = {
      onTestStart: () => Effect.succeed(undefined),
      onTestSuccess: (testRun) =>
        Console.log(`✅ ${testRun.name}`),
      onTestFailure: (testRun, error) =>
        Console.error(`❌ ${testRun.name}: ${error.message}`),
      onStepStart: () => Effect.succeed(undefined),
      onStepSuccess: () => Effect.succeed(undefined),
      onStepFailure: () => Effect.succeed(undefined),
    }

    let currentReporter: Reporter = consoleReporter

    const setReporter = (type: 'console' | 'json' | 'quiet') => {
      switch (type) {
        case 'console':
          currentReporter = consoleReporter
          break
        case 'json':
          currentReporter = jsonReporter
          break
        case 'quiet':
          currentReporter = quietReporter
          break
      }
      return Effect.succeed(undefined)
    }

    return {
      onTestStart: (testRun: TestRun) => currentReporter.onTestStart(testRun),
      onTestSuccess: (testRun: TestRun) => currentReporter.onTestSuccess(testRun),
      onTestFailure: (testRun: TestRun, error: Error) => currentReporter.onTestFailure(testRun, error),
      onStepStart: (testRun: TestRun, step: TestStep) => currentReporter.onStepStart(testRun, step),
      onStepSuccess: (testRun: TestRun, step: TestStep) => currentReporter.onStepSuccess(testRun, step),
      onStepFailure: (testRun: TestRun, step: TestStep, error: Error) =>
        currentReporter.onStepFailure(testRun, step, error),
      setReporter,
    } as const
  }),
}) {}