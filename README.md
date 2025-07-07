# Maestro Effect

Effect-native wrapper for [Maestro](https://maestro.mobile.dev) mobile testing framework.

## Features

- 🎯 **Type-safe test authoring** with TypeScript
- 🔄 **Effect-based error handling** and composition
- 📝 **YAML generation** for Maestro CLI execution
- 🏗️ **Service-based architecture** for extensibility
- 🔧 **Builder pattern** for synchronous flows
- ⚡ **Functional composition** for async operations

## Installation

```bash
npm install maestro-effect
# or
pnpm add maestro-effect
# or
yarn add maestro-effect
```

## Prerequisites

- [Maestro CLI](https://maestro.mobile.dev) installed
- Node.js 18+
- TypeScript 5+

## Quick Start

### Builder Pattern (Synchronous)

```typescript
import { flow } from 'maestro-effect'

const loginFlow = flow('Login Test')
  .appId('com.example.app')
  .launchApp({ clearState: true })
  .tapOn('login-button')
  .inputText('user@example.com', 'email')
  .inputText('password123', 'password')
  .tapOn('submit')
  .assertVisible('dashboard')
  .build()
```

### Functional Pattern (with Effect)

```typescript
import { Effect, pipe } from 'effect'
import { Commands } from 'maestro-effect'

const loginFlow = pipe(
  Commands.launchApp({ clearState: true }),
  Effect.flatMap(() => Commands.tapOn('login-button')),
  Effect.flatMap(() => Commands.inputText('user@example.com')),
  Effect.flatMap(() => Commands.assertVisible('dashboard')),
)
```

## CLI Usage

### Compile flows to YAML

```bash
maestro-effect compile "Login Flow" --output ./flows
```

### Run tests

```bash
maestro-effect test ./flows/login.yaml
```

### Launch Maestro Studio

```bash
maestro-effect studio
```

## API Reference

### Flow Builder

#### Configuration Methods

- `appId(id: string)` - Set the app identifier
- `name(name: string)` - Set the flow name
- `tags(...tags: string[])` - Add tags for test organization
- `env(key: string, value: string)` - Set environment variables

#### App Control

- `launchApp(options?)` - Launch the application
- `killApp()` - Kill the application
- `stopApp()` - Stop the application
- `clearState()` - Clear app state
- `clearKeychain()` - Clear keychain (iOS)

#### Interaction

- `tapOn(selector)` - Tap on element
- `doubleTapOn(selector)` - Double tap
- `longPressOn(selector, duration?)` - Long press
- `swipe(direction, options?)` - Swipe gesture
- `scroll()` - Scroll screen
- `scrollUntilVisible(selector, options?)` - Scroll until element visible

#### Text Input

- `inputText(text, label?)` - Input text
- `eraseText(count, label?)` - Erase characters
- `pasteText(text?)` - Paste text
- `hideKeyboard()` - Hide keyboard

#### Assertions

- `assertVisible(selector, timeout?)` - Assert element visible
- `assertNotVisible(selector, timeout?)` - Assert element not visible
- `assertTrue(condition, label?)` - Assert condition

#### Navigation

- `back()` - Navigate back
- `openLink(url, options?)` - Open URL/deep link

### Effect Commands

All builder methods are also available as Effect functions in the `Commands` namespace:

```typescript
import { Commands } from 'maestro-effect'

Commands.tapOn('button')           // Effect<Command>
Commands.inputText('hello')        // Effect<Command>
Commands.assertVisible('result')   // Effect<Command>
```

## Advanced Examples

### Conditional Flows

```typescript
const conditionalFlow = flow('Conditional Test')
  .appId('com.app')
  .launchApp()
  .runScript('check-platform.js')
  .tapOn('${buttonId}') // Use output from script
  .build()
```

### Repeated Actions

```typescript
const repeatedFlow = flow('Shopping Cart')
  .appId('com.shop')
  .launchApp()
  .repeat(5, (builder) => {
    builder
      .tapOn('add-item')
      .waitForAnimationToEnd()
  })
  .assertVisible({ text: '5 items' })
  .build()
```

### Error Handling with Effect

```typescript
import { pipe } from 'effect'
import { Commands } from 'maestro-effect'

const robustFlow = pipe(
  Commands.launchApp(),
  Effect.flatMap(() => Commands.tapOn('button')),
  Effect.catchTag('ElementNotFoundError', () =>
    Commands.takeScreenshot('error.png')
  ),
)
```

## Architecture

The library is built with Effect and follows a service-based architecture:

- **MaestroCliService** - Wraps Maestro CLI commands
- **FlowCompilerService** - Converts flows to YAML
- **TestRunnerService** - Orchestrates test execution
- **TestReporterService** - Handles test reporting

## Contributing

See [PLAN.md](./PLAN.md) for the implementation plan and future ideas.

## License

MIT