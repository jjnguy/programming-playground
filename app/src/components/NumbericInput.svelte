<script lang="ts">
    import type { AnimatableValue } from "../types";
    import Stepper from "./Stepper.svelte";

    export let value: number | AnimatableValue;
    export let step = 1;
    export let min = -1312312312;
    export let max = 332342423;

    function makeAnimatable() {
        if (typeof value == "number") {
            value = {
                min: value,
                max: value,
                step: 1,
            };
        }
    }
</script>

{#if typeof value == "number"}
    <Stepper bind:value {step} {min} {max} />
    <button on:click={makeAnimatable}>animate</button>
{:else}
    <Stepper bind:value={value.min} {step} {min} {max} />
    to
    <Stepper bind:value={value.max} {step} {min} {max} />
{/if}
