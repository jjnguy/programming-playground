<script lang="ts">
  import type { Step, StepFunction } from "../types";
  import InsertStepButton from "./InsertStepButton.svelte";
  import StepBuilder from "./StepBuilder.svelte";

  export let steps: Array<Step>;
  export let functions: Array<StepFunction>;

  function del(ix: number) {
    steps.splice(ix, 1);
    steps = steps;
  }
</script>

{#if steps}
  <ol>
    {#each steps as step, ix}
      <li>
        <InsertStepButton index={ix} bind:steps />
      </li>
      <li>
        <StepBuilder on:delete={() => del(ix)} bind:step {functions} />
      </li>
    {/each}
    <li>
      <InsertStepButton index={steps.length} bind:steps />
    </li>
  </ol>
{/if}

<style lang="less">
</style>
