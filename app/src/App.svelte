<script lang="ts">
  import { afterUpdate, onMount } from "svelte";

  let code = {
    steps: [
      {
        type: "move",
        value: 10,
      },
      {
        type: "rotate",
        value: 90,
      },
      {
        type: "move",
        value: 10,
      },
    ],
  };
  let canvas: HTMLCanvasElement;

  let codeText = JSON.stringify(code, null, "  ");

  afterUpdate(() => {
    console.log(new Date());
  });

  function evaluateCode() {
    let ctx = canvas.getContext("2d");
    let currentPoint = { x: canvas.width / 2, y: canvas.height / 2 };
    let currentHeading = 0;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentPoint.x, currentPoint.y);
    ctx.stroke();
    code.steps.forEach((step) => {
      if (step.type == "move") {
        let nextPoint = {
          x: currentPoint.x + Math.cos(degToRad(currentHeading)) * step.value,
          y: currentPoint.y + Math.sin(degToRad(currentHeading)) * step.value,
        };
        console.log(nextPoint);
        ctx.beginPath();
        ctx.moveTo(currentPoint.x, currentPoint.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.stroke();
        currentPoint = nextPoint;
      } else if (step.type == "rotate") {
        currentHeading += step.value;
        currentHeading %= 360;
      }
    });
  }

  onMount(() => {
    evaluateCode();
  });

  function degToRad(degrees) {
    var pi = Math.PI;
    return degrees * (pi / 180);
  }
</script>

<h1>Programming Playground</h1>
<main>
  <section>
    <canvas width="500" height="500" bind:this={canvas} id="canvas" />
  </section>
  <section>
    <textarea bind:value={codeText} />
  </section>
</main>

<style lang="less">
  main {
    display: flex;
  }

  div {
    &.deficit {
      color: red;
    }
  }
  canvas {
    border: 1px solid black;
  }

  textarea {
    height: 500px;
    width: 500px;
  }
</style>
