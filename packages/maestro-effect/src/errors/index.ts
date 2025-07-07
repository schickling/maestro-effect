import { Schema } from 'effect'

// Base error class for all Maestro errors
export class MaestroError extends Schema.TaggedError<MaestroError>()('MaestroError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Defect),
}) {}

// CLI-related errors
export class MaestroCliNotFoundError extends Schema.TaggedError<MaestroCliNotFoundError>()(
  'MaestroCliNotFoundError',
  {
    message: Schema.String,
    path: Schema.optional(Schema.String),
  },
) {}

export class MaestroCliExecutionError extends Schema.TaggedError<MaestroCliExecutionError>()(
  'MaestroCliExecutionError',
  {
    message: Schema.String,
    command: Schema.String,
    exitCode: Schema.Number,
    stdout: Schema.String,
    stderr: Schema.String,
  },
) {}

// Test execution errors
export class ElementNotFoundError extends Schema.TaggedError<ElementNotFoundError>()(
  'ElementNotFoundError',
  {
    message: Schema.String,
    selector: Schema.Unknown,
    timeout: Schema.optional(Schema.Number),
  },
) {}

export class AssertionFailedError extends Schema.TaggedError<AssertionFailedError>()(
  'AssertionFailedError',
  {
    message: Schema.String,
    expected: Schema.Unknown,
    actual: Schema.Unknown,
    assertion: Schema.String,
  },
) {}

export class TimeoutError extends Schema.TaggedError<TimeoutError>()('TimeoutError', {
  message: Schema.String,
  operation: Schema.String,
  timeout: Schema.Number,
}) {}

// Flow compilation errors
export class FlowCompilationError extends Schema.TaggedError<FlowCompilationError>()(
  'FlowCompilationError',
  {
    message: Schema.String,
    flowName: Schema.optional(Schema.String),
    cause: Schema.Defect,
  },
) {}

export class YamlGenerationError extends Schema.TaggedError<YamlGenerationError>()(
  'YamlGenerationError',
  {
    message: Schema.String,
    command: Schema.Unknown,
    cause: Schema.Defect,
  },
) {}

// Device errors
export class DeviceNotFoundError extends Schema.TaggedError<DeviceNotFoundError>()(
  'DeviceNotFoundError',
  {
    message: Schema.String,
    platform: Schema.optional(Schema.Literal('iOS', 'Android')),
    deviceId: Schema.optional(Schema.String),
  },
) {}

export class AppNotInstalledError extends Schema.TaggedError<AppNotInstalledError>()(
  'AppNotInstalledError',
  {
    message: Schema.String,
    appId: Schema.String,
    platform: Schema.optional(Schema.Literal('iOS', 'Android')),
  },
) {}

// Configuration errors
export class ConfigurationError extends Schema.TaggedError<ConfigurationError>()(
  'ConfigurationError',
  {
    message: Schema.String,
    field: Schema.String,
    value: Schema.Unknown,
  },
) {}

// Union of all Maestro errors
export type MaestroErrors =
  | MaestroError
  | MaestroCliNotFoundError
  | MaestroCliExecutionError
  | ElementNotFoundError
  | AssertionFailedError
  | TimeoutError
  | FlowCompilationError
  | YamlGenerationError
  | DeviceNotFoundError
  | AppNotInstalledError
  | ConfigurationError