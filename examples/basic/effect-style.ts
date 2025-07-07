import { Effect, pipe } from 'effect'
import { Commands, createFlow } from 'maestro-effect'

// Example 1: Functional composition with Effect
export const loginFlowEffect = pipe(
  Commands.launchApp({ clearState: true }),
  Effect.flatMap(() => Commands.tapOn('login-button')),
  Effect.flatMap(() => Commands.inputText('test@example.com', 'email-field')),
  Effect.flatMap(() => Commands.inputText('password123', 'password-field')),
  Effect.flatMap(() => Commands.tapOn('submit-button')),
  Effect.flatMap(() => Commands.assertVisible('dashboard-title')),
  Effect.flatMap(() => Commands.takeScreenshot('login-success.png')),
  Effect.map(() => 'Login successful'),
)

// Example 2: Creating a flow from Effect commands
export const registrationFlowEffect = createFlow(
  {
    appId: 'com.example.app',
    name: 'User Registration Effect',
    env: { TEST_EMAIL: 'newuser@example.com' },
  },
  Commands.launchApp(),
  Commands.tapOn('register-button'),
  Commands.waitUntilVisible('registration-form', 5000),
  Commands.inputText('${TEST_EMAIL}', 'email-input'),
  Commands.inputText('John Doe', 'name-input'),
  Commands.inputText('SecurePass123!', 'password-input'),
  Commands.inputText('SecurePass123!', 'confirm-password-input'),
  Commands.scrollUntilVisible('terms-checkbox'),
  Commands.tapOn('terms-checkbox'),
  Commands.tapOn('create-account-button'),
  Commands.waitUntilVisible('verification-screen', 10000),
  Commands.assertVisible({ text: 'Verification email sent' }),
)

// Example 3: Conditional flows with Effect
export const conditionalFlow = Effect.gen(function* (_) {
  yield* _(Commands.launchApp())
  
  const platform = yield* _(Commands.evalScript('output.platform = maestro.platform'))
  
  if (platform === 'iOS') {
    yield* _(Commands.tapOn('ios-specific-button'))
    yield* _(Commands.swipe('LEFT'))
  } else {
    yield* _(Commands.tapOn('android-menu'))
    yield* _(Commands.back())
  }
  
  yield* _(Commands.assertVisible('home-screen'))
})

// Example 4: Error handling with Effect
export const errorHandlingFlow = pipe(
  Commands.launchApp(),
  Effect.flatMap(() => Commands.tapOn('risky-button')),
  Effect.flatMap(() => Commands.waitUntilVisible('success-message', 3000)),
  Effect.catchTag('TimeoutError', () =>
    pipe(
      Commands.takeScreenshot('timeout-error.png'),
      Effect.flatMap(() => Commands.tapOn('retry-button')),
    ),
  ),
  Effect.catchTag('ElementNotFoundError', (error) =>
    Effect.gen(function* (_) {
      yield* _(Effect.log(`Element not found: ${error.selector}`))
      yield* _(Commands.takeScreenshot('element-not-found.png'))
      yield* _(Commands.back())
    }),
  ),
)

// Example 5: Repeating commands with Effect
export const repeatingActionsFlow = Effect.gen(function* (_) {
  yield* _(Commands.launchApp())
  yield* _(Commands.tapOn('products-tab'))
  
  // Add 3 items to cart
  const addToCartCommands = yield* _(
    Commands.repeat(
      3,
      Commands.commands(
        Commands.tapOn({ index: 0 }),
        Commands.tapOn('add-to-cart'),
        Commands.back(),
      ),
    ),
  )
  
  yield* _(Commands.tapOn('cart-tab'))
  yield* _(Commands.assertVisible({ text: '3 items' }))
})