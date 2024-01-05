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

<div class="step">
  {#if editMode}
    <div class="step-contents">
      <div class="step-name">
        {step.type}
        <span>
          <button
            class="small"
            on:click|stopPropagation={() => (editMode = false)}>done</button
          >
          <button on:click={requestDeletion}>delete</button>
        </span>
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
    </div>
  {:else}
    <div
      class="step-contents"
      on:click|stopPropagation={() => (editMode = true)}
      on:keypress={() => (editMode = true)}
    >
      <div class="step-name">
        {step.type}
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
    </div>
  {/if}
</div>

<style lang="less">
  div.step {
    padding: 0.2rem 0rem 0.2rem 0.4rem;
    width: 100%;
    margin-bottom: 0.4rem;
    background-color: #dadada22;

    display: flex;

    *:last-child {
      margin-left: auto;
    }

    button {
      max-height: 3rem;
    }

    div.steps-container {
      margin-left: 1.5rem;
    }
  }

  div.step-contents {
    width: 100%;
  }

  div.step-name {
    font-weight: bold;
    margin-left: 0;
    width: 100%;
    display: flex;
  }

  select {
    padding: 0.7rem;
  }

  input {
    padding: 0.7rem;
  }

  button {
    padding: 0.7rem 1rem;
    margin-right: 0.4rem;
  }
</style>
