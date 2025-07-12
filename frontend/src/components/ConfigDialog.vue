<template>
  <el-dialog
    v-model="dialogVisible"
    title="系统配置"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="configForm" :rules="rules" ref="configFormRef" label-width="120px">
      <el-form-item label="后端服务器地址" prop="serverUrl">
        <el-input
          v-model="configForm.serverUrl"
          placeholder="请输入后端服务器地址，例如: http://localhost:8080"
          clearable
        />
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>如果不配置，将使用本地存储模式</span>
        </div>
      </el-form-item>
      
      <el-form-item label="连接测试">
        <el-button type="primary" @click="testConnection" :loading="testing">
          测试连接
        </el-button>
        <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
          <el-icon>
            <CircleCheckFilled v-if="testResult.success" />
            <CircleCloseFilled v-else />
          </el-icon>
          <span>{{ testResult.message }}</span>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'config-changed'])

const dialogVisible = ref(false)
const configFormRef = ref()
const testing = ref(false)
const saving = ref(false)
const testResult = ref(null)

const configForm = reactive({
  serverUrl: ''
})

const rules = {
  serverUrl: [
    { 
      validator: (rule, value, callback) => {
        if (value && !isValidUrl(value)) {
          callback(new Error('请输入有效的URL地址'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 监听modelValue变化
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal) {
    loadConfig()
  }
})

// 监听dialogVisible变化
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 加载配置
function loadConfig() {
  const savedConfig = localStorage.getItem('appConfig')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      configForm.serverUrl = config.serverUrl || ''
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  }
}

// 验证URL格式
function isValidUrl(string) {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (_) {
    return false
  }
}

// 测试连接
async function testConnection() {
  if (!configForm.serverUrl) {
    ElMessage.warning('请先输入服务器地址')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const response = await fetch(`${configForm.serverUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      testResult.value = {
        success: true,
        message: '连接成功！服务器运行正常'
      }
    } else {
      testResult.value = {
        success: false,
        message: `连接失败：HTTP ${response.status}`
      }
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `连接失败：${error.message}`
    }
  } finally {
    testing.value = false
  }
}

// 保存配置
async function handleSave() {
  try {
    await configFormRef.value.validate()
    
    saving.value = true
    
    const config = {
      serverUrl: configForm.serverUrl.trim(),
      updatedAt: new Date().toISOString()
    }

    // 保存到本地存储
    localStorage.setItem('appConfig', JSON.stringify(config))
    
    // 如果配置了服务器地址，尝试保存到后端
    if (config.serverUrl) {
      try {
        await saveConfigToServer(config)
      } catch (error) {
        console.warn('保存配置到服务器失败，仅保存到本地:', error)
      }
    }

    ElMessage.success('配置保存成功！')
    emit('config-changed', config)
    handleClose()
  } catch (error) {
    console.error('保存配置失败:', error)
  } finally {
    saving.value = false
  }
}

// 保存配置到服务器
async function saveConfigToServer(config) {
  const response = await fetch(`${config.serverUrl}/api/config`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config)
  })

  if (!response.ok) {
    throw new Error(`保存到服务器失败: HTTP ${response.status}`)
  }

  return await response.json()
}

// 关闭对话框
function handleClose() {
  dialogVisible.value = false
  testResult.value = null
}
</script>

<style scoped>
.form-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 14px;
}

.test-result.success {
  color: #67c23a;
}

.test-result.error {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 