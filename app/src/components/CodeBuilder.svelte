<script lang="ts">
  import type { Step, StepFunction } from "../types";
  import StepBuilder from "./StepBuilder.svelte";

  export let steps: Array<Step>;
  export let functions: Array<StepFunction>;

  function insertStep(ix: number) {
    steps.splice(ix, 0, {
      type: "move",
      value: 0,
    });
    steps = steps;
  }

  function del(ix) {
    steps.splice(ix, 1);
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
        <StepBuilder on:delete={() => del(ix)} bind:step {functions} />
      </li>
    {/each}
    <li>
      <button on:click={() => insertStep(steps.length)}>insert step</button>
    </li>
  </ol>
{/if}
