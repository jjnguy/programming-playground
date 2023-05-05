<script lang="ts">
  import { afterUpdate, onMount } from "svelte";
  import CodeBuilder from "./components/CodeBuilder.svelte";
  import type {
    Code,
    DrawStep,
    DrawStepType,
    NumberStep,
    NumberStepTypes,
    RepeatStep,
    RepeatStepType,
    Step,
    TextStep,
    TextStepTypes,
  } from "./types";
  import type { DrawingState } from "./drawingSteps";
  import { evaluateCode, stepExecutors } from "./drawing";

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
