import { Schema } from 'effect'

// Common types
export const Selector: Schema.Schema<any> = Schema.Union(
  Schema.String,
  Schema.Struct({
    id: Schema.optional(Schema.String),
    text: Schema.optional(Schema.String),
    index: Schema.optional(Schema.Number),
    enabled: Schema.optional(Schema.Boolean),
    focused: Schema.optional(Schema.Boolean),
    selected: Schema.optional(Schema.Boolean),
    checked: Schema.optional(Schema.Boolean),
    childOf: Schema.optional(Schema.suspend(() => Selector)),
    containsChild: Schema.optional(Schema.suspend(() => Selector)),
    containsDescendants: Schema.optional(
      Schema.Array(Schema.suspend(() => Selector)),
    ),
  }),
)
export type Selector = typeof Selector.Type

export const Point = Schema.Tuple(Schema.Number, Schema.Number)
export type Point = typeof Point.Type

export const SwipeDirection = Schema.Literal('UP', 'DOWN', 'LEFT', 'RIGHT')
export type SwipeDirection = typeof SwipeDirection.Type

// App Control Commands
export const LaunchAppCommand = Schema.Struct({
  launchApp: Schema.Union(
    Schema.String,
    Schema.Struct({
      appId: Schema.optional(Schema.String),
      clearState: Schema.optional(Schema.Boolean),
      clearKeychain: Schema.optional(Schema.Boolean),
      stopApp: Schema.optional(Schema.Boolean),
      permissions: Schema.optional(
        Schema.Record({ key: Schema.String, value: Schema.Literal('allow', 'deny') }),
      ),
      arguments: Schema.optional(Schema.Array(Schema.String)),
      launchArguments: Schema.optional(
        Schema.Record({ key: Schema.String, value: Schema.Unknown }),
      ),
    }),
  ),
})
export type LaunchAppCommand = typeof LaunchAppCommand.Type

export const KillAppCommand = Schema.Struct({
  killApp: Schema.optional(Schema.String),
})
export type KillAppCommand = typeof KillAppCommand.Type

export const StopAppCommand = Schema.Struct({
  stopApp: Schema.optional(Schema.String),
})
export type StopAppCommand = typeof StopAppCommand.Type

export const ClearStateCommand = Schema.Struct({
  clearState: Schema.optional(Schema.String),
})
export type ClearStateCommand = typeof ClearStateCommand.Type

export const ClearKeychainCommand = Schema.Struct({
  clearKeychain: Schema.Literal(true),
})
export type ClearKeychainCommand = typeof ClearKeychainCommand.Type

// Navigation Commands
export const BackCommand = Schema.Struct({
  back: Schema.Literal(true),
})
export type BackCommand = typeof BackCommand.Type

export const OpenLinkCommand = Schema.Struct({
  openLink: Schema.Union(
    Schema.String,
    Schema.Struct({
      link: Schema.String,
      autoVerify: Schema.optional(Schema.Boolean),
      browser: Schema.optional(Schema.Boolean),
    }),
  ),
})
export type OpenLinkCommand = typeof OpenLinkCommand.Type

// Interaction Commands
export const TapOnCommand = Schema.Struct({
  tapOn: Schema.Union(
    Selector,
    Schema.Struct({
      point: Point,
      retryTapIfNoChange: Schema.optional(Schema.Boolean),
      longPress: Schema.optional(Schema.Boolean),
      repeat: Schema.optional(Schema.Number),
      waitToSettleTimeoutMs: Schema.optional(Schema.Number),
    }),
  ),
})
export type TapOnCommand = typeof TapOnCommand.Type

export const DoubleTapOnCommand = Schema.Struct({
  doubleTapOn: Selector,
})
export type DoubleTapOnCommand = typeof DoubleTapOnCommand.Type

export const LongPressOnCommand = Schema.Struct({
  longPressOn: Schema.Union(
    Selector,
    Schema.Struct({
      point: Point,
      duration: Schema.optional(Schema.Number),
    }),
  ),
})
export type LongPressOnCommand = typeof LongPressOnCommand.Type

export const SwipeCommand = Schema.Struct({
  swipe: Schema.Union(
    Schema.Struct({
      start: Point,
      end: Point,
      duration: Schema.optional(Schema.Number),
    }),
    Schema.Struct({
      direction: SwipeDirection,
      from: Schema.optional(Selector),
      duration: Schema.optional(Schema.Number),
    }),
  ),
})
export type SwipeCommand = typeof SwipeCommand.Type

export const ScrollCommand = Schema.Struct({
  scroll: Schema.Literal(true),
})
export type ScrollCommand = typeof ScrollCommand.Type

export const ScrollUntilVisibleCommand = Schema.Struct({
  scrollUntilVisible: Schema.Struct({
    element: Selector,
    direction: Schema.optional(SwipeDirection),
    timeout: Schema.optional(Schema.Number),
    speed: Schema.optional(Schema.Number),
    centerElement: Schema.optional(Schema.Boolean),
  }),
})
export type ScrollUntilVisibleCommand = typeof ScrollUntilVisibleCommand.Type

// Text Input Commands
export const InputTextCommand = Schema.Struct({
  inputText: Schema.Union(
    Schema.String,
    Schema.Struct({
      text: Schema.String,
      label: Schema.optional(Schema.String),
    }),
  ),
})
export type InputTextCommand = typeof InputTextCommand.Type

export const EraseTextCommand = Schema.Struct({
  eraseText: Schema.Union(
    Schema.Number,
    Schema.Struct({
      charactersToErase: Schema.Number,
      label: Schema.optional(Schema.String),
    }),
  ),
})
export type EraseTextCommand = typeof EraseTextCommand.Type

export const PasteTextCommand = Schema.Struct({
  pasteText: Schema.optional(Schema.String),
})
export type PasteTextCommand = typeof PasteTextCommand.Type

export const CopyTextFromCommand = Schema.Struct({
  copyTextFrom: Selector,
})
export type CopyTextFromCommand = typeof CopyTextFromCommand.Type

export const HideKeyboardCommand = Schema.Struct({
  hideKeyboard: Schema.Literal(true),
})
export type HideKeyboardCommand = typeof HideKeyboardCommand.Type

export const PressKeyCommand = Schema.Struct({
  pressKey: Schema.String,
})
export type PressKeyCommand = typeof PressKeyCommand.Type

// Assertion Commands
export const AssertVisibleCommand = Schema.Struct({
  assertVisible: Schema.Union(
    Selector,
    Schema.Struct({
      selector: Selector,
      timeout: Schema.optional(Schema.Number),
    }),
  ),
})
export type AssertVisibleCommand = typeof AssertVisibleCommand.Type

export const AssertNotVisibleCommand = Schema.Struct({
  assertNotVisible: Schema.Union(
    Selector,
    Schema.Struct({
      selector: Selector,
      timeout: Schema.optional(Schema.Number),
    }),
  ),
})
export type AssertNotVisibleCommand = typeof AssertNotVisibleCommand.Type

export const AssertTrueCommand = Schema.Struct({
  assertTrue: Schema.Union(
    Schema.String,
    Schema.Struct({
      condition: Schema.String,
      label: Schema.optional(Schema.String),
    }),
  ),
})
export type AssertTrueCommand = typeof AssertTrueCommand.Type

// Wait Commands
export const ExtendedWaitUntilCommand = Schema.Struct({
  extendedWaitUntil: Schema.Struct({
    visible: Schema.optional(Selector),
    notVisible: Schema.optional(Selector),
    timeout: Schema.optional(Schema.Number),
  }),
})
export type ExtendedWaitUntilCommand = typeof ExtendedWaitUntilCommand.Type

export const WaitForAnimationToEndCommand = Schema.Struct({
  waitForAnimationToEnd: Schema.Struct({
    timeout: Schema.optional(Schema.Number),
  }),
})
export type WaitForAnimationToEndCommand = typeof WaitForAnimationToEndCommand.Type

// Script Commands
export const RunScriptCommand = Schema.Struct({
  runScript: Schema.Union(
    Schema.String,
    Schema.Struct({
      file: Schema.String,
      env: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
      when: Schema.optional(
        Schema.Struct({
          visible: Schema.optional(Selector),
          notVisible: Schema.optional(Selector),
          true: Schema.optional(Schema.String),
          platform: Schema.optional(Schema.Literal('iOS', 'Android', 'Web')),
        }),
      ),
    }),
  ),
})
export type RunScriptCommand = typeof RunScriptCommand.Type

export const EvalScriptCommand = Schema.Struct({
  evalScript: Schema.String,
})
export type EvalScriptCommand = typeof EvalScriptCommand.Type

export const RunFlowCommand = Schema.Struct({
  runFlow: Schema.Union(
    Schema.String,
    Schema.Struct({
      file: Schema.String,
      env: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
      when: Schema.optional(
        Schema.Struct({
          visible: Schema.optional(Selector),
          notVisible: Schema.optional(Selector),
          true: Schema.optional(Schema.String),
          platform: Schema.optional(Schema.Literal('iOS', 'Android', 'Web')),
        }),
      ),
    }),
  ),
})
export type RunFlowCommand = typeof RunFlowCommand.Type

// Control Flow Commands
export const RepeatCommand: Schema.Schema<any> = Schema.Struct({
  repeat: Schema.Union(
    Schema.Number,
    Schema.Struct({
      times: Schema.optional(Schema.Number),
      while: Schema.optional(
        Schema.Struct({
          visible: Schema.optional(Selector),
          notVisible: Schema.optional(Selector),
          true: Schema.optional(Schema.String),
        }),
      ),
      commands: Schema.Array(Schema.suspend(() => Command)),
    }),
  ),
})
export type RepeatCommand = typeof RepeatCommand.Type

// Media Commands
export const TakeScreenshotCommand = Schema.Struct({
  takeScreenshot: Schema.Union(
    Schema.String,
    Schema.Struct({
      path: Schema.String,
    }),
  ),
})
export type TakeScreenshotCommand = typeof TakeScreenshotCommand.Type

export const StartRecordingCommand = Schema.Struct({
  startRecording: Schema.Union(
    Schema.String,
    Schema.Struct({
      path: Schema.String,
    }),
  ),
})
export type StartRecordingCommand = typeof StartRecordingCommand.Type

export const StopRecordingCommand = Schema.Struct({
  stopRecording: Schema.Literal(true),
})
export type StopRecordingCommand = typeof StopRecordingCommand.Type

// Device Commands
export const SetLocationCommand = Schema.Struct({
  setLocation: Schema.Struct({
    latitude: Schema.Number,
    longitude: Schema.Number,
  }),
})
export type SetLocationCommand = typeof SetLocationCommand.Type

export const SetAirplaneModeCommand = Schema.Struct({
  setAirplaneMode: Schema.Union(
    Schema.Literal('enabled'),
    Schema.Literal('disabled'),
  ),
})
export type SetAirplaneModeCommand = typeof SetAirplaneModeCommand.Type

export const AddMediaCommand = Schema.Struct({
  addMedia: Schema.Union(
    Schema.Array(Schema.String),
    Schema.Struct({
      paths: Schema.Array(Schema.String),
    }),
  ),
})
export type AddMediaCommand = typeof AddMediaCommand.Type

// All Commands Union
export const Command: Schema.Schema<any> = Schema.Union(
  LaunchAppCommand,
  KillAppCommand,
  StopAppCommand,
  ClearStateCommand,
  ClearKeychainCommand,
  BackCommand,
  OpenLinkCommand,
  TapOnCommand,
  DoubleTapOnCommand,
  LongPressOnCommand,
  SwipeCommand,
  ScrollCommand,
  ScrollUntilVisibleCommand,
  InputTextCommand,
  EraseTextCommand,
  PasteTextCommand,
  CopyTextFromCommand,
  HideKeyboardCommand,
  PressKeyCommand,
  AssertVisibleCommand,
  AssertNotVisibleCommand,
  AssertTrueCommand,
  ExtendedWaitUntilCommand,
  WaitForAnimationToEndCommand,
  RunScriptCommand,
  EvalScriptCommand,
  RunFlowCommand,
  RepeatCommand,
  TakeScreenshotCommand,
  StartRecordingCommand,
  StopRecordingCommand,
  SetLocationCommand,
  SetAirplaneModeCommand,
  AddMediaCommand,
)
export type Command = typeof Command.Type