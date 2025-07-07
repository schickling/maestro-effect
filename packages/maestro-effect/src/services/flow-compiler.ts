import { Effect, pipe } from 'effect'
import { FileSystem } from '@effect/platform'
import { NodeFileSystem } from '@effect/platform-node'
import * as yaml from 'yaml'
import * as Path from 'node:path'
import * as os from 'node:os'
import { Command, Flow, FlowConfiguration } from '../schemas/index.js'
import { YamlGenerationError } from '../errors/index.js'

export interface CompiledFlow {
  name: string
  path: string
  yaml: string
}

export interface CompilationOptions {
  outputDir?: string
  prefix?: string
  keepTempFiles?: boolean
}

export class FlowCompilerService extends Effect.Service<FlowCompilerService>()('FlowCompilerService', {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    const createTempDir = Effect.gen(function* () {
      const tempDir = Path.join(os.tmpdir(), `maestro-effect-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      yield* fs.makeDirectory(tempDir, { recursive: true })
      return tempDir
    })

    const commandToYaml = (command: Command): Effect.Effect<string, YamlGenerationError, never> => {
      // Handle special cases that need custom formatting
      if ('launchApp' in command && typeof command.launchApp === 'string') {
        return Effect.succeed(yaml.stringify({ launchApp: command.launchApp }))
      }

      if ('tapOn' in command && typeof command.tapOn === 'string') {
        return Effect.succeed(yaml.stringify({ tapOn: command.tapOn }))
      }

      if ('inputText' in command && typeof command.inputText === 'string') {
        return Effect.succeed(yaml.stringify({ inputText: command.inputText }))
      }

      if ('repeat' in command && typeof command.repeat === 'object' && 'commands' in command.repeat) {
        return pipe(
          Effect.gen(function* () {
            const { commands, ...repeatConfig } = command.repeat
            const repeatYaml = yaml.stringify({ repeat: repeatConfig }).trim()
            const commandsYamlEffects = commands.map((cmd: Command) => commandToYaml(cmd))
            const commandsYamlArray = yield* Effect.all(commandsYamlEffects)
            const commandsYaml = (commandsYamlArray as string[])
              .map((cmdYaml) => '  ' + cmdYaml.trim().split('\n').join('\n  '))
              .join('\n')
            return `${repeatYaml}\n${commandsYaml}`
          }) as Effect.Effect<string, YamlGenerationError, never>,
          Effect.catchAll((error) =>
            Effect.fail(new YamlGenerationError({
              message: 'Failed to generate YAML for repeat command',
              command,
              cause: error as Error,
            }))
          )
        )
      }

      // Default case: use yaml stringify
      return Effect.succeed(yaml.stringify(command))
    }

    const flowConfigToYaml = (config: FlowConfiguration): Effect.Effect<string, YamlGenerationError, never> =>
      Effect.gen(function* () {
        const configObj: Record<string, unknown> = {}

        if (config.appId) configObj['appId'] = config.appId
        if (config.name) configObj['name'] = config.name
        if (config.tags) configObj['tags'] = config.tags
        if (config.env) configObj['env'] = config.env

        // Handle onFlowStart and onFlowComplete separately
        let extraYaml = ''
        if (config.onFlowStart) {
          extraYaml += '\nonFlowStart:\n'
          const onFlowStartYamlArray = yield* Effect.all(
            config.onFlowStart.map((cmd) => commandToYaml(cmd))
          )
          extraYaml += onFlowStartYamlArray
            .map((cmdYaml) => '  - ' + cmdYaml.trim().replace(/\n/g, '\n    '))
            .join('\n')
        }

        if (config.onFlowComplete) {
          extraYaml += '\nonFlowComplete:\n'
          const onFlowCompleteYamlArray = yield* Effect.all(
            config.onFlowComplete.map((cmd) => commandToYaml(cmd))
          )
          extraYaml += onFlowCompleteYamlArray
            .map((cmdYaml) => '  - ' + cmdYaml.trim().replace(/\n/g, '\n    '))
            .join('\n')
        }

        return yaml.stringify(configObj).trim() + extraYaml
      })

    const compileCommand = Effect.fn('FlowCompilerService.compileCommand')(
      (command: Command, index: number, options: CompilationOptions = {}) =>
        Effect.gen(function* () {
          const prefix = options.prefix ?? 'step'
          const fileName = `${String(index + 1).padStart(3, '0')}-${prefix}.yaml`
          const filePath = Path.join(options.outputDir ?? '', fileName)

          const yamlContent = yield* commandToYaml(command)

          return {
            name: fileName,
            path: filePath,
            yaml: yamlContent,
          }
        }),
    )

    const compileFlow = Effect.fn('FlowCompilerService.compileFlow')(
      (flow: Flow, options: CompilationOptions = {}) =>
        Effect.gen(function* () {
          const outputDir = options.outputDir ?? (yield* createTempDir)

          // Create flow configuration file if present
          const compiledFiles: CompiledFlow[] = []

          if (flow.config) {
            const configYaml = yield* flowConfigToYaml(flow.config)
            const configPath = Path.join(outputDir, '000-config.yaml')
            const fullYaml = configYaml + '\n---'

            yield* fs.writeFileString(configPath, fullYaml)
            compiledFiles.push({
              name: '000-config.yaml',
              path: configPath,
              yaml: fullYaml,
            })
          }

          // Compile each command
          for (const [index, command] of flow.commands.entries()) {
            const compiled = yield* compileCommand(command, index, { ...options, outputDir })
            const fullPath = Path.join(outputDir, compiled.name)

            yield* fs.writeFileString(fullPath, compiled.yaml)
            compiledFiles.push({
              ...compiled,
              path: fullPath,
            })
          }

          return {
            outputDir,
            files: compiledFiles,
          }
        }),
    )

    const compileSingleFile = Effect.fn('FlowCompilerService.compileSingleFile')(
      (flow: Flow, outputPath: string) =>
        Effect.gen(function* () {
          let fullYaml = ''

          // Add configuration section
          if (flow.config) {
            const configYaml = yield* flowConfigToYaml(flow.config)
            fullYaml += configYaml
            fullYaml += '\n---\n'
          }

          // Add commands
          const commandsYamlArray = yield* Effect.all(
            flow.commands.map((cmd) => commandToYaml(cmd))
          )
          const commandsYaml = commandsYamlArray
            .map((cmdYaml) => '- ' + cmdYaml.trim().replace(/\n/g, '\n  '))
            .join('\n')

          fullYaml += commandsYaml

          yield* fs.writeFileString(outputPath, fullYaml)

          return {
            path: outputPath,
            yaml: fullYaml,
          }
        }),
    )

    const cleanup = Effect.fn('FlowCompilerService.cleanup')(
      (outputDir: string) =>
        Effect.gen(function* () {
          const exists = yield* pipe(fs.exists(outputDir), Effect.orElseSucceed(() => false))
          if (exists) {
            yield* fs.remove(outputDir, { recursive: true })
          }
        }),
    )

    return {
      compileCommand,
      compileFlow,
      compileSingleFile,
      cleanup,
      createTempDir,
    } as const
  }),
  dependencies: [NodeFileSystem.layer],
}) {}