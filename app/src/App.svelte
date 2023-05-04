<script lang="ts">
  import { afterUpdate, onMount } from "svelte";
  import CodeBuilder from "./components/CodeBuilder.svelte";
  import type {
    Code,
    NumberStep,
    NumberStepTypes,
    RepeatStep,
    RepeatStepType,
    Step,
    TextStep,
    TextStepTypes,
  } from "./types";

  type Boundries = {
    min: Point;
    max: Point;
  };

  type StepExecutorCollection = Map<
    TextStepTypes | NumberStepTypes | RepeatStepType,
    StepExecutor
  >;

  type StepExecutor = (
    Step,
    DrawingState,
    CanvasRenderingContext2D?
  ) => DrawingState;

  type Point = {
    x: number;
    y: number;
  };

  type DrawingState = {
    heading: number;
    point: Point;
    boundries: Boundries;
  };

  let stepExecutors: StepExecutorCollection = new Map<
    TextStepTypes | NumberStepTypes | RepeatStepType,
    StepExecutor
  >();

  stepExecutors.set(
    "text",
    (
      step: TextStep,
      currentState: DrawingState,
      ctx?: CanvasRenderingContext2D
    ): DrawingState => {
      if (ctx) {
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
  );

  stepExecutors.set(
    "move",
    (
      step: NumberStep,
      currentState: DrawingState,
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
        ctx.beginPath();
        ctx.moveTo(currentState.point.x, currentState.point.y);
        ctx.moveTo(nextPoint.x, nextPoint.y);
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
    }
  );

  stepExecutors.set(
    "draw",
    (
      step: NumberStep,
      currentState: DrawingState,
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
    }
  );

  stepExecutors.set(
    "rotate",
    (
      step: NumberStep,
      currentState: DrawingState,
      ctx?: CanvasRenderingContext2D
    ): DrawingState => {
      let newHeading = currentState.heading + step.value;
      newHeading %= 360;
      return {
        ...currentState,
        heading: newHeading,
      };
    }
  );

  stepExecutors.set(
    "repeat",
    (
      step: RepeatStep,
      currentState: DrawingState,
      ctx?: CanvasRenderingContext2D
    ): DrawingState => {
      let newState = { ...currentState };
      for (let i = 0; i < step.times; i++) {
        newState = evaluateCode(ctx, newState, step.steps);
      }

      return newState;
    }
  );

  let savedCode = localStorage.getItem("prog-playground_code");

  let code: Code = savedCode
    ? JSON.parse(savedCode)
    : {
        steps: [
          {
            type: "move",
            value: 200,
          },
          {
            type: "rotate",
            value: 90,
          },
          {
            type: "move",
            value: -20,
          },
          {
            type: "repeat",
            times: 80,
            steps: [
              {
                type: "draw",
                value: 18,
              },
              {
                type: "rotate",
                value: 5,
              },
              {
                type: "text",
                value: "😊",
              },
            ],
          },
        ],
      };
  let canvas: HTMLCanvasElement;

  function calculateBoundries(currentState: DrawingState, steps: Array<Step>) {
    steps.forEach((step: Step) => {
      currentState = stepExecutors.get(step.type)(step, currentState, null);
    });
    return currentState;
  }

  function evaluateCode(
    ctx,
    currentState: DrawingState,
    steps: Array<Step>
  ): DrawingState {
    steps.forEach((step: Step) => {
      currentState = stepExecutors.get(step.type)(step, currentState, ctx);
    });

    return currentState;
  }

  let autoCenter = true;

  function drawCode() {
    let ctx = canvas.getContext("2d");
    let canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, 500, 500);

    let initialState: DrawingState = {
      point: { ...canvasCenter },
      heading: 0,
      boundries: {
        min: canvasCenter,
        max: canvasCenter,
      },
    };

    if (!autoCenter) {
      evaluateCode(ctx, initialState, code.steps);
      return;
    }

    let finalState = calculateBoundries(initialState, code.steps);

    let centerOfResult = {
      x: (finalState.boundries.max.x + finalState.boundries.min.x) / 2,
      y: (finalState.boundries.max.y + finalState.boundries.min.y) / 2,
    };

    let distanceOffCenter = {
      x: centerOfResult.x - canvasCenter.x,
      y: centerOfResult.y - canvasCenter.y,
    };

    let shiftedPoint = {
      x: canvasCenter.x - distanceOffCenter.x,
      y: canvasCenter.y - distanceOffCenter.y,
    };

    evaluateCode(
      ctx,
      {
        point: shiftedPoint,
        heading: 0,
        boundries: initialState.boundries,
      },
      code.steps
    );
  }

  onMount(() => {
    if (screen.width < 1000) {
      canvas.width = canvas.height = screen.width;
    } else {
      canvas.width = canvas.height = 500;
    }

    drawCode();
  });

  afterUpdate(() => {
    localStorage.setItem("prog-playground_code", JSON.stringify(code));
    drawCode();
  });

  function degToRad(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
  }
</script>

<main>
  <canvas bind:this={canvas} id="canvas" />
  <section>
    <label
      >Auto Center <input type="checkbox" bind:checked={autoCenter} /></label
    >
    <CodeBuilder bind:steps={code.steps} />
  </section>
</main>

<style lang="less">
  main {
    display: flex;
    flex-wrap: wrap;
    height: 100vh;

    canvas {
      z-index: 15;
      background-color: white;
      border: 1px solid black;
    }

    section:last-child {
      z-index: 0;
    }
  }

  @media only screen and (max-width: 800px) {
    canvas {
      width: 100%;
      height: 100vw;
      position: fixed;
    }

    section:last-child {
      margin-top: 100vw;
    }
  }

  @media only screen and (min-width: 800px) {
    canvas {
      width: 500px;
      height: 500px;
      position: relative;
    }

    section:last-child {
      margin-top: 0;
    }
  }
</style>
