
export type Code = {
  steps: Array<Step>
}

export type TextStepTypes = "text";
export type NumberStepTypes = "move" | "rotate";

export type Step = NumberStep | TextStep | RepeatStep | DrawStep;

export type NumberStep = {
  type: NumberStepTypes
  value: number
}

export type DrawStepType = "draw";

export type DrawStep = {
  type: DrawStepType;
  value: number;
  color: string;
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
