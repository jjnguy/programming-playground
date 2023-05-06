import { evaluateCode } from "./drawing";
import type { DrawStep, DrawStepType, FunctionStep, FunctionStepType, NumberStep, NumberStepTypes, RepeatStep, RepeatStepType, Step, StepFunction, TextStep, TextStepTypes } from "./types";


export type Boundries = {
    min: Point;
    max: Point;
};

export type Point = {
    x: number;
    y: number;
};

export type DrawingState = {
    heading: number;
    point: Point;
    boundries: Boundries;
};

export type StepExecutorCollection = Map<
    TextStepTypes | NumberStepTypes | RepeatStepType | DrawStepType | FunctionStepType,
    StepExecutor
>;

export type StepExecutor = (
    step: Step,
    drawingState: DrawingState,
    functions: Array<StepFunction>,
    ctx?: CanvasRenderingContext2D
) => DrawingState;

export let textStep = (
    step: TextStep,
    currentState: DrawingState,
    functions: Array<StepFunction>,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    if (ctx) {
        ctx.font = `${step.fontSize}px sans-serif`;
        let measurement = ctx.measureText(step.value);
        let actualHeight =
            measurement.actualBoundingBoxAscent +
            measurement.actualBoundingBoxDescent;
        ctx.fillText(
            step.value,
            currentState.point.x - measurement.width / 2,
            currentState.point.y + actualHeight / 2
        );
    }
    return { ...currentState };
}

export let moveStep = (
    step: NumberStep,
    currentState: DrawingState,
    functions: Array<StepFunction>,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    let nextPoint = {
        x:
            currentState.point.x +
            Math.cos(degToRad(currentState.heading)) * step.value,
        y:
            currentState.point.y +
            Math.sin(degToRad(currentState.heading)) * step.value,
    };

    return {
        ...currentState,
        point: nextPoint,
        boundries: {
            min: {
                x: Math.min(currentState.boundries.min.x, nextPoint.x),
                y: Math.min(currentState.boundries.min.y, nextPoint.y),
            },
            max: {
                x: Math.max(currentState.boundries.max.x, nextPoint.x),
                y: Math.max(currentState.boundries.max.y, nextPoint.y),
            },
        },
    };
};

export let drawStep = (
    step: DrawStep,
    currentState: DrawingState,
    functions: Array<StepFunction>,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    let nextPoint = {
        x:
            currentState.point.x +
            Math.cos(degToRad(currentState.heading)) * step.value,
        y:
            currentState.point.y +
            Math.sin(degToRad(currentState.heading)) * step.value,
    };
    if (ctx) {
        ctx.strokeStyle = step.color;
        ctx.beginPath();
        ctx.moveTo(currentState.point.x, currentState.point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
    }
    return {
        ...currentState,
        point: nextPoint,
        boundries: {
            min: {
                x: Math.min(currentState.boundries.min.x, nextPoint.x),
                y: Math.min(currentState.boundries.min.y, nextPoint.y),
            },
            max: {
                x: Math.max(currentState.boundries.max.x, nextPoint.x),
                y: Math.max(currentState.boundries.max.y, nextPoint.y),
            },
        },
    };
};

export let rotateStep = (
    step: NumberStep,
    currentState: DrawingState,
    functions: Array<StepFunction>,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    let newHeading = currentState.heading + step.value;
    newHeading %= 360;
    return {
        ...currentState,
        heading: newHeading,
    };
};

export let repeatStep = (
    step: RepeatStep,
    currentState: DrawingState,
    functions: Array<StepFunction>,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    let newState = { ...currentState };
    for (let i = 0; i < step.times; i++) {
        newState = evaluateCode(ctx, newState, step.steps, functions);
    }

    return newState;
};

function degToRad(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
}

export let functionStep = (
    step: FunctionStep,
    currentState: DrawingState,
    functions: Array<StepFunction>,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    let fun = functions.find(f => f.name == step.function);
    return evaluateCode(ctx, currentState, fun.steps, functions);
};
