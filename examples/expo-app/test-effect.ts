#!/usr/bin/env bun
import { Effect, pipe } from 'effect'
import { flow, Commands, MaestroLive } from 'maestro-effect'
import { TestRunnerService } from 'maestro-effect'

// Example 1: Using the builder pattern
const loginFlowBuilder = flow('Login Test')
  .appId('host.exp.Exponent')
  .launchApp()
  .assertVisible('Maestro Effect Demo')
  .tapOn({ id: 'email-input' })
  .inputText('test@example.com')
  .tapOn({ id: 'password-input' })
  .inputText('password123')
  .tapOn({ id: 'login-button' })
  .assertVisible({ id: 'dashboard-title' }, 5000)
  .assertVisible('Dashboard')
  .build()

// Example 2: Using Effect composition
const shoppingCartFlow = pipe(
  Commands.tapOn({ id: 'add-item-button' }),
  Effect.flatMap(() => Commands.assertVisible('1 items')),
  Effect.flatMap(() => Commands.tapOn({ id: 'add-item-button' })),
  Effect.flatMap(() => Commands.assertVisible('2 items')),
  Effect.flatMap(() => Commands.tapOn({ id: 'add-item-button' })),
  Effect.flatMap(() => Commands.assertVisible('3 items')),
  Effect.flatMap(() => Commands.tapOn({ id: 'remove-item-1' })),
  Effect.flatMap(() => Commands.assertVisible('2 items')),
)

// Example 3: Complete test flow with Effect
const completeTestFlow = Effect.gen(function* (_) {
  const runner = yield* _(TestRunnerService)
  
  console.log('🎯 Running login flow test...')
  
  // Run the login flow
  const loginResult = yield* _(
    runner.runFlow(loginFlowBuilder, {
      reporter: 'console',
      stepByStep: true,
    })
  )
  
  console.log(`✅ Login test completed in ${loginResult.endTime!.getTime() - loginResult.startTime.getTime()}ms`)
  
  // Create and run shopping cart flow
  const cartFlow = yield* _(
    Commands.createFlow(
      { name: 'Shopping Cart Test' },
      ...(yield* _(Commands.commands(
        Commands.tapOn({ id: 'add-item-button' }),
        Commands.assertVisible('1 items'),
        Commands.tapOn({ id: 'add-item-button' }),
        Commands.assertVisible('2 items'),
        Commands.tapOn({ id: 'add-item-button' }),
        Commands.assertVisible('3 items'),
        Commands.tapOn({ id: 'remove-item-1' }),
        Commands.assertVisible('2 items'),
        Commands.tapOn({ id: 'logout-button' }),
        Commands.assertVisible('Maestro Effect Demo'),
      )))
    )
  )
  
  const cartResult = yield* _(
    runner.runFlow(cartFlow, {
      reporter: 'console',
      keepTempFiles: true,
    })
  )
  
  console.log(`✅ Cart test completed in ${cartResult.endTime!.getTime() - cartResult.startTime.getTime()}ms`)
  console.log(`📁 Test files saved to: ${cartResult.outputDir}`)
})

// Run the test
const main = pipe(
  completeTestFlow,
  Effect.provide(MaestroLive),
  Effect.runPromise,
)

main
  .then(() => {
    console.log('✨ All tests passed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })