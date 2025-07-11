<template>
  <div class="diary-container">
    <!-- 顶部控制区 -->
    <div class="control-panel">
      <el-date-picker v-model="selectedDate" type="date" placeholder="选择日期" @change="handleDateChange"
        class="date-picker" :size="isMobile ? 'small' : 'default'" />
      <el-button type="primary" @click="showDialog = true" :size="isMobile ? 'small' : 'default'" class="add-button">
        <el-icon>
          <Plus />
        </el-icon>
        <span class="button-text">添加</span>
      </el-button>
    </div>

    <!-- 日期显示 -->
    <div class="date-display">
      {{ formattedDate }}
    </div>

    <!-- 时间轴展示 -->
    <div class="timeline-container">
      <el-empty v-if="diaryEntries.length === 0" description="当天没有日记记录" />
      <el-timeline v-else>
        <el-timeline-item 
          v-for="(entry, index) in diaryEntries" 
          :key="index" 
          :timestamp="entry.timestamp"
          :type="getTimelineItemType(index)" 
          :hollow="index % 2 !== 0"
          placement="top"
        >
          <div class="timeline-content">
            <div class="diary-text">{{ entry.content }}</div>

            <!-- 图片展示区 -->
            <div v-if="entry.images && entry.images.length > 0" class="image-gallery">
              <el-image 
                v-for="(img, imgIndex) in entry.images" 
                :key="imgIndex" 
                :src="img.url" 
                fit="cover"
                :preview-src-list="entry.images.map(img => img.url)" 
                :initial-index="imgIndex"
                :preview-teleported="true" 
                :preview-options="{ closeOnPressEscape: true, zIndex: 3000 }"
                class="diary-image" 
              />
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 日记编辑器 -->
    <DiaryEditor v-model:dialogVisible="showDialog" :content="editContent" @save="handleSave" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import DiaryEditor from "@/components/DiaryEditor.vue"

// 响应式设计 - 检测移动设备
const isMobile = ref(window.innerWidth < 768)
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 当前选中的日期
const selectedDate = ref(new Date())

// 格式化显示日期
const formattedDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return selectedDate.value.toLocaleDateString('zh-CN', options)
})

// 所有日记数据 - 实际应用中可能从localStorage或API获取
const allDiaries = ref([
  {
    date: '2023-11-01',
    entries: [
      {
        content: '早上起床，开始新的一天',
        timestamp: '08:00',
        images: []
      },
      {
        content: '吃早餐，准备出门',
        timestamp: '08:30',
        images: []
      },
      {
        content: '开始工作，处理邮件',
        timestamp: '09:00',
        images: []
      },
    ]
  },
  {
    date: '2023-11-02',
    entries: [
      {
        content: '参加项目会议，讨论新功能',
        timestamp: '10:00',
        images: []
      },
      {
        content: '和同事共进午餐',
        timestamp: '12:00',
        images: []
      },
    ]
  }
])

// 根据选中日期过滤显示的日记
const diaryEntries = computed(() => {
  const dateStr = formatDate(selectedDate.value)
  const dayDiary = allDiaries.value.find(d => d.date === dateStr)
  return dayDiary ? dayDiary.entries : []
})

// 格式化日期为YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 为时间轴项目设置不同的类型，增加视觉多样性
function getTimelineItemType(index) {
  const types = ['primary', 'success', 'info', 'warning']
  return types[index % types.length]
}

// 编辑相关
const showDialog = ref(false)
const editContent = ref('')

// 日期变更处理
// 在script部分添加以下代码，替换原有的本地存储逻辑

// API基础URL
const API_BASE_URL = 'http://localhost:8080/api';

// 加载指定日期的日记
async function loadDiariesByDate(date) {
  try {
    const dateStr = formatDate(date);
    const response = await fetch(`${API_BASE_URL}/diaries/date?date=${dateStr}`);
    if (!response.ok) throw new Error('加载日记失败');
    return await response.json();
  } catch (error) {
    console.error('加载日记失败:', error);
    ElMessage.error('加载日记失败');
    return [];
  }
}

// 保存日记到服务器
async function saveDiaryToServer(diary) {
  try {
    const response = await fetch(`${API_BASE_URL}/diaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(diary),
    });
    
    if (!response.ok) throw new Error('保存日记失败');
    return await response.json();
  } catch (error) {
    console.error('保存日记失败:', error);
    ElMessage.error('保存日记失败');
    return null;
  }
}

// 修改handleDateChange函数
const handleDateChange = async () => {
  const entries = await loadDiariesByDate(selectedDate.value);
  // 更新当前显示的日记
  const dateStr = formatDate(selectedDate.value);
  const dayIndex = allDiaries.value.findIndex(d => d.date === dateStr);
  
  if (dayIndex >= 0) {
    allDiaries.value[dayIndex].entries = entries;
  } else if (entries.length > 0) {
    allDiaries.value.push({
      date: dateStr,
      entries: entries
    });
  }
};

// 修改handleSave函数
const handleSave = async (data) => {
  const dateStr = formatDate(selectedDate.value);
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // 准备新的日记条目
  const newEntry = {
    content: typeof data === 'string' ? data : data.content || '',
    timestamp,
    date: dateStr,
    images: typeof data === 'object' && data.images ? data.images : []
  };

  // 保存到服务器
  const savedEntry = await saveDiaryToServer(newEntry);
  if (savedEntry) {
    // 更新本地数据
    const dayIndex = allDiaries.value.findIndex(d => d.date === dateStr);

    if (dayIndex >= 0) {
      // 已有当天记录，添加新条目
      allDiaries.value[dayIndex].entries.push(savedEntry);
    } else {
      // 创建新的一天记录
      allDiaries.value.push({
        date: dateStr,
        entries: [savedEntry]
      });
    }

    ElMessage.success('保存成功！');
  }
};

// 修改onMounted钩子，从服务器加载数据
onMounted(async () => {
  // 加载当前日期的日记
  await handleDateChange();
});

// 移除watch(allDiaries, saveDiariesToStorage)，因为不再需要保存到本地存储
// 保存数据到本地存储
function saveDiariesToStorage() {
  localStorage.setItem('diaries', JSON.stringify(allDiaries.value))
}

// 监听数据变化，保存到本地存储
watch(allDiaries, () => {
  saveDiariesToStorage()
}, { deep: true })
</script>

<style scoped>
.diary-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  height: 100%;
}

.control-panel {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.date-picker {
  flex: 1;
}

.date-display {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
  text-align: center;
}

.timeline-container {
  margin-top: 1.5rem;
}

.timeline-content {
  background-color: var(--bg-color);
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border: 1px solid #ebeef5;
}

/* 自定义时间轴样式 */
:deep(.el-timeline-item__timestamp) {
  font-size: 0.85rem;
  color: #606266;
  font-weight: 500;
}

:deep(.el-timeline-item__node) {
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #dcdfe6;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 28px;
}

.diary-text {
  margin-bottom: 0.75rem;
  white-space: pre-wrap;
}

.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.diary-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.diary-image:hover {
  transform: scale(1.05);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .diary-container {
    padding: 1rem;
    border-radius: 0;
    box-shadow: none;
  }

  .control-panel {
    flex-direction: column;
    gap: 0.75rem;
  }

  .date-picker {
    width: 100%;
  }

  .add-button {
    width: 100%;
  }

  .date-display {
    font-size: 1rem;
    margin: 0.75rem 0;
  }

  .diary-image {
    width: 60px;
    height: 60px;
  }
}
</style>