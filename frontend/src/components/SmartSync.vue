<template>
  <el-dialog
    v-model="dialogVisible"
    title="智能数据同步"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="smart-sync">
      <!-- 数据状态分析 -->
      <div class="status-analysis">
        <h3>数据状态分析</h3>
        <div class="status-grid">
          <div class="status-item" :class="{ active: localStats.entries > 0 }">
            <el-icon><Monitor /></el-icon>
            <div class="status-content">
              <div class="status-title">本地数据</div>
              <div class="status-details">
                {{ localStats.entries }} 条日记，{{ localStats.days }} 天
              </div>
            </div>
          </div>
          
          <div class="status-item" :class="{ active: serverStats.entries > 0 }">
            <el-icon><Document /></el-icon>
            <div class="status-content">
              <div class="status-title">云端数据</div>
              <div class="status-details">
                {{ serverStats.entries }} 条日记，{{ serverStats.days }} 天
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 同步策略 -->
      <div class="sync-strategy">
        <h3>推荐同步策略</h3>
        <div class="strategy-card" :class="strategyType">
          <div class="strategy-icon">
            <el-icon v-if="strategyType === 'download'"><Download /></el-icon>
            <el-icon v-else-if="strategyType === 'upload'"><Upload /></el-icon>
            <el-icon v-else-if="strategyType === 'merge'"><Refresh /></el-icon>
            <el-icon v-else><InfoFilled /></el-icon>
          </div>
          <div class="strategy-content">
            <div class="strategy-title">{{ strategyTitle }}</div>
            <div class="strategy-description">{{ strategyDescription }}</div>
            <div class="strategy-details">
              <div v-for="(detail, index) in strategyDetails" :key="index" class="detail-item">
                <el-icon><Check /></el-icon>
                <span>{{ detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="sync-actions">
        <el-button 
          type="primary" 
          size="large"
          @click="executeSync" 
          :loading="syncing"
          :disabled="!canSync"
        >
          <el-icon><Refresh /></el-icon>
          {{ syncButtonText }}
        </el-button>
        
        <el-button 
          @click="showManualOptions = true"
          :disabled="syncing"
        >
          <el-icon><Setting /></el-icon>
          手动选择同步方式
        </el-button>
      </div>

      <!-- 同步进度 -->
      <div v-if="syncing" class="sync-progress">
        <el-progress 
          :percentage="syncProgress" 
          :status="syncProgressStatus"
          :stroke-width="8"
        />
        <div class="progress-text">{{ progressText }}</div>
      </div>

      <!-- 同步结果 -->
      <div v-if="syncResult" class="sync-result" :class="syncResult.success ? 'success' : 'error'">
        <el-icon>
          <CircleCheckFilled v-if="syncResult.success" />
          <CircleCloseFilled v-else />
        </el-icon>
        <div class="result-content">
          <div class="result-title">{{ syncResult.title }}</div>
          <div class="result-message">{{ syncResult.message }}</div>
          <div v-if="syncResult.details" class="result-details">
            {{ syncResult.details }}
          </div>
        </div>
      </div>
    </div>

    <!-- 手动同步选项对话框 -->
    <el-dialog
      v-model="showManualOptions"
      title="手动同步选项"
      width="500px"
      append-to-body
    >
      <div class="manual-options">
        <div class="option-group">
          <h4>同步方向</h4>
          <el-radio-group v-model="manualSyncMode">
            <el-radio label="download">从云端下载到本地</el-radio>
            <el-radio label="upload">从本地上传到云端</el-radio>
            <el-radio label="merge">智能合并（推荐）</el-radio>
          </el-radio-group>
        </div>
        
        <div class="option-group">
          <h4>合并策略</h4>
          <el-radio-group v-model="mergeStrategy" :disabled="manualSyncMode !== 'merge'">
            <el-radio label="time">按时间戳合并（保留最新）</el-radio>
            <el-radio label="local">优先保留本地数据</el-radio>
            <el-radio label="server">优先保留云端数据</el-radio>
          </el-radio-group>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showManualOptions = false">取消</el-button>
          <el-button type="primary" @click="executeManualSync" :loading="syncing">
            执行同步
          </el-button>
        </div>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button v-if="syncResult && syncResult.success" type="success" @click="refreshData">
          刷新数据
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Monitor, Document, Download, Upload, Refresh, InfoFilled, 
  Check, CircleCheckFilled, CircleCloseFilled, Setting 
} from '@element-plus/icons-vue'
import apiService from '@/utils/api.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'data-changed'])

const dialogVisible = ref(false)
const showManualOptions = ref(false)
const syncing = ref(false)
const syncProgress = ref(0)
const syncProgressStatus = ref('')
const progressText = ref('')
const syncResult = ref(null)

// 手动同步选项
const manualSyncMode = ref('merge')
const mergeStrategy = ref('time')

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
  if (!newVal) {
    resetState()
  }
})

// 计算同步策略
const strategyType = computed(() => {
  if (!apiService.isServerMode()) return 'none'
  if (localStats.entries === 0 && serverStats.entries > 0) return 'download'
  if (localStats.entries > 0 && serverStats.entries === 0) return 'upload'
  if (localStats.entries > 0 && serverStats.entries > 0) return 'merge'
  return 'none'
})

const strategyTitle = computed(() => {
  switch (strategyType.value) {
    case 'download': return '从云端下载数据'
    case 'upload': return '上传本地数据到云端'
    case 'merge': return '智能合并数据'
    default: return '无需同步'
  }
})

const strategyDescription = computed(() => {
  switch (strategyType.value) {
    case 'download': return '检测到云端有数据但本地为空，建议从云端下载数据到本地'
    case 'upload': return '检测到本地有数据但云端为空，建议将本地数据上传到云端'
    case 'merge': return '检测到本地和云端都有数据，建议进行智能合并'
    default: return '本地和云端都没有数据，无需同步'
  }
})

const strategyDetails = computed(() => {
  switch (strategyType.value) {
    case 'download':
      return [
        '将云端所有数据下载到本地',
        '保留云端数据的完整性',
        '适合新设备或数据恢复'
      ]
    case 'upload':
      return [
        '将本地所有数据上传到云端',
        '在云端创建数据备份',
        '适合首次使用云端存储'
      ]
    case 'merge':
      return [
        '按时间戳智能合并数据',
        '保留最新的数据版本',
        '避免数据冲突和重复'
      ]
    default:
      return ['当前无需进行数据同步']
  }
})

const syncButtonText = computed(() => {
  if (syncing.value) return '同步中...'
  switch (strategyType.value) {
    case 'download': return '下载云端数据'
    case 'upload': return '上传本地数据'
    case 'merge': return '智能合并数据'
    default: return '无需同步'
  }
})

const canSync = computed(() => {
  return strategyType.value !== 'none' && apiService.isServerMode()
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

// 执行智能同步
async function executeSync() {
  if (!canSync.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要执行"${strategyTitle.value}"吗？`,
      '确认同步',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    syncing.value = true
    syncProgress.value = 0
    syncProgressStatus.value = ''
    progressText.value = '准备同步...'
    syncResult.value = null
    
    switch (strategyType.value) {
      case 'download':
        await downloadFromServer()
        break
      case 'upload':
        await uploadToServer()
        break
      case 'merge':
        await mergeData()
        break
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('同步失败:', error)
      ElMessage.error('同步失败: ' + error.message)
    }
  } finally {
    syncing.value = false
  }
}

// 从服务器下载数据
async function downloadFromServer() {
  try {
    progressText.value = '正在从云端下载数据...'
    syncProgress.value = 30
    
    const serverData = await apiService.request('/diaries')
    syncProgress.value = 60
    
    progressText.value = '正在保存到本地...'
    localStorage.setItem('diaries', JSON.stringify(serverData))
    syncProgress.value = 100
    
    syncProgressStatus.value = 'success'
    progressText.value = '下载完成'
    
    syncResult.value = {
      success: true,
      title: '下载成功',
      message: `成功从云端下载 ${serverStats.entries} 条日记数据`,
      details: `共 ${serverStats.days} 天的数据已保存到本地`
    }
    
    await loadStats()
    emit('data-changed')
    window.dispatchEvent(new CustomEvent('diary-data-changed'))
    
  } catch (error) {
    syncProgressStatus.value = 'exception'
    progressText.value = '下载失败'
    throw error
  }
}

// 上传数据到服务器
async function uploadToServer() {
  try {
    progressText.value = '正在准备本地数据...'
    syncProgress.value = 20
    
    const localData = JSON.parse(localStorage.getItem('diaries') || '[]')
    syncProgress.value = 40
    
    progressText.value = '正在上传到云端...'
    const results = await apiService.syncToServer()
    syncProgress.value = 80
    
    progressText.value = '正在验证上传结果...'
    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount
    syncProgress.value = 100
    
    syncProgressStatus.value = successCount === results.length ? 'success' : 'warning'
    progressText.value = '上传完成'
    
    syncResult.value = {
      success: true,
      title: '上传完成',
      message: `成功上传 ${successCount} 条日记到云端`,
      details: failCount > 0 ? `有 ${failCount} 条数据上传失败` : '所有数据上传成功'
    }
    
    await loadStats()
    emit('data-changed')
    window.dispatchEvent(new CustomEvent('diary-data-changed'))
    
  } catch (error) {
    syncProgressStatus.value = 'exception'
    progressText.value = '上传失败'
    throw error
  }
}

// 智能合并数据
async function mergeData() {
  try {
    progressText.value = '正在分析数据差异...'
    syncProgress.value = 20
    
    const localData = JSON.parse(localStorage.getItem('diaries') || '[]')
    const serverData = await apiService.request('/diaries')
    syncProgress.value = 40
    
    progressText.value = '正在智能合并数据...'
    const mergedData = mergeDataById(localData, serverData)
    syncProgress.value = 60
    
    progressText.value = '正在保存合并结果...'
    localStorage.setItem('diaries', JSON.stringify(mergedData))
    syncProgress.value = 80
    
    progressText.value = '正在同步到云端...'
    await apiService.syncToServer()
    syncProgress.value = 100
    
    syncProgressStatus.value = 'success'
    progressText.value = '合并完成'
    
    const totalEntries = mergedData.reduce((total, day) => total + day.entries.length, 0)
    const totalDays = mergedData.length
    
    syncResult.value = {
      success: true,
      title: '合并成功',
      message: `成功合并本地和云端数据`,
      details: `合并后共有 ${totalEntries} 条日记，${totalDays} 天的数据`
    }
    
    await loadStats()
    emit('data-changed')
    window.dispatchEvent(new CustomEvent('diary-data-changed'))
    
  } catch (error) {
    syncProgressStatus.value = 'exception'
    progressText.value = '合并失败'
    throw error
  }
}

// 按ID合并数据
function mergeDataById(localData, serverData) {
  const mergedMap = new Map()
  
  // 处理本地数据
  localData.forEach(day => {
    mergedMap.set(day.date, {
      date: day.date,
      entries: [...day.entries]
    })
  })
  
  // 处理服务器数据，按ID合并
  serverData.forEach(day => {
    if (mergedMap.has(day.date)) {
      // 同一天，需要合并条目
      const existingDay = mergedMap.get(day.date)
      const existingEntries = existingDay.entries
      
      day.entries.forEach(serverEntry => {
        const existingIndex = existingEntries.findIndex(
          localEntry => localEntry.id === serverEntry.id
        )
        
        if (existingIndex >= 0) {
          // 相同ID，比较时间戳，保留最新的
          const localEntry = existingEntries[existingIndex]
          const localTime = new Date(localEntry.updatedAt || localEntry.createdAt)
          const serverTime = new Date(serverEntry.updatedAt || serverEntry.createdAt)
          
          if (serverTime > localTime) {
            // 服务器数据更新
            existingEntries[existingIndex] = serverEntry
          }
          // 如果本地数据更新，保持不变
        } else {
          // 新条目，直接添加
          existingEntries.push(serverEntry)
        }
      })
    } else {
      // 新的一天，直接添加
      mergedMap.set(day.date, {
        date: day.date,
        entries: [...day.entries]
      })
    }
  })
  
  // 转换为数组并按日期排序
  return Array.from(mergedMap.values()).sort((a, b) => b.date.localeCompare(a.date))
}

// 执行手动同步
async function executeManualSync() {
  showManualOptions.value = false
  
  try {
    await ElMessageBox.confirm(
      `确定要执行手动同步吗？`,
      '确认同步',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    syncing.value = true
    syncProgress.value = 0
    syncProgressStatus.value = ''
    progressText.value = '准备同步...'
    syncResult.value = null
    
    switch (manualSyncMode.value) {
      case 'download':
        await downloadFromServer()
        break
      case 'upload':
        await uploadToServer()
        break
      case 'merge':
        await mergeData()
        break
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('手动同步失败:', error)
      ElMessage.error('同步失败: ' + error.message)
    }
  } finally {
    syncing.value = false
  }
}

// 刷新数据
function refreshData() {
  loadStats()
  emit('data-changed')
  window.dispatchEvent(new CustomEvent('diary-data-changed'))
}

// 重置状态
function resetState() {
  syncProgress.value = 0
  syncProgressStatus.value = ''
  progressText.value = ''
  syncResult.value = null
  showManualOptions.value = false
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
}
</script>

<style scoped>
.smart-sync {
  max-height: 70vh;
  overflow-y: auto;
}

.status-analysis {
  margin-bottom: 2rem;
}

.status-analysis h3 {
  margin: 0 0 1rem 0;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  background-color: #fafafa;
  transition: all 0.3s;
}

.status-item.active {
  border-color: var(--primary-color);
  background-color: #f0f9ff;
}

.status-item .el-icon {
  font-size: 2rem;
  color: #c0c4cc;
}

.status-item.active .el-icon {
  color: var(--primary-color);
}

.status-content {
  flex: 1;
}

.status-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.25rem;
}

.status-details {
  font-size: 0.9rem;
  color: #606266;
}

.sync-strategy {
  margin-bottom: 2rem;
}

.sync-strategy h3 {
  margin: 0 0 1rem 0;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.strategy-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: #f5f7fa;
  border-left: 4px solid #c0c4cc;
}

.strategy-card.download {
  background-color: #f0f9ff;
  border-left-color: #409eff;
}

.strategy-card.upload {
  background-color: #f0f9ff;
  border-left-color: #67c23a;
}

.strategy-card.merge {
  background-color: #f0f9ff;
  border-left-color: #e6a23c;
}

.strategy-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.strategy-icon .el-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.strategy-content {
  flex: 1;
}

.strategy-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.strategy-description {
  color: #606266;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.strategy-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #606266;
}

.detail-item .el-icon {
  color: #67c23a;
  font-size: 0.8rem;
}

.sync-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.sync-progress {
  margin-bottom: 1.5rem;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  color: #606266;
  font-size: 0.9rem;
}

.sync-result {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.sync-result.success {
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
}

.sync-result.error {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
}

.sync-result .el-icon {
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.sync-result.success .el-icon {
  color: #67c23a;
}

.sync-result.error .el-icon {
  color: #f56c6c;
}

.result-content {
  flex: 1;
}

.result-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.result-message {
  color: #606266;
  margin-bottom: 0.5rem;
}

.result-details {
  font-size: 0.9rem;
  color: #909399;
}

.manual-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-group h4 {
  margin: 0 0 0.75rem 0;
  color: #303133;
  font-size: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .sync-actions {
    flex-direction: column;
  }
  
  .strategy-card {
    flex-direction: column;
    text-align: center;
  }
}
</style> 