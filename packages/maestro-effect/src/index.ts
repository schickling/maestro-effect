// Re-export everything
export * from './schemas/index.js'
export * from './errors/index.js'
export * from './services/index.js'
export * from './builder/index.js'

// Convenience exports
export { flow, FlowBuilder } from './builder/flow-builder.js'
export * as Commands from './builder/commands.js'

// Main API
import { Layer } from 'effect'
import { MaestroCliService } from './services/maestro-cli.js'
import { FlowCompilerService } from './services/flow-compiler.js'
import { TestRunnerService } from './services/test-runner.js'
import { TestReporterService } from './services/test-reporter.js'

// Combined layer for all services
export const MaestroLive = Layer.mergeAll(
  MaestroCliService.Default,
  FlowCompilerService.Default,
  TestRunnerService.Default,
  TestReporterService.Default,
)