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
</script>

<div class="step-name">{step.type}</div>
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

    &.step-name {
      font-weight: bold;
      margin-left: 0;
    }
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
