<script>
  export let theme
  export let onChange
</script>

<button on:click={onChange} class="toggle">{theme}</button>

<style>
.toggle {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
