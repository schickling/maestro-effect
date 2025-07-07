#!/usr/bin/env node
import { Args, Command, Options } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect, Layer, Option, pipe } from 'effect'
import { MaestroCliService } from '../services/maestro-cli.js'
import { FlowCompilerService } from '../services/flow-compiler.js'
import { TestRunnerService } from '../services/test-runner.js'
import { TestReporterService } from '../services/test-reporter.js'
import { flow } from '../builder/flow-builder.js'
import * as fs from 'node:fs/promises'
import * as Path from 'node:path'

// Common options
const hostOption = Options.text('host').pipe(
  Options.withDescription('Maestro host'),
  Options.optional,
)

const portOption = Options.integer('port').pipe(
  Options.withDescription('Maestro port'),
  Options.optional,
)

const platformOption = Options.choice('platform', ['ios', 'android'] as const).pipe(
  Options.withDescription('Target platform'),
  Options.optional,
)

const udidOption = Options.text('udid').pipe(
  Options.withDescription('Device UDID'),
  Options.optional,
)

const reporterOption = Options.choice('reporter', ['console', 'json', 'quiet'] as const).pipe(
  Options.withDescription('Test reporter format'),
  Options.withDefault('console' as const),
)

// Helper to convert Option to undefined
const optionToUndefined = <T>(opt: Option.Option<T>): T | undefined =>
  Option.match(opt, {
    onNone: () => undefined,
    onSome: (value) => value,
  })

// Test command
const testCommand = Command.make('test', {
  args: Args.file({ name: 'flow' }),
  host: hostOption,
  port: portOption,
  platform: platformOption,
  udid: udidOption,
  reporter: reporterOption,
  continuous: Options.boolean('continuous').pipe(
    Options.withDescription('Run tests in continuous mode'),
    Options.withDefault(false),
  ),
  keepTempFiles: Options.boolean('keep-temp-files').pipe(
    Options.withDescription('Keep temporary YAML files after test run'),
    Options.withDefault(false),
  ),
  stepByStep: Options.boolean('step-by-step').pipe(
    Options.withDescription('Run each step individually'),
    Options.withDefault(false),
  ),
}, (args) =>
  Effect.gen(function* () {
    const maestroCli = yield* MaestroCliService
    const reporter = yield* TestReporterService

    yield* reporter.setReporter(args.reporter)

    // Check if the input is a YAML file or TypeScript file
    if (args.args.endsWith('.yaml') || args.args.endsWith('.yml')) {
      // Run YAML file directly
      yield* maestroCli.test(args.args, {
        host: optionToUndefined(args.host),
        port: optionToUndefined(args.port),
        platform: optionToUndefined(args.platform),
        udid: optionToUndefined(args.udid),
        continuous: args.continuous,
      })
    } else if (args.args.endsWith('.ts') || args.args.endsWith('.js')) {
      // Load and compile TypeScript/JavaScript flow
      yield* Console.error('TypeScript flow execution not yet implemented')
      yield* Effect.fail(new Error('TypeScript flow execution coming soon'))
    } else {
      yield* Console.error(`Unsupported file type: ${args.args}`)
      yield* Effect.fail(new Error('File must be .yaml, .yml, .ts, or .js'))
    }
  }),
).pipe(
  Command.withDescription('Run a Maestro test flow'),
)

// Compile command
const compileCommand = Command.make('compile', {
  args: Args.text({ name: 'name' }),
  output: Options.directory('output').pipe(
    Options.withDescription('Output directory for YAML files'),
    Options.withDefault('./maestro-output'),
  ),
  single: Options.boolean('single').pipe(
    Options.withDescription('Generate a single YAML file instead of multiple'),
    Options.withDefault(false),
  ),
}, (args) =>
  Effect.gen(function* () {
    const compiler = yield* FlowCompilerService

    // Example flow for demonstration
    const exampleFlow = flow(args.args)
      .appId('com.example.app')
      .launchApp()
      .tapOn('login-button')
      .inputText('test@example.com', 'email')
      .inputText('password123', 'password')
      .tapOn('submit')
      .assertVisible('dashboard')
      .build()

    yield* Console.log(`Compiling flow: ${args.args}`)

    if (args.single) {
      const outputPath = Path.join(args.output, `${args.args}.yaml`)
      yield* Effect.tryPromise(() => fs.mkdir(args.output, { recursive: true }))
      const result = yield* compiler.compileSingleFile(exampleFlow, outputPath)
      yield* Console.log(`Generated: ${result.path}`)
    } else {
      const result = yield* compiler.compileFlow(exampleFlow, { outputDir: args.output })
      yield* Console.log(`Generated ${result.files.length} files in: ${result.outputDir}`)
      for (const file of result.files) {
        yield* Console.log(`  - ${file.name}`)
      }
    }
  }),
).pipe(
  Command.withDescription('Compile a flow to YAML files'),
)

// Studio command
const studioCommand = Command.make('studio', {
  host: hostOption,
  port: portOption,
  platform: platformOption,
  udid: udidOption,
}, (args) =>
  Effect.gen(function* () {
    const maestroCli = yield* MaestroCliService
    yield* Console.log('Starting Maestro Studio...')
    yield* maestroCli.studio({
      host: optionToUndefined(args.host),
      port: optionToUndefined(args.port),
      platform: optionToUndefined(args.platform),
      udid: optionToUndefined(args.udid),
    })
  }),
).pipe(
  Command.withDescription('Launch Maestro Studio'),
)

// Record command
const recordCommand = Command.make('record', {
  args: Args.file({ name: 'output' }),
  host: hostOption,
  port: portOption,
  platform: platformOption,
  udid: udidOption,
}, (args) =>
  Effect.gen(function* () {
    const maestroCli = yield* MaestroCliService
    yield* Console.log(`Recording flow to: ${args.args}`)
    yield* maestroCli.record(args.args, {
      host: optionToUndefined(args.host),
      port: optionToUndefined(args.port),
      platform: optionToUndefined(args.platform),
      udid: optionToUndefined(args.udid),
    })
  }),
).pipe(
  Command.withDescription('Record a new flow'),
)

// Download samples command
const downloadSamplesCommand = Command.make('download-samples', {}, () =>
  Effect.gen(function* () {
    const maestroCli = yield* MaestroCliService
    yield* Console.log('Downloading Maestro samples...')
    yield* maestroCli.downloadSamples()
  }),
).pipe(
  Command.withDescription('Download Maestro sample flows'),
)

// Main CLI
const cli = Command.make('maestro-effect').pipe(
  Command.withDescription('Effect-native wrapper for Maestro mobile testing'),
  Command.withSubcommands([
    testCommand,
    compileCommand,
    studioCommand,
    recordCommand,
    downloadSamplesCommand,
  ]),
)

// Run the CLI
const main = Command.run(cli, {
  name: 'maestro-effect',
  version: '0.0.1',
})

// Create the runtime layer
const MainLayer = Layer.mergeAll(
  MaestroCliService.Default,
  FlowCompilerService.Default,
  TestRunnerService.Default,
  TestReporterService.Default,
)

// Run the program
pipe(
  main(process.argv.slice(2)),
  Effect.provide(MainLayer),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain,
)