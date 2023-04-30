
export type Code = {
  steps: Array<Step>
}

export type TextStepTypes = "text";
export type NumberStepTypes = "draw" | "move" | "rotate";

export type Step = NumberStep | TextStep | RepeatStep;

export type NumberStep = {
  type: NumberStepTypes
  value: number
}

export type TextStep = {
  type: TextStepTypes
  value: string
}

export type RepeatStepType = "repeat";

export type RepeatStep = {
  type: RepeatStepType
  times: number
  steps: Array<Step>
}
