import { Command, Flow, FlowConfiguration, Selector } from '../schemas/index.js'

export class FlowBuilder {
  private config: FlowConfiguration
  private commands: Command[] = []

  constructor(name?: string) {
    this.config = name ? { name } : {}
  }

  // Configuration methods
  appId(id: string): this {
    this.config = { ...this.config, appId: id }
    return this
  }

  name(name: string): this {
    this.config = { ...this.config, name }
    return this
  }

  tags(...tags: string[]): this {
    this.config = { ...this.config, tags }
    return this
  }

  env(key: string, value: string): this
  env(vars: Record<string, string>): this
  env(keyOrVars: string | Record<string, string>, value?: string): this {
    if (typeof keyOrVars === 'string' && value !== undefined) {
      this.config = { ...this.config, env: { ...this.config.env, [keyOrVars]: value } }
    } else if (typeof keyOrVars === 'object') {
      this.config = { ...this.config, env: { ...this.config.env, ...keyOrVars } }
    }
    return this
  }

  onFlowStart(...commands: Command[]): this {
    this.config = { ...this.config, onFlowStart: [...(this.config.onFlowStart ?? []), ...commands] }
    return this
  }

  onFlowComplete(...commands: Command[]): this {
    this.config = { ...this.config, onFlowComplete: [...(this.config.onFlowComplete ?? []), ...commands] }
    return this
  }

  // App control methods
  launchApp(appIdOrOptions?: string | Parameters<typeof this.launchAppOptions>[0]): this {
    if (typeof appIdOrOptions === 'string') {
      this.commands.push({ launchApp: appIdOrOptions })
    } else if (appIdOrOptions) {
      this.commands.push({ launchApp: appIdOrOptions })
    } else {
      this.commands.push({ launchApp: this.config.appId ?? '' })
    }
    return this
  }

  private launchAppOptions(options: {
    appId?: string
    clearState?: boolean
    clearKeychain?: boolean
    stopApp?: boolean
    permissions?: Record<string, 'allow' | 'deny'>
    arguments?: string[]
    launchArguments?: Record<string, unknown>
  }): this {
    this.commands.push({ launchApp: options })
    return this
  }

  killApp(appId?: string): this {
    this.commands.push({ killApp: appId })
    return this
  }

  stopApp(appId?: string): this {
    this.commands.push({ stopApp: appId })
    return this
  }

  clearState(appId?: string): this {
    this.commands.push({ clearState: appId })
    return this
  }

  clearKeychain(): this {
    this.commands.push({ clearKeychain: true })
    return this
  }

  // Navigation methods
  back(): this {
    this.commands.push({ back: true })
    return this
  }

  openLink(link: string, options?: { autoVerify?: boolean; browser?: boolean }): this {
    if (options) {
      this.commands.push({ openLink: { link, ...options } })
    } else {
      this.commands.push({ openLink: link })
    }
    return this
  }

  // Interaction methods
  tapOn(selector: Selector | [number, number]): this {
    if (Array.isArray(selector)) {
      this.commands.push({ tapOn: { point: selector } })
    } else {
      this.commands.push({ tapOn: selector })
    }
    return this
  }

  doubleTapOn(selector: Selector): this {
    this.commands.push({ doubleTapOn: selector })
    return this
  }

  longPressOn(selector: Selector, duration?: number): this {
    if (typeof selector === 'object' && 'point' in selector) {
      this.commands.push({ longPressOn: { ...selector, duration } })
    } else {
      this.commands.push({ longPressOn: selector })
    }
    return this
  }

  swipe(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', options?: { from?: Selector; duration?: number }): this
  swipe(start: [number, number], end: [number, number], duration?: number): this
  swipe(
    directionOrStart: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | [number, number],
    optionsOrEnd?: { from?: Selector; duration?: number } | [number, number],
    duration?: number,
  ): this {
    if (Array.isArray(directionOrStart)) {
      this.commands.push({
        swipe: {
          start: directionOrStart,
          end: optionsOrEnd as [number, number],
          duration,
        },
      })
    } else {
      const opts = optionsOrEnd as { from?: Selector; duration?: number } | undefined
      this.commands.push({
        swipe: {
          direction: directionOrStart,
          ...(opts ?? {}),
        },
      })
    }
    return this
  }

  scroll(): this {
    this.commands.push({ scroll: true })
    return this
  }

  scrollUntilVisible(selector: Selector, options?: {
    direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
    timeout?: number
    speed?: number
    centerElement?: boolean
  }): this {
    this.commands.push({
      scrollUntilVisible: {
        element: selector,
        ...(options ?? {}),
      },
    })
    return this
  }

  // Text input methods
  inputText(text: string, label?: string): this {
    if (label) {
      this.commands.push({ inputText: { text, label } })
    } else {
      this.commands.push({ inputText: text })
    }
    return this
  }

  eraseText(charactersToErase: number, label?: string): this {
    if (label) {
      this.commands.push({ eraseText: { charactersToErase, label } })
    } else {
      this.commands.push({ eraseText: charactersToErase })
    }
    return this
  }

  pasteText(text?: string): this {
    this.commands.push({ pasteText: text })
    return this
  }

  copyTextFrom(selector: Selector): this {
    this.commands.push({ copyTextFrom: selector })
    return this
  }

  hideKeyboard(): this {
    this.commands.push({ hideKeyboard: true })
    return this
  }

  pressKey(key: string): this {
    this.commands.push({ pressKey: key })
    return this
  }

  // Assertion methods
  assertVisible(selector: Selector, timeout?: number): this {
    if (timeout !== undefined) {
      this.commands.push({ assertVisible: { selector, timeout } })
    } else {
      this.commands.push({ assertVisible: selector })
    }
    return this
  }

  assertNotVisible(selector: Selector, timeout?: number): this {
    if (timeout !== undefined) {
      this.commands.push({ assertNotVisible: { selector, timeout } })
    } else {
      this.commands.push({ assertNotVisible: selector })
    }
    return this
  }

  assertTrue(condition: string, label?: string): this {
    if (label) {
      this.commands.push({ assertTrue: { condition, label } })
    } else {
      this.commands.push({ assertTrue: condition })
    }
    return this
  }

  // Wait methods
  waitUntilVisible(selector: Selector, timeout?: number): this {
    this.commands.push({
      extendedWaitUntil: {
        visible: selector,
        timeout,
      },
    })
    return this
  }

  waitUntilNotVisible(selector: Selector, timeout?: number): this {
    this.commands.push({
      extendedWaitUntil: {
        notVisible: selector,
        timeout,
      },
    })
    return this
  }

  waitForAnimationToEnd(timeout?: number): this {
    this.commands.push({
      waitForAnimationToEnd: {
        timeout,
      },
    })
    return this
  }

  // Script methods
  runScript(file: string, options?: { env?: Record<string, string> }): this {
    if (options) {
      this.commands.push({ runScript: { file, ...options } })
    } else {
      this.commands.push({ runScript: file })
    }
    return this
  }

  evalScript(script: string): this {
    this.commands.push({ evalScript: script })
    return this
  }

  runFlow(file: string, options?: { env?: Record<string, string> }): this {
    if (options) {
      this.commands.push({ runFlow: { file, ...options } })
    } else {
      this.commands.push({ runFlow: file })
    }
    return this
  }

  // Control flow methods
  repeat(times: number, fn: (builder: FlowBuilder) => void): this {
    const repeatBuilder = new FlowBuilder()
    fn(repeatBuilder)
    this.commands.push({
      repeat: {
        times,
        commands: repeatBuilder.commands,
      },
    })
    return this
  }

  repeatWhile(condition: { visible?: Selector; notVisible?: Selector; true?: string }, fn: (builder: FlowBuilder) => void): this {
    const repeatBuilder = new FlowBuilder()
    fn(repeatBuilder)
    this.commands.push({
      repeat: {
        while: condition,
        commands: repeatBuilder.commands,
      },
    })
    return this
  }

  // Media methods
  takeScreenshot(path: string): this {
    this.commands.push({ takeScreenshot: path })
    return this
  }

  startRecording(path: string): this {
    this.commands.push({ startRecording: path })
    return this
  }

  stopRecording(): this {
    this.commands.push({ stopRecording: true })
    return this
  }

  // Device methods
  setLocation(latitude: number, longitude: number): this {
    this.commands.push({ setLocation: { latitude, longitude } })
    return this
  }

  setAirplaneMode(enabled: boolean): this {
    this.commands.push({ setAirplaneMode: enabled ? 'enabled' : 'disabled' })
    return this
  }

  addMedia(...paths: string[]): this {
    this.commands.push({ addMedia: paths })
    return this
  }

  // Build the flow
  build(): Flow {
    return {
      config: this.config,
      commands: this.commands,
    }
  }

  // Add raw command
  addCommand(command: Command): this {
    this.commands.push(command)
    return this
  }
}

// Factory function
export const flow = (name?: string) => new FlowBuilder(name)