import { moveStep, repeatStep, rotateStep, textStep, functionStep, type DrawingState, type StepExecutorCollection, type StepExecutor, drawStep, drawStepV2 } from "./drawingSteps";
import type { DrawStepType, DrawStepV2Type, NumberStepTypes, RepeatStepType, Step, StepFunction, TextStepTypes } from "./types";


export let stepExecutors: StepExecutorCollection = new Map<
    TextStepTypes | NumberStepTypes | RepeatStepType | DrawStepType | DrawStepV2Type,
    StepExecutor
>();

stepExecutors.set("text", textStep);

stepExecutors.set("move", moveStep);

stepExecutors.set("draw", drawStep);

stepExecutors.set("draw_2.0", drawStepV2);

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
