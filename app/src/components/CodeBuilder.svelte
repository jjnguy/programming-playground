<script lang="ts">
  import type { Step } from "../types";
  import StepBuilder from "./StepBuilder.svelte";

  export let steps: Array<Step>;

  function insertStep(ix: number) {
    steps.splice(ix, 0, {
      type: "move",
      value: 0,
    });
    steps = steps;
  }
</script>

{#if steps}
  <ol>
    {#each steps as step, ix}
      <li>
        <button on:click={() => insertStep(ix)}>insert step</button>
      </li>
      <li>
        <StepBuilder bind:step />
      </li>
    {/each}
    <li>
      <button on:click={() => insertStep(steps.length)}>insert step</button>
    </li>
  </ol>
{/if}
