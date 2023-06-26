<script lang="ts">
  import ThemeToggle from './lib/ThemeToggle.svelte'
  let colorScheme = 'light'

  function handleSwitch() {
    document.body.classList.toggle('theme-light')
    colorScheme = colorScheme === 'light' ? 'dark' : 'light'
  }
</script>

<main>
  <ThemeToggle onChange={handleSwitch} theme={colorScheme} />
  <p>UNDER CONSTRUCTION</p>
</main>

<style>
</style>
