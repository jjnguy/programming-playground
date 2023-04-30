<script lang="ts">
  import type { Step } from "../types";
  import CodeBuilder from "./CodeBuilder.svelte";
  import Stepper from "./Stepper.svelte";

  export let step: Step;

  function typeChanged() {
    if (step.type == "repeat" && !step.times) {
      step = {
        type: "repeat",
        times: 1,
        steps: [],
      };
    } else if (step.type != "repeat" && !step.value) {
      step = {
        type: step.type,
        value: step.type == "text" ? "" : 0,
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

<style lang="less">
  div {
    margin-left: 4rem;
  }
</style>
