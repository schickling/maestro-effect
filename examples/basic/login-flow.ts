import { flow } from 'maestro-effect'

// Example 1: Simple login flow using builder pattern
export const loginFlow = flow('Login Flow')
  .appId('com.example.app')
  .launchApp({ clearState: true })
  .tapOn('login-button')
  .inputText('test@example.com', 'email-field')
  .inputText('password123', 'password-field')
  .tapOn('submit-button')
  .assertVisible('dashboard-title')
  .takeScreenshot('login-success.png')
  .build()

// Example 2: More complex flow with error handling
export const registrationFlow = flow('User Registration')
  .appId('com.example.app')
  .env('TEST_EMAIL', 'newuser@example.com')
  .launchApp()
  .tapOn('register-button')
  .waitUntilVisible('registration-form', 5000)
  .inputText('${TEST_EMAIL}', 'email-input')
  .inputText('John Doe', 'name-input')
  .inputText('SecurePass123!', 'password-input')
  .inputText('SecurePass123!', 'confirm-password-input')
  .scrollUntilVisible('terms-checkbox')
  .tapOn('terms-checkbox')
  .tapOn('create-account-button')
  .waitUntilVisible('verification-screen', 10000)
  .assertVisible({ text: 'Verification email sent' })
  .build()

// Example 3: Flow with repeated actions
export const shoppingCartFlow = flow('Shopping Cart Test')
  .appId('com.example.shop')
  .launchApp()
  .tapOn('products-tab')
  .repeat(3, (builder) => {
    builder
      .tapOn({ index: 0 }) // Tap first product
      .tapOn('add-to-cart')
      .back()
  })
  .tapOn('cart-tab')
  .assertVisible({ text: '3 items' })
  .swipe('DOWN')
  .tapOn('checkout-button')
  .build()

// Example 4: Cross-platform flow with conditions
export const crossPlatformFlow = flow('Cross Platform Test')
  .appId('com.example.app')
  .tags('smoke', 'critical')
  .launchApp()
  .runScript('check-platform.js', {
    env: { EXPECTED_VERSION: '1.0.0' },
  })
  .tapOn({ 
    id: 'main-menu',
    enabled: true,
  })
  .evalScript(`
    if (maestro.platform === 'iOS') {
      output.buttonText = 'Sign in with Apple'
    } else {
      output.buttonText = 'Sign in with Google'
    }
  `)
  .tapOn('${buttonText}')
  .build()

// Example 5: Flow with navigation and deep linking
export const deepLinkFlow = flow('Deep Link Navigation')
  .appId('com.example.app')
  .launchApp()
  .openLink('myapp://profile/settings', { autoVerify: true })
  .assertVisible('settings-screen')
  .tapOn('privacy-settings')
  .setAirplaneMode(true)
  .assertVisible('offline-banner')
  .setAirplaneMode(false)
  .waitUntilNotVisible('offline-banner', 5000)
  .build()