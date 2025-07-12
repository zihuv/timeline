<script setup>
import DiaryPage from "@/components/DiaryPage.vue";
import ConfigDialog from "@/components/ConfigDialog.vue";
import DataManager from "@/components/DataManager.vue";
import SmartSync from "@/components/SmartSync.vue";
import { ref } from 'vue';
import { Setting, DataAnalysis, Refresh } from '@element-plus/icons-vue';

const showConfigDialog = ref(false);
const showDataManagerDialog = ref(false);
const showSmartSyncDialog = ref(false);

const handleConfigChanged = (config) => {
  console.log('配置已更新:', config);
  // 可以在这里添加配置变化后的处理逻辑
};

const handleDataChanged = () => {
  console.log('数据已更新');
  // 可以在这里添加数据变化后的处理逻辑
};
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <h1>时间轴日记</h1>
        <div class="header-buttons">
          <el-button 
            type="text" 
            @click="showSmartSyncDialog = true"
            class="header-button"
          >
            <el-icon><Refresh /></el-icon>
            <span>智能同步</span>
          </el-button>
          <el-button 
            type="text" 
            @click="showDataManagerDialog = true"
            class="header-button"
          >
            <el-icon><DataAnalysis /></el-icon>
            <span>数据管理</span>
          </el-button>
          <el-button 
            type="text" 
            @click="showConfigDialog = true"
            class="header-button"
          >
            <el-icon><Setting /></el-icon>
            <span>配置</span>
          </el-button>
        </div>
      </div>
    </header>
    
    <main class="app-main">
      <DiaryPage/>
    </main>

    <!-- 配置对话框 -->
    <ConfigDialog 
      v-model="showConfigDialog" 
      @config-changed="handleConfigChanged"
    />

    <!-- 数据管理对话框 -->
    <DataManager 
      v-model="showDataManagerDialog" 
      @data-changed="handleDataChanged"
      @open-smart-sync="showSmartSyncDialog = true"
    />

    <!-- 智能同步对话框 -->
    <SmartSync 
      v-model="showSmartSyncDialog" 
      @data-changed="handleDataChanged"
    />
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
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.header-content h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

.header-button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-color);
  font-size: 14px;
}

.header-button:hover {
  color: #66b1ff;
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
