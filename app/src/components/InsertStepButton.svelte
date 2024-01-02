<script lang="ts">
  import type { Step } from "../types";

  export let steps: Array<Step>;
  export let index: number;

  let showStepChoices = false;

  function beginInsertStep() {
    showStepChoices = true;
  }

  function insertStep(stepType: string) {
    let step: Step = null;
    if (stepType == "repeat") {
      step = {
        type: "repeat",
        times: 1,
        steps: [],
      };
    } else if (stepType == "function") {
      step = {
        type: "function",
        function: null,
      };
    } else if (stepType == "text") {
      step = {
        type: "text",
        value: "text",
        fontSize: 10,
      };
    } else if (stepType == "draw") {
      step = {
        type: "draw",
        value: 0,
        color: "000000",
      };
    } else if (stepType == "move") {
      step = {
        type: "move",
        value: 0,
      };
    } else if (stepType == "rotate") {
      step = {
        type: "rotate",
        value: 0,
      };
    } else if (stepType == "draw_2.0") {
      step = {
        type: "draw_2.0",
        value: 0,
      };
    } else {
      throw new Error("unknown step type");
    }

    steps.splice(index, 0, step);
    steps = steps;
    showStepChoices = false;
  }
</script>

{#if showStepChoices}
  <div>
    <button on:click={() => insertStep("move")}>move</button>
    <button on:click={() => insertStep("rotate")}>rotate</button>
    <button on:click={() => insertStep("draw")}>draw</button>
    <button on:click={() => insertStep("draw_2.0")}>draw2</button>
    <button on:click={() => insertStep("text")}>text</button>
    <button on:click={() => insertStep("repeat")}>repeat</button>
    <button on:click={() => insertStep("function")}>function</button>
  </div>
{:else}
  <button on:click={() => beginInsertStep()}>insert step</button>
{/if}

<style lang="less">
  button {
    padding: 0.7rem 1rem;
  }
</style>
