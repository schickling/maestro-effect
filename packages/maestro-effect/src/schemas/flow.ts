import { Schema } from 'effect'
import { Command } from './commands.js'

// Flow Configuration
export const FlowConfiguration = Schema.Struct({
  appId: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  tags: Schema.optional(Schema.Array(Schema.String)),
  env: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
  onFlowStart: Schema.optional(Schema.Array(Command)),
  onFlowComplete: Schema.optional(Schema.Array(Command)),
})
export type FlowConfiguration = typeof FlowConfiguration.Type

// Complete Flow
export const Flow = Schema.Struct({
  config: Schema.optional(FlowConfiguration),
  commands: Schema.Array(Command),
})
export type Flow = typeof Flow.Type

// Test Suite
export const TestSuite = Schema.Struct({
  name: Schema.String,
  flows: Schema.Array(Flow),
})
export type TestSuite = typeof TestSuite.Type

// Maestro Test Configuration
export const MaestroConfig = Schema.Struct({
  flows: Schema.optional(Schema.Array(Schema.String)),
  includeTags: Schema.optional(Schema.Array(Schema.String)),
  excludeTags: Schema.optional(Schema.Array(Schema.String)),
  env: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
})
export type MaestroConfig = typeof MaestroConfig.Type