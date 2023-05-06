<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Step, StepFunction } from "../types";
  import CodeBuilder from "./CodeBuilder.svelte";
  import NumbericInput from "./NumbericInput.svelte";

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
    } else if (step.type == "text") {
      step = {
        type: step.type,
        value: "text",
        fontSize: 10,
      };
    } else if (step.type == "draw" && !step.color) {
      step = {
        type: step.type,
        value: step.value || 0,
        color: "000000",
      };
    } else if (step.type != "repeat" && step.type != "draw" && !step.value) {
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
  <NumbericInput bind:value={step.fontSize} />
{:else if step.type == "draw"}
  <NumbericInput bind:value={step.value} step={0.5} />
  <input type="color" bind:value={step.color} />
{:else if step.type == "function"}
  <select bind:value={step.function}>
    {#each functions as func}
      <option>{func.name}</option>
    {/each}
  </select>
{:else if step.type != "repeat"}
  <NumbericInput bind:value={step.value} step={0.5} />
{:else if step.type == "repeat"}
  <NumbericInput bind:value={step.times} min={1} />
  <div>
    <CodeBuilder bind:steps={step.steps} {functions} />
  </div>
{/if}
<button on:click={requestDeletion}>delete</button>

<style lang="less">
  div {
    margin-left: 4rem;
  }

  select {
    padding: 0.7rem;
  }

  input {
    padding: 0.7rem;
  }

  button {
    padding: 0.7rem 1rem;
  }
</style>
