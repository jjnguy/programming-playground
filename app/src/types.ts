
export type Code = {
  steps: Array<Step>
}

export type SimpleStepTypes = "draw" | "move" | "rotate" | "text";

export type Step = SimpleStep | RepeatStep;

export type SimpleStep = {
  type: SimpleStepTypes
  value: number | string
}

export type RepeatStepType = "repeat";

export type RepeatStep = {
  type: RepeatStepType
  times: number
  steps: Array<Step>
}
