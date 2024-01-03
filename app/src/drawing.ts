import { repeatStep, rotateStep, textStep, functionStep, type DrawingState, type StepExecutorCollection, type StepExecutor, drawStep } from "./drawingSteps";
import type { DrawStepType, RepeatStepType, RotateStepType, Step, StepFunction, TextStepTypes } from "./types";


export let stepExecutors: StepExecutorCollection = new Map<
    TextStepTypes | RotateStepType | RepeatStepType | DrawStepType,
    StepExecutor
>();

stepExecutors.set("text", textStep);

stepExecutors.set("draw", drawStep);

stepExecutors.set("rotate", rotateStep);

stepExecutors.set("repeat", repeatStep);

stepExecutors.set("function", functionStep);

export function evaluateCode(
    ctx,
    currentState: DrawingState,
    steps: Array<Step>,
    functions: Array<StepFunction>,
    time: number
): DrawingState {
    steps.forEach((step: Step) => {
        currentState = stepExecutors.get(step.type)(step, currentState, functions, time, ctx);
    });

    return currentState;
}
