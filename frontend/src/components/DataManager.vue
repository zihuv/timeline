<template>
  <el-dialog
    v-model="dialogVisible"
    title="数据管理"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="data-manager">
      <!-- 数据导出 -->
      <div class="section">
        <h3>数据导出</h3>
        <p class="section-desc">将当前数据导出为JSON文件，用于备份或迁移</p>
        
        <div class="export-options">
          <el-radio-group v-model="exportMode">
            <el-radio label="local">仅导出本地数据</el-radio>
            <el-radio label="server" :disabled="!apiService.isServerMode()">仅导出服务器数据</el-radio>
            <el-radio label="all" :disabled="!apiService.isServerMode()">导出所有数据（本地+服务器）</el-radio>
          </el-radio-group>
        </div>
        
        <el-button 
          type="primary" 
          @click="exportData" 
          :loading="exporting"
          :disabled="exportMode === 'server' && !apiService.isServerMode()"
        >
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>

      <!-- 数据导入 -->
      <div class="section">
        <h3>数据导入</h3>
        <p class="section-desc">从JSON文件导入数据，支持覆盖或合并模式</p>
        
        <div class="import-options">
          <el-radio-group v-model="importMode">
            <el-radio label="merge">合并模式（保留现有数据）</el-radio>
            <el-radio label="overwrite">覆盖模式（替换所有数据）</el-radio>
          </el-radio-group>
        </div>
        
        <div class="file-upload">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept=".json"
            class="upload-area"
          >
            <div class="upload-content">
              <el-icon class="upload-icon"><Upload /></el-icon>
              <div class="upload-text">
                <span>点击选择文件或拖拽文件到此处</span>
                <span class="upload-hint">支持 .json 格式</span>
              </div>
            </div>
          </el-upload>
        </div>
        
        <el-button 
          type="success" 
          @click="importData" 
          :loading="importing"
          :disabled="!selectedFile"
        >
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
      </div>

      <!-- 数据同步 -->
      <div v-if="apiService.isServerMode()" class="section">
        <h3>数据同步</h3>
        <p class="section-desc">在本地存储和服务器之间同步数据</p>
        
        <div class="sync-buttons">
          <el-button 
            type="primary" 
            @click="emit('open-smart-sync')"
            class="smart-sync-btn"
          >
            <el-icon><Refresh /></el-icon>
            智能同步
            <span class="btn-hint">推荐</span>
          </el-button>
          
          <el-button 
            type="warning" 
            @click="syncToServer" 
            :loading="syncingToServer"
          >
            <el-icon><Upload /></el-icon>
            同步到服务器
          </el-button>
          
          <el-button 
            type="info" 
            @click="syncFromServer" 
            :loading="syncingFromServer"
          >
            <el-icon><Download /></el-icon>
            从服务器同步
          </el-button>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="section">
        <h3>数据统计</h3>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">本地日记数：</span>
            <span class="stat-value">{{ localStats.entries }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">本地天数：</span>
            <span class="stat-value">{{ localStats.days }}</span>
          </div>
          <div v-if="apiService.isServerMode()" class="stat-item">
            <span class="stat-label">服务器日记数：</span>
            <span class="stat-value">{{ serverStats.entries }}</span>
          </div>
          <div v-if="apiService.isServerMode()" class="stat-item">
            <span class="stat-label">服务器天数：</span>
            <span class="stat-value">{{ serverStats.days }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import apiService from '@/utils/api.js'
import { generateId } from '@/utils/snowflake.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'data-changed', 'open-smart-sync'])

const dialogVisible = ref(false)
const uploadRef = ref()
const selectedFile = ref(null)

// 导出相关
const exportMode = ref('local')
const exporting = ref(false)

// 导入相关
const importMode = ref('merge')
const importing = ref(false)

// 同步相关
const syncingToServer = ref(false)
const syncingFromServer = ref(false)

// 统计数据
const localStats = reactive({ entries: 0, days: 0 })
const serverStats = reactive({ entries: 0, days: 0 })

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    loadStats()
  }
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 加载统计数据
async function loadStats() {
  // 本地统计
  try {
    const localData = JSON.parse(localStorage.getItem('diaries') || '[]')
    localStats.entries = localData.reduce((total, day) => total + day.entries.length, 0)
    localStats.days = localData.length
  } catch (error) {
    console.error('加载本地统计失败:', error)
  }

  // 服务器统计
  if (apiService.isServerMode()) {
    try {
      const serverData = await apiService.request('/diaries')
      serverStats.entries = serverData.reduce((total, day) => total + day.entries.length, 0)
      serverStats.days = serverData.length
    } catch (error) {
      console.error('加载服务器统计失败:', error)
    }
  }
}

// 导出数据
async function exportData() {
  exporting.value = true
  
  try {
    let data = []
    
    if (exportMode.value === 'local') {
      // 导出本地数据
      data = JSON.parse(localStorage.getItem('diaries') || '[]')
    } else if (exportMode.value === 'server' && apiService.isServerMode()) {
      // 导出服务器数据
      data = await apiService.request('/diaries')
    } else if (exportMode.value === 'all' && apiService.isServerMode()) {
      // 导出所有数据
      const localData = JSON.parse(localStorage.getItem('diaries') || '[]')
      const serverData = await apiService.request('/diaries')
      
      // 合并数据，按ID去重
      const mergedData = [...localData]
      serverData.forEach(serverDay => {
        const existingIndex = mergedData.findIndex(localDay => localDay.date === serverDay.date)
        if (existingIndex >= 0) {
          // 合并同一天的日记
          const existingEntries = mergedData[existingIndex].entries
          serverDay.entries.forEach(serverEntry => {
            const existingEntryIndex = existingEntries.findIndex(
              localEntry => localEntry.id === serverEntry.id
            )
            if (existingEntryIndex >= 0) {
              // 相同ID，比较时间戳，保留最新的
              const localEntry = existingEntries[existingEntryIndex]
              const localTime = new Date(localEntry.updatedAt || localEntry.createdAt)
              const serverTime = new Date(serverEntry.updatedAt || serverEntry.createdAt)
              
              if (serverTime > localTime) {
                // 服务器数据更新
                existingEntries[existingEntryIndex] = serverEntry
              }
              // 如果本地数据更新，保持不变
            } else {
              // 添加新条目
              existingEntries.push(serverEntry)
            }
          })
        } else {
          // 添加新的一天
          mergedData.push(serverDay)
        }
      })
      
      data = mergedData
    }
    
    // 创建导出文件
    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      exportMode: exportMode.value,
      data: data
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diary-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${data.length} 天的数据`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  } finally {
    exporting.value = false
  }
}

// 处理文件选择
function handleFileChange(file) {
  selectedFile.value = file.raw
}

// 导入数据
async function importData() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  importing.value = true
  
  try {
    const text = await selectedFile.value.text()
    const importData = JSON.parse(text)
    
    if (!importData.data || !Array.isArray(importData.data)) {
      throw new Error('文件格式不正确')
    }
    
    const importedData = importData.data
    
    if (importMode.value === 'overwrite') {
      // 覆盖模式
      localStorage.setItem('diaries', JSON.stringify(importedData))
      ElMessage.success(`成功导入 ${importedData.length} 天的数据（覆盖模式）`)
    } else {
      // 合并模式
      const existingData = JSON.parse(localStorage.getItem('diaries') || '[]')
      const mergedData = [...existingData]
      
      importedData.forEach(importedDay => {
        const existingIndex = mergedData.findIndex(existingDay => existingDay.date === importedDay.date)
        if (existingIndex >= 0) {
          // 合并同一天的日记
          const existingEntries = mergedData[existingIndex].entries
          importedDay.entries.forEach(importedEntry => {
            const existingEntryIndex = existingEntries.findIndex(
              existingEntry => existingEntry.id === importedEntry.id
            )
            if (existingEntryIndex >= 0) {
              // 相同ID，比较时间戳，保留最新的
              const localEntry = existingEntries[existingEntryIndex]
              const localTime = new Date(localEntry.updatedAt || localEntry.createdAt)
              const importedTime = new Date(importedEntry.updatedAt || importedEntry.createdAt)
              
              if (importedTime > localTime) {
                // 导入数据更新
                existingEntries[existingEntryIndex] = importedEntry
              }
              // 如果本地数据更新，保持不变
            } else {
              // 添加新条目
              existingEntries.push(importedEntry)
            }
          })
        } else {
          // 添加新的一天
          mergedData.push(importedDay)
        }
      })
      
      localStorage.setItem('diaries', JSON.stringify(mergedData))
      ElMessage.success(`成功导入 ${importedData.length} 天的数据（合并模式）`)
    }
    
    // 清空文件选择
    selectedFile.value = null
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    
    // 重新加载统计
    await loadStats()
    
    // 通知数据变化
    emit('data-changed')
    
    // 触发全局事件，通知其他组件数据已变化
    window.dispatchEvent(new CustomEvent('diary-data-changed'))
    
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importing.value = false
  }
}

// 同步到服务器
async function syncToServer() {
  try {
    await ElMessageBox.confirm(
      '确定要将本地数据同步到服务器吗？这将覆盖服务器上的数据。',
      '确认同步',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    syncingToServer.value = true
    const results = await apiService.syncToServer()
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount
    
    if (failCount === 0) {
      ElMessage.success(`成功同步 ${successCount} 条日记到服务器`)
    } else {
      ElMessage.warning(`同步完成：成功 ${successCount} 条，失败 ${failCount} 条`)
    }
    
    await loadStats()
    emit('data-changed')
    
    // 触发全局事件，通知其他组件数据已变化
    window.dispatchEvent(new CustomEvent('diary-data-changed'))
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('同步到服务器失败:', error)
      ElMessage.error('同步失败: ' + error.message)
    }
  } finally {
    syncingToServer.value = false
  }
}

// 从服务器同步
async function syncFromServer() {
  try {
    await ElMessageBox.confirm(
      '确定要从服务器同步数据到本地吗？这将覆盖本地数据。',
      '确认同步',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    syncingFromServer.value = true
    await apiService.syncFromServer()
    
    ElMessage.success('成功从服务器同步数据')
    
    await loadStats()
    emit('data-changed')
    
    // 触发全局事件，通知其他组件数据已变化
    window.dispatchEvent(new CustomEvent('diary-data-changed'))
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('从服务器同步失败:', error)
      ElMessage.error('同步失败: ' + error.message)
    }
  } finally {
    syncingFromServer.value = false
  }
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
  selectedFile.value = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}
</script>

<style scoped>
.data-manager {
  max-height: 70vh;
  overflow-y: auto;
}

.section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #ebeef5;
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section h3 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.section-desc {
  margin: 0 0 1rem 0;
  color: #606266;
  font-size: 0.9rem;
}

.export-options,
.import-options {
  margin-bottom: 1rem;
}

.file-upload {
  margin-bottom: 1rem;
}

.upload-area {
  width: 100%;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  background-color: #fafafa;
  transition: border-color 0.3s;
}

.upload-content:hover {
  border-color: var(--primary-color);
}

.upload-icon {
  font-size: 2rem;
  color: #c0c4cc;
  margin-bottom: 0.5rem;
}

.upload-text {
  text-align: center;
  color: #606266;
}

.upload-hint {
  display: block;
  font-size: 0.8rem;
  color: #909399;
  margin-top: 0.25rem;
}

.sync-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.smart-sync-btn {
  position: relative;
}

.btn-hint {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #f56c6c;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  line-height: 1;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  color: #606266;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: var(--primary-color);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .sync-buttons {
    flex-direction: column;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
}
</style> 