<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Step, StepFunction } from "../types";
  import CodeBuilder from "./CodeBuilder.svelte";
  import Stepper from "./Stepper.svelte";

  let dispatch = createEventDispatcher();

  export let step: Step;
  export let functions: Array<StepFunction>;

  function requestDeletion() {
    dispatch("delete");
  }

  function typeChanged() {
    if (step.type == "repeat" && !step.times) {
      step = {
        type: "repeat",
        times: 1,
        steps: [],
      };
    } else if (step.type == "function") {
      step = {
        type: step.type,
        function: null,
      };
    } else if (step.type == "text" && !step.value) {
      step = {
        type: step.type,
        value: "",
        fontSize: 10,
      };
    } else if (step.type == "draw" && !step.color) {
      step = {
        type: step.type,
        value: step.value || 0,
        color: "black",
      };
    } else if (
      step.type != "repeat" &&
      step.type != "text" &&
      step.type != "draw" &&
      !step.value
    ) {
      step = {
        type: step.type,
        value: 0,
      };
    }
  }
</script>

<select bind:value={step.type} on:change={typeChanged}>
  <option>move</option>
  <option>draw</option>
  <option>rotate</option>
  <option>text</option>
  <option>repeat</option>
  <option>function</option>
</select>
{#if step.type == "text"}
  <input bind:value={step.value} />
  <input bind:value={step.fontSize} type="number" />
{:else if step.type == "draw"}
  <Stepper bind:value={step.value} step={0.5} />
  <input type="color" bind:value={step.color} />
{:else if step.type == "function"}
  <select bind:value={step.function}>
    {#each functions as func}
      <option>{func.name}</option>
    {/each}
  </select>
{:else if step.type != "repeat"}
  <Stepper bind:value={step.value} step={0.5} />
{:else if step.type == "repeat"}
  <Stepper bind:value={step.times} min={1} />
  <div>
    <CodeBuilder bind:steps={step.steps} {functions} />
  </div>
{/if}
<button on:click={requestDeletion}>delete</button>

<style lang="less">
  div {
    margin-left: 4rem;
  }
</style>
