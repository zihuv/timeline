<template>
  <el-dialog
      v-model="visible"
      title="记录此刻"
      width="70%"
      :fullscreen="isMobile"
      :top="isMobile ? '0vh' : '15vh'"
      @close="handleClose"
      destroy-on-close
  >
    <div class="editor-container">
      <el-input 
        v-model="localValue" 
        type="textarea" 
        :rows="isMobile ? 8 : 5"
        placeholder="写下此刻的想法..."
        resize="none"
        autofocus
        class="diary-textarea"
      />
      
      <!-- 图片上传组件 -->
      <div class="upload-container">
        <el-upload
          v-model:file-list="fileList"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :on-change="handleFileChange"
          :limit="9"
        >
          <el-icon><Plus /></el-icon>
          
          <template #file="{ file }">
            <div>
              <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
              <span class="el-upload-list__item-actions">
                <el-icon class="el-icon--delete" @click.stop="handleRemove(file)">
                  <Delete />
                </el-icon>
              </span>
            </div>
          </template>
        </el-upload>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :size="isMobile ? 'small' : 'default'">取消</el-button>
        <el-button type="primary" @click="handleSave" :size="isMobile ? 'small' : 'default'">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'

const props = defineProps({
  dialogVisible: Boolean,  // 控制弹窗显示/隐藏（v-model）
  content: [String, Object],        // 父组件传入的初始内容或对象
})

const emit = defineEmits(['update:dialogVisible', 'save'])

// 检测移动设备
const isMobile = computed(() => window.innerWidth < 768)

// 本地visible用于控制el-dialog显示
const visible = ref(props.dialogVisible)
// 本地存储编辑内容
const localValue = ref(props.content || '')
// 存储上传的图片
const fileList = ref([])

// 监听父组件dialogVisible变化，同步到本地visible
watch(() => props.dialogVisible, (newVal) => {
  visible.value = newVal
  // 每次打开对话框时重置内容
  if (newVal) {
    if (typeof props.content === 'object' && props.content) {
      localValue.value = props.content.content || ''
      fileList.value = (props.content.images || []).map(img => ({
        url: img.url,
        name: img.name,
        uid: img.url || img.name || Math.random().toString(36).slice(2)
      }))
    } else {
      localValue.value = props.content || ''
      fileList.value = []
    }
    // 自动聚焦输入框
    setTimeout(() => {
      document.querySelector('.editor-container textarea')?.focus()
    }, 300)
  }
})

// 监听本地visible变化，通知父组件更新（实现v-model双向绑定）
watch(visible, (newVal) => {
  emit('update:dialogVisible', newVal)
})

// 监听content变化，更新本地内容
watch(() => props.content, (newVal) => {
  if (typeof newVal === 'object' && newVal) {
    localValue.value = newVal.content || ''
    fileList.value = (newVal.images || []).map(img => ({
      url: img.url,
      name: img.name,
      uid: img.url || img.name || Math.random().toString(36).slice(2)
    }))
  } else {
    localValue.value = newVal || ''
    fileList.value = []
  }
})

// 处理文件变更
const handleFileChange = (uploadFile) => {
  // 将文件转换为base64以便存储
  const reader = new FileReader()
  reader.readAsDataURL(uploadFile.raw)
  reader.onload = () => {
    uploadFile.url = reader.result
  }
}

// 移除文件
const handleRemove = (file) => {
  fileList.value = fileList.value.filter(item => item.uid !== file.uid)
}

// 保存数据
const handleSave = () => {
  if (!localValue.value.trim() && fileList.value.length === 0) {
    // 内容和图片都为空时不保存
    return
  }
  
  // 准备图片数据
  const images = fileList.value.map(file => ({
    url: file.url,
    name: file.name
  }))
  
  // 发送保存事件，包含文本内容和图片
  emit('save', {
    content: localValue.value,
    images: images
  })
  
  visible.value = false
}

// 关闭弹窗
const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.editor-container {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.diary-textarea {
  width: 90%;
  margin: 0 auto;
}

.upload-container {
  margin-top: 1rem;
  width: 90%;
  margin: 0 auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .dialog-footer {
    justify-content: space-between;
    padding: 0 0.5rem;
  }
  
  :deep(.el-dialog__header) {
    padding: 1rem;
    margin-right: 0;
    text-align: center;
    border-bottom: 1px solid var(--border-color);
  }
  
  :deep(.el-dialog__body) {
    padding: 1rem;
  }
  
  :deep(.el-dialog__footer) {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
  }
  
  .diary-textarea,
  .upload-container {
    width: 100%;
  }
}
</style>