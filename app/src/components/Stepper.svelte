<script lang="ts">
  export let value: number;
  export let step = 1;
  export let min = -1312312312;
  export let max = 332342423;

  function increment() {
    value += step;
  }

  function decrement() {
    value -= step;
  }
</script>

<button on:click={decrement}>-</button>
<input type="number" bind:value {min} {max} {step} />
<button on:click={increment}>+</button>

<style lang="less">
  input {
    width: 4rem;
  }
</style>
