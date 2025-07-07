import { Effect, pipe } from 'effect'
import { Command, CommandExecutor } from '@effect/platform'
import { NodeCommandExecutor, NodeFileSystem } from '@effect/platform-node'
import { FileSystem } from '@effect/platform'
import { MaestroCliExecutionError, MaestroCliNotFoundError } from '../errors/index.js'

export interface MaestroCliOptions {
  host?: string | undefined
  port?: number | undefined
  udid?: string | undefined
  platform?: 'ios' | 'android' | undefined
  env?: Record<string, string> | undefined
}

export interface TestOptions extends MaestroCliOptions {
  continuous?: boolean
  format?: 'junit' | 'html'
  output?: string
  includeTags?: string[]
  excludeTags?: string[]
  flatten?: boolean
  depth?: number
}

export interface CloudTestOptions {
  apiKey: string
  appFile?: string
  uploadName?: string
  repoOwner?: string
  repoName?: string
  branch?: string
  commitSha?: string
  pullRequestId?: string
  includeTags?: string[]
  excludeTags?: string[]
  env?: Record<string, string>
}

export class MaestroCliService extends Effect.Service<MaestroCliService>()('MaestroCliService', {
  effect: Effect.gen(function* () {
    const executor = yield* CommandExecutor.CommandExecutor
    const fs = yield* FileSystem.FileSystem

    const findMaestroBinary = Effect.gen(function* () {
      // Check if maestro is in PATH
      const whichResult = yield* pipe(
        Command.make('which', 'maestro'),
        executor.exitCode,
        Effect.either,
      )

      if (whichResult._tag === 'Right' && whichResult.right === 0) {
        return 'maestro'
      }

      // Check common installation locations
      const possiblePaths = [
        '/usr/local/bin/maestro',
        `${process.env['HOME']}/.maestro/bin/maestro`,
        `${process.env['HOME']}/.local/bin/maestro`,
      ]

      for (const path of possiblePaths) {
        const exists = yield* pipe(fs.exists(path), Effect.orElseSucceed(() => false))
        if (exists) {
          return path
        }
      }

      return yield* new MaestroCliNotFoundError({
        message: 'Maestro CLI not found. Please install Maestro from https://maestro.mobile.dev',
      })
    })

    const buildArgs = (options: MaestroCliOptions, ...extraArgs: string[]): string[] => {
      const args: string[] = []

      if (options.host) args.push('--host', options.host)
      if (options.port) args.push('--port', options.port.toString())
      if (options.udid) args.push('--udid', options.udid)
      if (options.platform) args.push('--platform', options.platform)

      args.push(...extraArgs)
      return args
    }

    const runCommand = (args: string[], options?: MaestroCliOptions) =>
      Effect.gen(function* () {
        const maestroPath = yield* findMaestroBinary
        
        let cmd = Command.make(maestroPath, ...args)
        
        if (options?.env) {
          const fullEnv = { ...process.env, ...options.env }
          cmd = cmd.pipe(Command.env(fullEnv))
        }

        const exitCode = yield* executor.exitCode(cmd)

        if (exitCode !== 0) {
          return yield* new MaestroCliExecutionError({
            message: `Maestro command failed with exit code ${exitCode}`,
            command: `${maestroPath} ${args.join(' ')}`,
            exitCode,
            stdout: '',
            stderr: '',
          })
        }
      })

    const test = Effect.fn('MaestroCliService.test')(
      (flowPath: string, options: TestOptions = {}) =>
        Effect.gen(function* () {
          const args = buildArgs(options, 'test')

          if (options.continuous) args.push('--continuous')
          if (options.format) args.push('--format', options.format)
          if (options.output) args.push('--output', options.output)
          if (options.includeTags) {
            options.includeTags.forEach((tag) => args.push('--include-tags', tag))
          }
          if (options.excludeTags) {
            options.excludeTags.forEach((tag) => args.push('--exclude-tags', tag))
          }
          if (options.flatten !== undefined) args.push('--flatten-debug-output', options.flatten.toString())
          if (options.depth !== undefined) args.push('--depth', options.depth.toString())

          args.push(flowPath)

          yield* runCommand(args, options)
        }),
    )

    const cloud = Effect.fn('MaestroCliService.cloud')(
      (flowPath: string, options: CloudTestOptions) =>
        Effect.gen(function* () {
          const args = ['cloud', '--api-key', options.apiKey]

          if (options.appFile) args.push('--app-file', options.appFile)
          if (options.uploadName) args.push('--name', options.uploadName)
          if (options.repoOwner) args.push('--repo-owner', options.repoOwner)
          if (options.repoName) args.push('--repo-name', options.repoName)
          if (options.branch) args.push('--branch', options.branch)
          if (options.commitSha) args.push('--commit-sha', options.commitSha)
          if (options.pullRequestId) args.push('--pull-request-id', options.pullRequestId)
          if (options.includeTags) {
            options.includeTags.forEach((tag) => args.push('--include-tags', tag))
          }
          if (options.excludeTags) {
            options.excludeTags.forEach((tag) => args.push('--exclude-tags', tag))
          }

          args.push(flowPath)

          yield* runCommand(args, { env: options.env })
        }),
    )

    const studio = Effect.fn('MaestroCliService.studio')(
      (options: MaestroCliOptions = {}) =>
        Effect.gen(function* () {
          const args = buildArgs(options, 'studio')
          yield* runCommand(args, options)
        }),
    )

    const record = Effect.fn('MaestroCliService.record')(
      (flowPath: string, options: MaestroCliOptions = {}) =>
        Effect.gen(function* () {
          const args = buildArgs(options, 'record', flowPath)
          yield* runCommand(args, options)
        }),
    )

    const hierarchy = Effect.fn('MaestroCliService.hierarchy')(
      (options: MaestroCliOptions = {}) =>
        Effect.gen(function* () {
          const args = buildArgs(options, 'hierarchy')
          yield* runCommand(args, options)
        }),
    )

    const downloadSamples = Effect.fn('MaestroCliService.downloadSamples')(
      () =>
        Effect.gen(function* () {
          yield* runCommand(['download-samples'])
        }),
    )

    return {
      test,
      cloud,
      studio,
      record,
      hierarchy,
      downloadSamples,
      runCommand,
    } as const
  }),
  dependencies: [NodeCommandExecutor.layer, NodeFileSystem.layer],
}) {}