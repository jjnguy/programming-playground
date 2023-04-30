<script lang="ts">
  import { afterUpdate, onMount } from "svelte";
  import CodeBuilder from "./components/CodeBuilder.svelte";
  import type { Code } from "./types";

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

  function evaluateCode(ctx, currentPoint, currentHeading, steps) {
    steps.forEach((step) => {
      if (step.type == "draw") {
        let nextPoint = {
          x: currentPoint.x + Math.cos(degToRad(currentHeading)) * step.value,
          y: currentPoint.y + Math.sin(degToRad(currentHeading)) * step.value,
        };
        ctx.beginPath();
        ctx.moveTo(currentPoint.x, currentPoint.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
        currentPoint = nextPoint;
      } else if (step.type == "move") {
        let nextPoint = {
          x: currentPoint.x + Math.cos(degToRad(currentHeading)) * step.value,
          y: currentPoint.y + Math.sin(degToRad(currentHeading)) * step.value,
        };
        ctx.beginPath();
        ctx.moveTo(currentPoint.x, currentPoint.y);
        ctx.moveTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
        currentPoint = nextPoint;
      } else if (step.type == "rotate") {
        currentHeading += step.value;
        currentHeading %= 360;
      } else if (step.type == "repeat") {
        for (let i = 0; i < step.times; i++) {
          let result = evaluateCode(
            ctx,
            currentPoint,
            currentHeading,
            step.steps
          );
          currentHeading = result.currentHeading;
          currentPoint = result.currentPoint;
        }
      } else if (step.type == "text") {
        let measurement = ctx.measureText(step.value);
        let actualHeight =
          measurement.actualBoundingBoxAscent +
          measurement.actualBoundingBoxDescent;
        ctx.fillText(
          step.value,
          currentPoint.x - measurement.width / 2,
          currentPoint.y + actualHeight / 2
        );
      }
    });

    return {
      currentHeading,
      currentPoint,
    };
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
    evaluateCode(ctx, currentPoint, currentHeading, code.steps);
  });

  afterUpdate(() => {
    localStorage.setItem("prog-playground_code", JSON.stringify(code));

    let ctx = canvas.getContext("2d");
    let currentPoint = { x: canvas.width / 2, y: canvas.height / 2 };
    let currentHeading = 0;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, 500, 500);
    evaluateCode(ctx, currentPoint, currentHeading, code.steps);
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
