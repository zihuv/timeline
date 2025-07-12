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

      <!-- 数据库状态 -->
      <div class="section">
        <h3>数据库状态</h3>
        <p class="section-desc">IndexedDB 数据库状态和健康检查</p>
        
        <div class="db-status">
          <div class="status-item">
            <span class="status-label">存储类型：</span>
            <span class="status-value">{{ storageType }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">数据库状态：</span>
            <span class="status-value" :class="dbHealth.status">{{ dbHealth.status === 'healthy' ? '正常' : '异常' }}</span>
          </div>
        </div>
        
        <el-button 
          type="primary" 
          @click="checkHealth" 
          :loading="checkingHealth"
        >
          <el-icon><Refresh /></el-icon>
          健康检查
        </el-button>
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

      <!-- 数据清理 -->
      <div class="section">
        <h3>数据清理</h3>
        <p class="section-desc">清理本地或服务器数据，请谨慎操作（此操作不可恢复）</p>
        
        <div class="cleanup-options">
          <el-checkbox-group v-model="cleanupOptions">
            <el-checkbox label="local" border>
              <div class="cleanup-option">
                <span>清理本地数据</span>
                <span class="cleanup-desc">删除浏览器本地存储的所有日记数据</span>
              </div>
            </el-checkbox>
            <el-checkbox label="server" border :disabled="!apiService.isServerMode()">
              <div class="cleanup-option">
                <span>清理服务器数据</span>
                <span class="cleanup-desc">删除服务器上的所有日记数据</span>
              </div>
            </el-checkbox>
            <el-checkbox label="all" border :disabled="!apiService.isServerMode()">
              <div class="cleanup-option">
                <span>清理所有数据</span>
                <span class="cleanup-desc">同时清理本地和服务器数据</span>
              </div>
            </el-checkbox>
            <el-checkbox label="complete" border>
              <div class="cleanup-option">
                <span>彻底清理（推荐）</span>
                <span class="cleanup-desc">删除数据库并重新创建，确保完全清理</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        
        <div class="cleanup-actions">
          <el-button 
            type="danger" 
            @click="showCleanupConfirm"
            :loading="cleaning"
            :disabled="cleanupOptions.length === 0"
          >
            <el-icon><Delete /></el-icon>
            清理数据
          </el-button>
          
          <el-button 
            @click="clearCleanupOptions"
            :disabled="cleanupOptions.length === 0"
          >
            清空选择
          </el-button>
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
import { Download, Upload, Delete, Refresh } from '@element-plus/icons-vue'
import apiService from '@/utils/api.js'
import indexedDBService from '@/utils/indexeddb.js'
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

// 数据库状态相关
const checkingHealth = ref(false)
const storageType = ref('IndexedDB')
const dbHealth = reactive({ status: 'unknown' })

// 统计数据
const localStats = reactive({ entries: 0, days: 0 })
const serverStats = reactive({ entries: 0, days: 0 })

// 清理选项
const cleanupOptions = ref([])
const cleaning = ref(false)

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    checkStorageStatus()
    loadStats()
    checkHealth()
  }
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 检查存储状态
function checkStorageStatus() {
  // 检查 IndexedDB 支持
  if (window.indexedDB) {
    storageType.value = 'IndexedDB'
  } else {
    storageType.value = '不支持 IndexedDB'
  }
}

// 加载统计数据
async function loadStats() {
  // 本地统计 - 使用 IndexedDB
  try {
    const stats = await indexedDBService.getStats()
    localStats.entries = stats.totalDiaries
    localStats.days = stats.uniqueDates
  } catch (error) {
    console.error('加载本地统计失败:', error)
    localStats.entries = 0
    localStats.days = 0
  }

  // 服务器统计
  if (apiService.isServerMode()) {
    try {
      const serverData = await apiService.request('/diaries')
      // 确保 serverData 是数组
      if (Array.isArray(serverData)) {
        serverStats.entries = serverData.reduce((total, day) => total + (day.entries?.length || 0), 0)
        serverStats.days = serverData.length
      } else {
        console.warn('服务器返回的数据格式不正确:', serverData)
        serverStats.entries = 0
        serverStats.days = 0
      }
    } catch (error) {
      console.error('加载服务器统计失败:', error)
      // 服务器不可用时，显示为0
      serverStats.entries = 0
      serverStats.days = 0
    }
  }
}

// 导出数据
async function exportData() {
  exporting.value = true
  
  try {
    let data = []
    
    if (exportMode.value === 'local') {
      // 导出本地数据 - 使用 IndexedDB
      const allDiaries = await indexedDBService.getAllDiaries()
      // 转换为原来的格式
      const dateGroups = {}
      allDiaries.forEach(diary => {
        if (!dateGroups[diary.date]) {
          dateGroups[diary.date] = []
        }
        dateGroups[diary.date].push(diary)
      })
      data = Object.keys(dateGroups).map(date => ({
        date,
        entries: dateGroups[date]
      }))
    } else if (exportMode.value === 'server' && apiService.isServerMode()) {
      // 导出服务器数据
      data = await apiService.request('/diaries')
    } else if (exportMode.value === 'all' && apiService.isServerMode()) {
      // 导出所有数据
      const allDiaries = await indexedDBService.getAllDiaries()
      // 转换为原来的格式
      const dateGroups = {}
      allDiaries.forEach(diary => {
        if (!dateGroups[diary.date]) {
          dateGroups[diary.date] = []
        }
        dateGroups[diary.date].push(diary)
      })
      const localData = Object.keys(dateGroups).map(date => ({
        date,
        entries: dateGroups[date]
      }))
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
      // 覆盖模式 - 使用 IndexedDB
      await indexedDBService.clearAll()
      for (const dayDiary of importedData) {
        for (const entry of dayDiary.entries) {
          await indexedDBService.saveDiary(entry)
        }
      }
      ElMessage.success(`成功导入 ${importedData.length} 天的数据到 IndexedDB（覆盖模式）`)
    } else {
      // 合并模式
      const existingData = await indexedDBService.getAllDiaries()
      const existingDateGroups = {}
      existingData.forEach(diary => {
        if (!existingDateGroups[diary.date]) {
          existingDateGroups[diary.date] = []
        }
        existingDateGroups[diary.date].push(diary)
      })
      
      // 合并导入的数据
      for (const dayDiary of importedData) {
        for (const entry of dayDiary.entries) {
          const existingEntries = existingDateGroups[entry.date] || []
          const existingEntry = existingEntries.find(e => e.id === entry.id)
          
          if (existingEntry) {
            // 相同ID，比较时间戳，保留最新的
            const existingTime = new Date(existingEntry.updatedAt || existingEntry.createdAt)
            const importedTime = new Date(entry.updatedAt || entry.createdAt)
            
            if (importedTime > existingTime) {
              // 导入数据更新
              await indexedDBService.updateDiary(entry.id, entry)
            }
          } else {
            // 添加新条目
            await indexedDBService.saveDiary(entry)
          }
        }
      }
      ElMessage.success(`成功导入 ${importedData.length} 天的数据到 IndexedDB（合并模式）`)
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
    
    const successCount = results.filter(r => r.success && !r.skipped).length
    const skipCount = results.filter(r => r.skipped).length
    const failCount = results.filter(r => !r.success).length
    
    let message = ''
    if (successCount > 0) {
      message += `成功同步 ${successCount} 条日记`
    }
    if (skipCount > 0) {
      message += message ? `，跳过 ${skipCount} 条已存在的日记` : `跳过 ${skipCount} 条已存在的日记`
    }
    if (failCount > 0) {
      message += message ? `，${failCount} 条同步失败` : `${failCount} 条同步失败`
    }
    
    if (failCount === 0) {
      ElMessage.success(message || '所有数据已是最新状态')
    } else {
      ElMessage.warning(message)
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

// 显示清理确认对话框
async function showCleanupConfirm() {
  if (cleanupOptions.value.length === 0) {
    ElMessage.warning('请选择要清理的数据')
    return
  }
  
  let message = '确定要清理以下数据吗？\n\n'
  let details = []
  
  if (cleanupOptions.value.includes('local')) {
    details.push(`• 本地数据：${localStats.entries} 条日记，${localStats.days} 天`)
  }
  
  if (cleanupOptions.value.includes('server')) {
    details.push(`• 服务器数据：${serverStats.entries} 条日记，${serverStats.days} 天`)
  }
  
  if (cleanupOptions.value.includes('all')) {
    details.push(`• 所有数据：${localStats.entries + serverStats.entries} 条日记，${localStats.days + serverStats.days} 天`)
  }
  
  if (cleanupOptions.value.includes('complete')) {
    details.push(`• 彻底清理：删除数据库并重新创建`)
  }
  
  message += details.join('\n')
  message += '\n\n⚠️ 此操作不可恢复！'
  
  try {
    await ElMessageBox.confirm(
      message,
      '确认清理数据',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
        customClass: 'cleanup-confirm-dialog'
      }
    )
    
    await performCleanup()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清理确认失败:', error)
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

// 执行清理操作
async function performCleanup() {
  cleaning.value = true
  
  try {
    const results = []
    
    // 清理本地数据
    if (cleanupOptions.value.includes('local') || cleanupOptions.value.includes('all')) {
      try {
        // 清理 IndexedDB
        await indexedDBService.clearAll()
        results.push('IndexedDB 数据已清理')
        
        // 清理 localStorage 残留数据
        localStorage.removeItem('diaries')
        console.log('localStorage 数据已清理')
        
        // 清理 sessionStorage
        sessionStorage.removeItem('diaries')
        console.log('sessionStorage 数据已清理')
        
        // 强制刷新页面缓存
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
            console.log('浏览器缓存已清理')
          } catch (cacheError) {
            console.warn('清理缓存失败:', cacheError)
          }
        }
      } catch (error) {
        console.error('清理本地数据失败:', error)
        results.push('本地数据清理失败: ' + error.message)
      }
    }
    
    // 彻底清理
    if (cleanupOptions.value.includes('complete')) {
      try {
        await indexedDBService.clearAllCompletely()
        results.push('数据库已彻底清理并重新创建')
        
        // 清理所有存储
        localStorage.clear()
        sessionStorage.clear()
        console.log('所有存储已清理')
        
        // 清理缓存
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys()
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            )
            console.log('所有缓存已清理')
          } catch (cacheError) {
            console.warn('清理缓存失败:', cacheError)
          }
        }
      } catch (error) {
        console.error('彻底清理失败:', error)
        results.push('彻底清理失败: ' + error.message)
      }
    }
    
    // 清理服务器数据
    if (cleanupOptions.value.includes('server') || cleanupOptions.value.includes('all')) {
      if (apiService.isServerMode()) {
        try {
          await apiService.request('/diaries/clear', { method: 'DELETE' })
          results.push('服务器数据已清理')
        } catch (error) {
          console.error('清理服务器数据失败:', error)
          results.push('服务器数据清理失败: ' + error.message)
        }
      }
    }
    
    // 显示结果
    if (results.length > 0) {
      ElMessage.success(results.join('，'))
    }
    
    // 重新加载统计
    await loadStats()
    
    // 清空清理选项
    cleanupOptions.value = []
    
    // 通知数据变化
    emit('data-changed')
    
    // 触发全局事件，通知其他组件数据已变化
    window.dispatchEvent(new CustomEvent('diary-data-changed'))
    
  } catch (error) {
    console.error('清理操作失败:', error)
    ElMessage.error('清理失败: ' + error.message)
  } finally {
    cleaning.value = false
  }
}

// 数据库健康检查
async function checkHealth() {
  checkingHealth.value = true
  
  try {
    const health = await indexedDBService.healthCheck()
    dbHealth.status = health.status
    
    if (health.status === 'healthy') {
      ElMessage.success('数据库状态正常')
    } else {
      ElMessage.warning('数据库状态异常: ' + health.error)
    }
  } catch (error) {
    console.error('健康检查失败:', error)
    dbHealth.status = 'unhealthy'
    ElMessage.error('健康检查失败: ' + error.message)
  } finally {
    checkingHealth.value = false
  }
}

// 清空清理选项
function clearCleanupOptions() {
  cleanupOptions.value = []
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
  selectedFile.value = null
  cleanupOptions.value = []
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

.cleanup-options {
  margin-bottom: 1rem;
}

.cleanup-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cleanup-desc {
  font-size: 0.8rem;
  color: #909399;
  margin-top: 0.25rem;
}

.cleanup-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.db-status {
  margin-bottom: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f0f9ff;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.status-label {
  color: #606266;
  font-size: 0.9rem;
}

.status-value {
  font-weight: 600;
  color: #409eff;
}

.status-value.healthy {
  color: #67c23a;
}

.status-value.unhealthy {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .sync-buttons {
    flex-direction: column;
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
  
  .cleanup-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 