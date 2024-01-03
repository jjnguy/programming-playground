<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Step, StepFunction } from "../types";
  import CodeBuilder from "./CodeBuilder.svelte";
  import NumbericInput from "./NumbericInput.svelte";
  import DrawStepBuilder from "./DrawStepBuilder.svelte";

  let dispatch = createEventDispatcher();

  export let step: Step;
  export let functions: Array<StepFunction>;

  let editMode = false;

  function requestDeletion() {
    dispatch("delete");
  }
</script>

{#if editMode}
  <div class="step-name">
    {step.type}
    <button class="small" on:click={() => (editMode = false)}>done</button>
  </div>
  {#if step.type == "text"}
    <input bind:value={step.value} />
    <NumbericInput bind:value={step.fontSize} />
  {:else if step.type == "draw"}
    <DrawStepBuilder bind:step />
  {:else if step.type == "function"}
    <select bind:value={step.function}>
      {#each functions as func}
        <option>{func.name}</option>
      {/each}
    </select>
  {:else if step.type == "rotate"}
    <NumbericInput bind:value={step.value} step={0.5} />
  {:else if step.type == "repeat"}
    <NumbericInput bind:value={step.times} min={1} />
    <div class="steps-container">
      <CodeBuilder bind:steps={step.steps} {functions} {editMode} />
    </div>
  {/if}
  <button on:click={requestDeletion}>delete</button>
{:else}
  <div class="step-name">
    {step.type}
    <button class="small" on:click={() => (editMode = true)}>edit</button>
  </div>
  {#if step.type == "text"}
    <span>"{step.value}" @ {step.fontSize ?? 10}px</span>
  {:else if step.type == "draw"}
    <span>{step.value}px</span>
  {:else if step.type == "function"}
    <span>execute `{step.function}`</span>
  {:else if step.type == "rotate"}
    <span>{step.value}°</span>
  {:else if step.type == "repeat"}
    <span>{step.times} x {step.steps.length} steps</span>
    <div class="steps-container">
      <CodeBuilder bind:steps={step.steps} {functions} {editMode} />
    </div>
  {/if}
{/if}

<style lang="less">
  div.steps-container {
    margin-left: 4rem;
  }

  div.step-name {
    font-weight: bold;
    margin-left: 0;
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
