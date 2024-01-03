<script lang="ts">
  import type { DrawStep } from "../types";
  import NumbericInput from "./NumbericInput.svelte";
  import Stepper from "./Stepper.svelte";

  export let step: DrawStep;

  function handleCheck() {
    if (step.brush) {
      step = {
        ...step,
        brush: null,
      };
    } else {
      step = {
        ...step,
        brush: {
          color: "#000000",
          width: 2,
        },
      };
    }
  }
</script>

<NumbericInput bind:value={step.value} step={0.5} />
<label>
  <span>draw?</span>
  <input type="checkbox" checked={!!step.brush} on:change={handleCheck} />
</label>
{#if step.brush}
  <input type="color" bind:value={step.brush.color} />
  <Stepper bind:value={step.brush.width} min={1} />
{/if}
