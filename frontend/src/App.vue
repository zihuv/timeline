<script setup>
import DiaryPage from "@/components/DiaryPage.vue";
</script>

<template>
  <div class="app-container">
    
    <main class="app-main">
      <DiaryPage/>
    </main>
  </div>
</template>

<style>
:root {
  --primary-color: #409eff;
  --bg-color: #f5f7fa;
  --text-color: #333;
  --border-color: #dcdfe6;
  --radius: 4px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-color);
  background-color: var(--bg-color);
  line-height: 1.6;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: white;
  color: var(--primary-color);
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.app-main {
  flex: 1;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0.75rem;
  }
  
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .app-main {
    padding: 0.75rem;
  }
}
</style>
