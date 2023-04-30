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

  type StepExecutorCollection = Map<
    TextStepTypes | NumberStepTypes | RepeatStepType,
    StepExecutor
  >;

  type StepExecutor = (
    Step,
    DrawingState,
    CanvasRenderingContext2D
  ) => DrawingState;

  type Point = {
    x: number;
    y: number;
  };

  type DrawingState = {
    heading: number;
    point: Point;
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
      ctx: CanvasRenderingContext2D
    ): DrawingState => {
      let measurement = ctx.measureText(step.value);
      let actualHeight =
        measurement.actualBoundingBoxAscent +
        measurement.actualBoundingBoxDescent;
      ctx.fillText(
        step.value,
        currentState.point.x - measurement.width / 2,
        currentState.point.y + actualHeight / 2
      );
      return { ...currentState };
    }
  );

  stepExecutors.set(
    "move",
    (
      step: NumberStep,
      currentState: DrawingState,
      ctx: CanvasRenderingContext2D
    ): DrawingState => {
      let nextPoint = {
        x:
          currentState.point.x +
          Math.cos(degToRad(currentState.heading)) * step.value,
        y:
          currentState.point.y +
          Math.sin(degToRad(currentState.heading)) * step.value,
      };
      ctx.beginPath();
      ctx.moveTo(currentState.point.x, currentState.point.y);
      ctx.moveTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
      return { ...currentState, point: nextPoint };
    }
  );

  stepExecutors.set(
    "draw",
    (
      step: NumberStep,
      currentState: DrawingState,
      ctx: CanvasRenderingContext2D
    ): DrawingState => {
      let nextPoint = {
        x:
          currentState.point.x +
          Math.cos(degToRad(currentState.heading)) * step.value,
        y:
          currentState.point.y +
          Math.sin(degToRad(currentState.heading)) * step.value,
      };
      ctx.beginPath();
      ctx.moveTo(currentState.point.x, currentState.point.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.stroke();
      return { ...currentState, point: nextPoint };
    }
  );

  stepExecutors.set(
    "rotate",
    (
      step: NumberStep,
      currentState: DrawingState,
      ctx: CanvasRenderingContext2D
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
      ctx: CanvasRenderingContext2D
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

  function evaluateCode(
    ctx,
    currentState: DrawingState,
    steps: Array<Step>
  ): DrawingState {
    let boundries = {
      min: {
        x: 100000000,
        y: 100000000,
      },
      max: {
        x: -10000000,
        y: -10000000,
      },
    };
    // TODO: dry run first to calculate bounds. Then offset based on bounds
    steps.forEach((step: Step) => {
      currentState = stepExecutors.get(step.type)(step, currentState, ctx);
    });

    return currentState;
  }

  onMount(() => {
    if (screen.width < 1000) {
      canvas.width = canvas.height = screen.width;
    } else {
      canvas.width = canvas.height = 500;
    }

    let ctx = canvas.getContext("2d");
    let currentPoint = { x: canvas.width / 2, y: canvas.height / 2 };
    let currentHeading = 0;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, 500, 500);
    evaluateCode(
      ctx,
      {
        point: currentPoint,
        heading: currentHeading,
      },
      code.steps
    );
  });

  afterUpdate(() => {
    localStorage.setItem("prog-playground_code", JSON.stringify(code));

    let ctx = canvas.getContext("2d");
    let currentPoint = { x: canvas.width / 2, y: canvas.height / 2 };
    let currentHeading = 0;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, 500, 500);
    evaluateCode(
      ctx,
      {
        point: currentPoint,
        heading: currentHeading,
      },
      code.steps
    );
  });

  function degToRad(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
  }
</script>

<main>
  <canvas bind:this={canvas} id="canvas" />
  <section>
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
