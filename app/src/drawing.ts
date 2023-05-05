import { moveStep, repeatStep, rotateStep, textStep, type DrawingState, type StepExecutorCollection, type StepExecutor, drawStep } from "./drawingSteps";
import type { DrawStep, DrawStepType, NumberStepTypes, RepeatStepType, Step, TextStepTypes } from "./types";


export let stepExecutors: StepExecutorCollection = new Map<
    TextStepTypes | NumberStepTypes | RepeatStepType | DrawStepType,
    StepExecutor
>();

stepExecutors.set("text", textStep);

stepExecutors.set("move", moveStep);

stepExecutors.set("draw", drawStep);

stepExecutors.set("rotate", rotateStep);

stepExecutors.set("repeat", repeatStep);

export function evaluateCode(
    ctx,
    currentState: DrawingState,
    steps: Array<Step>
): DrawingState {
    steps.forEach((step: Step) => {
        currentState = stepExecutors.get(step.type)(step, currentState, ctx);
    });

    return currentState;
}
