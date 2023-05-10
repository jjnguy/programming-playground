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
    time: number,
    ctx?: CanvasRenderingContext2D
) => DrawingState;

export let textStep = (
    step: TextStep,
    currentState: DrawingState,
    functions: Array<StepFunction>,
    time: number,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    if (ctx) {
        let stepValue = typeof step.fontSize == "number" || step.fontSize == undefined
            ? step.fontSize ?? 10
            : (step.fontSize.max - step.fontSize.min) * (time / 100.0) + step.fontSize.min;

        ctx.font = `${stepValue}px sans-serif`;
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
    time: number,
    ctx?: CanvasRenderingContext2D
): DrawingState => {

    let stepValue = typeof step.value == "number"
        ? step.value
        : (step.value.max - step.value.min) * (time / 100.0) + step.value.min;

    let nextPoint = {
        x:
            currentState.point.x +
            Math.cos(degToRad(currentState.heading)) * stepValue,
        y:
            currentState.point.y +
            Math.sin(degToRad(currentState.heading)) * stepValue,
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
    time: number,
    ctx?: CanvasRenderingContext2D
): DrawingState => {

    let stepValue = typeof step.value == "number"
        ? step.value
        : (step.value.max - step.value.min) * (time / 100.0) + step.value.min;

    let nextPoint = {
        x:
            currentState.point.x +
            Math.cos(degToRad(currentState.heading)) * stepValue,
        y:
            currentState.point.y +
            Math.sin(degToRad(currentState.heading)) * stepValue,
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
    time: number,
    ctx?: CanvasRenderingContext2D
): DrawingState => {

    let stepValue = typeof step.value == "number"
        ? step.value
        : (step.value.max - step.value.min) * (time / 100.0) + step.value.min;

    let newHeading = currentState.heading + stepValue;
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
    time: number,
    ctx?: CanvasRenderingContext2D
): DrawingState => {

    if (step.times === undefined) {
        return currentState;
    }

    let stepValue = typeof step.times == "number"
        ? step.times
        : (step.times.max - step.times.min) * (time / 100.0) + step.times.min;

    let newState = { ...currentState };
    for (let i = 0; i < stepValue; i++) {
        newState = evaluateCode(ctx, newState, step.steps, functions, time);
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
    time: number,
    ctx?: CanvasRenderingContext2D
): DrawingState => {
    let fun = functions.find(f => f.name == step.function);
    if (fun) {
        return evaluateCode(ctx, currentState, fun.steps, functions, time);
    } else {
        return currentState;
    }
};
