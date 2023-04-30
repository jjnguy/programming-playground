<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Step } from "../types";
  import CodeBuilder from "./CodeBuilder.svelte";
  import Stepper from "./Stepper.svelte";

  let dispatch = createEventDispatcher();

  export let step: Step;

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
    } else if (step.type == "text" && !step.value) {
      step = {
        type: step.type,
        value: "",
      };
    } else if (step.type != "repeat" && step.type != "text" && !step.value) {
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
</select>
{#if step.type == "text"}
  <input bind:value={step.value} />
{:else if step.type != "repeat"}
  <Stepper bind:value={step.value} step={0.5} />
{:else if step.type == "repeat"}
  <Stepper bind:value={step.times} min={1} />
  <div>
    <CodeBuilder bind:steps={step.steps} />
  </div>
{/if}
<button on:click={requestDeletion}>delete</button>

<style lang="less">
  div {
    margin-left: 4rem;
  }
</style>
