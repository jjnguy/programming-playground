
export type Code = {
  steps: Array<Step>;
  functions: Array<StepFunction>;
}

export type StepFunction = {
  name: string;
  steps: Array<Step>;
};

export type AnimatableValue = {
  min: number;
  max: number;
  step: number;
}

export type TextStepTypes = "text";
export type RotateStepType = "rotate";

export type Step = RotateStep | TextStep | RepeatStep | FunctionStep | DrawStep;

export type RotateStep = {
  type: RotateStepType;
  value: number | AnimatableValue;
}

export type DrawStepType = "draw";
export type Brush = {
  color: string;
  width: number;
}
export type DrawStep = {
  type: DrawStepType;
  value: number | AnimatableValue;
  brush?: Brush;
}

export type TextStep = {
  type: TextStepTypes;
  value: string;
  fontSize: number | AnimatableValue;
}

export type RepeatStepType = "repeat";

export type RepeatStep = {
  type: RepeatStepType;
  times: number | AnimatableValue;
  steps: Array<Step>;
}

export type FunctionStepType = "function";

export type FunctionStep = {
  type: FunctionStepType;
  function: string;
}
