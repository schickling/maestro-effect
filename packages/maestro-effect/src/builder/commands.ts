import { Effect } from 'effect'
import { Command, Selector } from '../schemas/index.js'

// Type for command effects
export type CommandEffect = Effect.Effect<Command>

// App control commands
export const launchApp = (appIdOrOptions?: string | {
  appId?: string
  clearState?: boolean
  clearKeychain?: boolean
  stopApp?: boolean
  permissions?: Record<string, 'allow' | 'deny'>
  arguments?: string[]
  launchArguments?: Record<string, unknown>
}): CommandEffect =>
  Effect.succeed({
    launchApp: appIdOrOptions ?? '',
  })

export const killApp = (appId?: string): CommandEffect =>
  Effect.succeed({ killApp: appId })

export const stopApp = (appId?: string): CommandEffect =>
  Effect.succeed({ stopApp: appId })

export const clearState = (appId?: string): CommandEffect =>
  Effect.succeed({ clearState: appId })

export const clearKeychain = (): CommandEffect =>
  Effect.succeed({ clearKeychain: true })

// Navigation commands
export const back = (): CommandEffect =>
  Effect.succeed({ back: true })

export const openLink = (
  link: string,
  options?: { autoVerify?: boolean; browser?: boolean },
): CommandEffect =>
  Effect.succeed({
    openLink: options ? { link, ...options } : link,
  })

// Interaction commands
export const tapOn = (selector: Selector | [number, number]): CommandEffect =>
  Effect.succeed({
    tapOn: Array.isArray(selector) ? { point: selector } : selector,
  })

export const doubleTapOn = (selector: Selector): CommandEffect =>
  Effect.succeed({ doubleTapOn: selector })

export const longPressOn = (selector: Selector, duration?: number): CommandEffect =>
  Effect.succeed({
    longPressOn: duration !== undefined && typeof selector === 'object' && 'point' in selector
      ? { ...selector, duration }
      : selector,
  })

export const swipe = (
  directionOrStart: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | [number, number],
  optionsOrEnd?: { from?: Selector; duration?: number } | [number, number],
  duration?: number,
): CommandEffect =>
  Effect.succeed({
    swipe: Array.isArray(directionOrStart)
      ? {
          start: directionOrStart,
          end: optionsOrEnd as [number, number],
          duration,
        }
      : {
          direction: directionOrStart,
          ...(optionsOrEnd as { from?: Selector; duration?: number } ?? {}),
        },
  })

export const scroll = (): CommandEffect =>
  Effect.succeed({ scroll: true })

export const scrollUntilVisible = (
  selector: Selector,
  options?: {
    direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
    timeout?: number
    speed?: number
    centerElement?: boolean
  },
): CommandEffect =>
  Effect.succeed({
    scrollUntilVisible: {
      element: selector,
      ...(options ?? {}),
    },
  })

// Text input commands
export const inputText = (text: string, label?: string): CommandEffect =>
  Effect.succeed({
    inputText: label ? { text, label } : text,
  })

export const eraseText = (charactersToErase: number, label?: string): CommandEffect =>
  Effect.succeed({
    eraseText: label ? { charactersToErase, label } : charactersToErase,
  })

export const pasteText = (text?: string): CommandEffect =>
  Effect.succeed({ pasteText: text })

export const copyTextFrom = (selector: Selector): CommandEffect =>
  Effect.succeed({ copyTextFrom: selector })

export const hideKeyboard = (): CommandEffect =>
  Effect.succeed({ hideKeyboard: true })

export const pressKey = (key: string): CommandEffect =>
  Effect.succeed({ pressKey: key })

// Assertion commands
export const assertVisible = (selector: Selector, timeout?: number): CommandEffect =>
  Effect.succeed({
    assertVisible: timeout !== undefined ? { selector, timeout } : selector,
  })

export const assertNotVisible = (selector: Selector, timeout?: number): CommandEffect =>
  Effect.succeed({
    assertNotVisible: timeout !== undefined ? { selector, timeout } : selector,
  })

export const assertTrue = (condition: string, label?: string): CommandEffect =>
  Effect.succeed({
    assertTrue: label ? { condition, label } : condition,
  })

// Wait commands
export const waitUntilVisible = (selector: Selector, timeout?: number): CommandEffect =>
  Effect.succeed({
    extendedWaitUntil: {
      visible: selector,
      timeout,
    },
  })

export const waitUntilNotVisible = (selector: Selector, timeout?: number): CommandEffect =>
  Effect.succeed({
    extendedWaitUntil: {
      notVisible: selector,
      timeout,
    },
  })

export const waitForAnimationToEnd = (timeout?: number): CommandEffect =>
  Effect.succeed({
    waitForAnimationToEnd: {
      timeout,
    },
  })

// Script commands
export const runScript = (file: string, options?: { env?: Record<string, string> }): CommandEffect =>
  Effect.succeed({
    runScript: options ? { file, ...options } : file,
  })

export const evalScript = (script: string): CommandEffect =>
  Effect.succeed({ evalScript: script })

export const runFlow = (file: string, options?: { env?: Record<string, string> }): CommandEffect =>
  Effect.succeed({
    runFlow: options ? { file, ...options } : file,
  })

// Control flow commands
export const repeat = (
  times: number,
  commands: Command[] | Effect.Effect<Command[]>,
): CommandEffect =>
  Effect.gen(function* () {
    const cmds = Effect.isEffect(commands) ? yield* commands : commands
    return {
      repeat: {
        times,
        commands: cmds,
      },
    }
  })

export const repeatWhile = (
  condition: { visible?: Selector; notVisible?: Selector; true?: string },
  commands: Command[] | Effect.Effect<Command[]>,
): CommandEffect =>
  Effect.gen(function* () {
    const cmds = Effect.isEffect(commands) ? yield* commands : commands
    return {
      repeat: {
        while: condition,
        commands: cmds,
      },
    }
  })

// Media commands
export const takeScreenshot = (path: string): CommandEffect =>
  Effect.succeed({ takeScreenshot: path })

export const startRecording = (path: string): CommandEffect =>
  Effect.succeed({ startRecording: path })

export const stopRecording = (): CommandEffect =>
  Effect.succeed({ stopRecording: true })

// Device commands
export const setLocation = (latitude: number, longitude: number): CommandEffect =>
  Effect.succeed({ setLocation: { latitude, longitude } })

export const setAirplaneMode = (enabled: boolean): CommandEffect =>
  Effect.succeed({ setAirplaneMode: enabled ? 'enabled' : 'disabled' })

export const addMedia = (...paths: string[]): CommandEffect =>
  Effect.succeed({ addMedia: paths })

// Helper to combine multiple commands
export const commands = (...cmds: CommandEffect[]): Effect.Effect<Command[]> =>
  Effect.all(cmds)

// Helper to create a flow from commands
export const createFlow = (
  config: {
    appId?: string
    name?: string
    tags?: string[]
    env?: Record<string, string>
  },
  ...cmds: CommandEffect[]
): Effect.Effect<import('../schemas/index.js').Flow> =>
  Effect.gen(function* () {
    const commandList = yield* commands(...cmds)
    return {
      config,
      commands: commandList,
    }
  })