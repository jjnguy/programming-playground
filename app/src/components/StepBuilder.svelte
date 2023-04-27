<script lang="ts">
  import type { RepeatStep, SimpleStep } from "../types";
  import CodeBuilder from "./CodeBuilder.svelte";

  export let step: SimpleStep | RepeatStep;

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
  <input bind:value={step.value} type="number" />
{:else if step.type == "repeat"}
  <input bind:value={step.times} type="number" min="1" />
  <div>
    <CodeBuilder bind:steps={step.steps} />
  </div>
{/if}

<style lang="less">
  div {
    margin-left: 4rem;
  }
</style>
