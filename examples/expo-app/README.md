# Maestro Effect Expo Example

This example demonstrates how to use maestro-effect with an Expo/React Native app.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start the Expo development server:
```bash
pnpm start
```

3. Run tests:

### Using Maestro directly:
```bash
pnpm test
```

### Using Effect-based tests:
```bash
pnpm test:effect
```

### CI testing:
```bash
pnpm test:ci
```

## Test Features

The example app includes:
- Login functionality with test credentials
- Shopping cart with add/remove items
- Logout functionality

The tests demonstrate:
- Basic Maestro YAML tests
- Effect-based test composition
- CI integration with intelligent app detection
- Both builder and functional patterns

## CI Script Features

The CI script (`scripts/ci-test.sh`) implements:
- Automatic simulator creation and cleanup
- Intelligent app readiness detection
- Multiple indicator checks (UI elements, logs, server status)
- Comprehensive error handling
- Performance optimizations

## Test Credentials

- Email: `test@example.com`
- Password: `password123`