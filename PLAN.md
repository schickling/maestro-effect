# Maestro Effect - Implementation Plan

## Overview

Building an Effect-native wrapper for Maestro mobile testing framework that provides:
- Type-safe test authoring with TypeScript
- Effect-based error handling and composition
- YAML generation for Maestro CLI execution
- Service-based architecture for extensibility

## Architecture Decisions

### Core Principles
1. **Close to Maestro**: Start with abstractions that map 1:1 to Maestro concepts
2. **Progressive Enhancement**: Layer higher-level APIs on top of core
3. **Effect-First**: Use Effect patterns throughout (services, schemas, errors)
4. **Type Safety**: Leverage TypeScript and Effect schemas for validation
5. **Composability**: Builder pattern for sync, pipe pattern for async

### Test Execution Model
- Each test run creates a temporary directory
- Test steps generate numbered YAML files (001-launch.yaml, 002-tap.yaml, etc.)
- Maestro CLI executes YAML files in sequence
- Results are collected and reported

## Implementation Progress

### ✅ Completed
- [x] Project structure setup
- [x] Monorepo configuration
- [x] Effect schemas for all Maestro commands
- [x] Maestro CLI wrapper service using Effect Command
- [x] Flow compiler service for YAML generation
- [x] Builder API with fluent interface
- [x] Test runner service with reporting
- [x] CLI implementation using Effect CLI
- [x] Basic assertions and commands
- [x] Example tests demonstrating both builder and functional patterns
- [x] README documentation

### 🚧 In Progress
- [ ] TypeScript flow execution (loading .ts files directly)
- [ ] Integration tests with real Maestro

### 📋 TODO
- [ ] Publish to npm registry
- [ ] CI/CD setup
- [ ] More comprehensive examples
- [ ] Video tutorials

## Core Components

### 1. Maestro CLI Wrapper
- Service: `MaestroCliService`
- Uses Effect's Command API
- Handles process execution and error mapping
- Provides typed interface to Maestro CLI commands

### 2. Schema Definitions
```typescript
// Command schemas matching Maestro YAML structure
const TapOnSchema = Schema.Union(
  Schema.String,
  Schema.Struct({ id: Schema.String }),
  Schema.Struct({ text: Schema.String }),
  Schema.Struct({ point: Schema.Tuple(Schema.Number, Schema.Number) })
)
```

### 3. Flow Compiler
- Service: `FlowCompilerService`
- Converts TypeScript flow definitions to YAML
- Manages temporary directory creation
- Handles file numbering and organization

### 4. Test Runner
- Service: `TestRunnerService`
- Orchestrates test execution
- Manages test lifecycle
- Collects and reports results

### 5. Builder API
```typescript
// Synchronous builder for simple flows
const flow = Flow.create("Login Test")
  .launchApp()
  .tapOn("login-button")
  .inputText("username", "test@example.com")
  .assertVisible("dashboard")

// Async operations with Effect
const asyncFlow = pipe(
  launchApp(),
  Effect.flatMap(() => waitForElement("login-button")),
  Effect.flatMap(() => tapOn("login-button"))
)
```

## Backlog / Future Ideas

### High-Level APIs
- **Page Objects**: Reusable component abstractions
- **Flow Composition**: Combine smaller flows into larger tests
- **Playwright-inspired API**: Familiar patterns for web developers
- **Native Testing Patterns**: iOS XCTest / Android Espresso concepts

### Concurrency & Performance
- Parallel test execution across devices
- Test sharding for large suites
- Device pool management
- Performance metrics collection

### Developer Experience
- Hot reload during test development
- Interactive debugging mode
- VSCode extension
- Test recorder/generator

### Advanced Features
- AI-powered assertions
- Visual regression testing
- Accessibility testing
- Network mocking
- Deep linking utilities

### Integration
- Vitest integration
- CI/CD templates
- Reporting plugins
- Cloud testing services

## Research Notes

### Reusability Patterns
**Options to explore:**
1. **Shared Flows**: Import and compose smaller test flows
2. **Custom Commands**: Extend with app-specific commands
3. **Test Helpers**: Utility functions for common patterns
4. **Configuration Presets**: Reusable test configurations

### Assertion Enhancements
**Practical additions without complexity:**
1. `assertElementCount(selector, count)` - Verify number of elements
2. `assertTextMatches(selector, regex)` - Regex text matching
3. `assertNotPresent(selector)` - Ensure element doesn't exist
4. `assertEnabled/Disabled(selector)` - Check interaction state
5. `assertContainsText(selector, substring)` - Partial text match

### Error Types
```typescript
// Expected errors (tagged)
class ElementNotFoundError extends Schema.TaggedError
class AssertionFailedError extends Schema.TaggedError  
class TimeoutError extends Schema.TaggedError

// Defects
- Maestro CLI not found
- Invalid YAML generation
- File system errors
```

## API Design Ideas

### Playwright-Inspired
```typescript
// Locator pattern
const button = flow.locator("login-button")
await button.tap()
await button.assertVisible()

// Chaining with auto-wait
await flow
  .getByText("Login")
  .tap()
  .getByPlaceholder("Email")
  .fill("test@example.com")
```

### Native Testing Inspired
```typescript
// iOS XCTest style
flow.test("Login Flow", () => {
  const app = flow.launch()
  const loginButton = app.buttons["Login"]
  loginButton.tap()
  
  flow.expect(app.staticTexts["Welcome"]).toExist()
})

// Android Espresso style
flow.onView(withId("login_button"))
  .perform(click())
  .check(matches(isDisplayed()))
```

## Technical Decisions

### File Structure
```
packages/maestro-effect/
├── src/
│   ├── commands/      # Individual command implementations
│   ├── services/      # Effect services
│   ├── schemas/       # Effect schemas
│   ├── errors/        # Error definitions
│   ├── builder/       # Builder API
│   ├── runner/        # Test execution
│   └── cli/           # CLI implementation
├── test/
└── package.json
```

### Dependencies
- effect: Core Effect library
- @effect/cli: CLI framework
- @effect/platform: File system, process management
- @effect/schema: Schema validation
- yaml: YAML generation (or custom implementation)

### Testing Strategy
- Unit tests for individual commands
- Integration tests with mock Maestro CLI
- E2E tests with real Maestro (in examples)
- Property-based tests for YAML generation

## Next Steps

1. Implement core schemas for Maestro commands
2. Create MaestroCliService with Command wrapper
3. Build FlowCompilerService for YAML generation
4. Design builder API with method chaining
5. Implement basic test runner
6. Create CLI entry point
7. Write comprehensive tests
8. Document usage with examples