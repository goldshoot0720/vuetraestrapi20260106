<template>
  <section class="page">
    <div class="header">
      <div class="badge">🍎</div>
      <h2>食品管理系統</h2>
      <div class="actions">
        <span v-if="isImporting" class="status-text">{{ importProgress }}</span>
        <input type="file" ref="fileInput" accept=".csv" style="display: none" @change="handleFileUpload" />
        <button class="btn" @click="triggerFileInput" :disabled="isImporting">匯入 CSV</button>
        <button class="btn" @click="downloadCSV">匯出 CSV</button>
        <button class="btn" @click="fetchData">重新載入</button>
        <button class="btn primary" @click="openModal(null)">新增食品</button>
      </div>
    </div>
    <div class="toolbar">
      <input class="search" placeholder="搜尋食品名稱或商店..." />
      <button class="btn">🔍 搜尋</button>
    </div>
    <div class="cards">
      <div class="card" v-for="item in foods" :key="item.id">
        <div class="thumb food" :style="getPhotoUrl(item) ? { backgroundImage: `url(${getPhotoUrl(item)})` } : {}"></div>
        <div class="meta">
          <div class="name">{{ item.name || '未命名' }}</div>
          <div class="info">
            <span v-if="item.shop" class="shop-tag">🏠 {{ item.shop }}</span>
            <div class="details">
              <span>數量：{{ item.amount || 0 }}</span>
              <span>價格：${{ (item.price || 0).toLocaleString() }}</span>
            </div>
            <div class="expiry" :class="{ expired: isExpired(item.todate), warning: isExpiringSoon(item.todate) }">
              📅 {{ item.todate ? new Date(item.todate).toLocaleDateString() : '未設定' }}
              <span v-if="item.todate">({{ getDaysRemaining(item.todate) }})</span>
            </div>
          </div>
          <div class="ops">
            <button class="btn" @click="openModal(item)">編輯</button>
            <button class="btn danger" @click="deleteFood(item)">刪除</button>
          </div>
        </div>
      </div>
      <div v-if="foods.length === 0" class="no-data">
        暫無資料或載入中...
      </div>
    </div>

    <!-- 編輯/新增 Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h3>{{ editingItem ? '編輯食品' : '新增食品' }}</h3>
        <div class="form-group">
          <label>名稱</label>
          <input v-model="formData.name" placeholder="請輸入食品名稱" />
        </div>
        <div class="form-group">
          <label>數量</label>
          <input type="number" v-model.number="formData.amount" placeholder="請輸入數量" />
        </div>
        <div class="form-group">
          <label>價格</label>
          <input type="number" v-model.number="formData.price" placeholder="請輸入價格" />
        </div>
        <div class="form-group">
          <label>商店</label>
          <input v-model="formData.shop" placeholder="購買商店" />
        </div>
        <div class="form-group">
          <label>到期日</label>
          <input type="date" v-model="formData.todate" />
        </div>
        <div class="form-group">
          <label>圖片</label>
          <div v-if="previewImageUrl" class="image-preview" :style="{ backgroundImage: `url(${previewImageUrl})` }"></div>
          <div style="display: flex; gap: 8px; flex-direction: column;">
            <input type="file" @change="handleFileChange" accept="image/*" />
            <input v-model="formData.photo" placeholder="或輸入圖片連結 (https://...)" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="closeModal">取消</button>
          <button class="btn primary" @click="saveFood">儲存</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { strapi, getApiUrl } from '../services/strapi';

const foods = ref([]);
const showModal = ref(false);
const editingItem = ref(null);
const selectedFile = ref(null);
const fileInput = ref(null);
const formData = reactive({
  name: '',
  amount: 0,
  price: 0,
  shop: '',
  todate: '',
  photo: ''
});

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

const getPhotoUrl = (item) => {
  if (!item.photo) return '';
  // Check if photo is an array (sometimes Strapi returns array for media fields)
  const photo = Array.isArray(item.photo) ? item.photo[0] : item.photo;
  
  if (!photo) return '';
  if (typeof photo === 'string') return photo;
  
  // If flattened correctly by strapi.js, url should be direct property
  if (photo.url) {
     if (photo.url.startsWith('http')) return photo.url;
     return `${getApiUrl()}${photo.url}`;
  }
  return '';
};

const previewImageUrl = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value);
  }
  if (formData.photo && typeof formData.photo === 'string' && formData.photo.trim() !== '') {
    return formData.photo;
  }
  if (editingItem.value) {
    return getPhotoUrl(editingItem.value);
  }
  return '';
});

const openModal = (item = null) => {
  editingItem.value = item;
  selectedFile.value = null;
  if (item) {
    formData.name = item.name;
    formData.amount = item.amount;
    formData.price = item.price;
    formData.shop = item.shop;
    formData.todate = item.todate ? new Date(item.todate).toISOString().substr(0, 10) : '';
    // If photo is object, we can't really edit it as string easily, but we can show it
    formData.photo = typeof item.photo === 'string' ? item.photo : ''; 
  } else {
    Object.assign(formData, {
      name: '',
      amount: 0,
      price: 0,
      shop: '',
      todate: '',
      photo: ''
    });
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingItem.value = null;
  selectedFile.value = null;
};

const fetchData = async () => {
  try {
    // Strapi uses 'foods' collection name usually
    // sort format: field:desc
    foods.value = await strapi.find('foods', { sort: 'todate:desc', populate: '*', 'pagination[pageSize]': 100 });
  } catch (error) {
    console.error('Error fetching foods:', error);
  }
};

const downloadCSV = () => {
  const headers = ['ID', '名稱', '數量', '價格', '商店', '到期日', '圖片連結'];
  const rows = foods.value.map(item => [
    item.id,
    `"${(item.name || '').replace(/"/g, '""')}"`,
    item.amount,
    item.price,
    `"${(item.shop || '').replace(/"/g, '""')}"`,
    item.todate ? new Date(item.todate).toLocaleDateString() : '',
    `"${(getPhotoUrl(item) || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    '\uFEFF' + headers.join(','), // Add BOM for Excel Chinese support
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'strapifood.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const parseCSVLine = (text) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const uploadImageFromUrl = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const blob = await res.blob();
    // Create a File object from the blob
    const fileName = url.split('/').pop() || 'image.jpg';
    const file = new File([blob], fileName, { type: blob.type });
    
    // Upload to Strapi
    const uploaded = await strapi.upload(file);
    return uploaded.id;
  } catch (error) {
    console.warn(`Image upload failed for ${url}:`, error);
    return null;
  }
};

const isImporting = ref(false);
const importProgress = ref('');

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  isImporting.value = true;
  importProgress.value = '讀取檔案中...';

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      const cleanText = text.replace(/^\uFEFF/, '');
      const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
      
      const dataRows = lines.slice(1);
      
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        importProgress.value = `正在匯入第 ${i + 1} / ${dataRows.length} 筆... (成功: ${successCount}, 失敗: ${failCount})`;
        const line = dataRows[i];
        try {
          // Format: ID, Name, Amount, Price, Shop, ToDate, Photo
          const cols = parseCSVLine(line);
          if (cols.length < 2) continue;

          // Process photo URL if present
          let photoId = null;
          // Extract and clean the URL (remove quotes and backticks if any)
          let rawUrl = cols[6]?.replace(/^"|"$/g, '').trim();
          // Remove potential backticks from user report
          if (rawUrl) rawUrl = rawUrl.replace(/`/g, '').trim();

          if (rawUrl && rawUrl.startsWith('http')) {
             photoId = await uploadImageFromUrl(rawUrl);
          }

          const data = {
            name: cols[1]?.replace(/^"|"$/g, '') || '未命名',
            amount: Number(cols[2]) || 0,
            price: Number(cols[3]) || 0,
            shop: cols[4]?.replace(/^"|"$/g, '') || null,
            todate: cols[5] ? new Date(cols[5]) : null,
            photo: photoId // Link the uploaded image ID
          };

          await strapi.create('foods', data);
          successCount++;
        } catch (err) {
          console.error('Error importing row:', line, err);
          failCount++;
        }
      }

      alert(`匯入完成！成功：${successCount} 筆，失敗：${failCount} 筆`);
      fetchData();
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('CSV 解析失敗：' + error.message);
    } finally {
      isImporting.value = false;
      importProgress.value = '';
      event.target.value = '';
    }
  };
  reader.readAsText(file);
};

const saveFood = async () => {
  try {
    let photoValue = undefined;

    if (selectedFile.value) {
      const uploadedFile = await strapi.upload(selectedFile.value);
      photoValue = uploadedFile.id; // Assume Media field
    } else if (formData.photo) {
      photoValue = formData.photo;
    } else {
      // Handle preservation or clearing
      if (editingItem.value) {
        // If original was object (Media) and form is empty (we hide object in input), preserve it.
        if (typeof editingItem.value.photo === 'object' && editingItem.value.photo !== null) {
           photoValue = undefined; // Don't send field, preserve existing
        } else {
           // If original was string/null, and form is empty, user cleared it.
           photoValue = null;
        }
      } else {
        photoValue = null;
      }
    }

    const data = {
      name: formData.name,
      amount: formData.amount,
      price: formData.price,
      shop: formData.shop || null,
      todate: formData.todate ? new Date(formData.todate) : null
    };

    if (photoValue !== undefined) {
      data.photo = photoValue;
    }

    if (editingItem.value) {
      const idToUse = editingItem.value.documentId || editingItem.value.id;
      await strapi.update('foods', idToUse, data);
    } else {
      await strapi.create('foods', data);
    }
    
    closeModal();
    fetchData();
  } catch (error) {
    console.error('Error saving food:', error);
    alert('儲存失敗：' + error.message);
  }
};

const deleteFood = async (item) => {
  if (!confirm('確定要刪除嗎？')) return;
  try {
    console.log('Deleting food:', item.id);
    const idToUse = item.documentId || item.id;
    await strapi.delete('foods', idToUse);
    alert('刪除成功！');
    await fetchData();
  } catch (error) {
    console.error('Error deleting food:', error);
    alert('刪除失敗：' + error.message);
  }
};

const getDaysRemaining = (date) => {
  if (!date) return '';
  const now = new Date();
  const target = new Date(date);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '已過期';
  if (diffDays === 0) return '今天到期';
  return `剩 ${diffDays} 天`;
};

const isExpired = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

const isExpiringSoon = (date) => {
  if (!date) return false;
  const now = new Date();
  const target = new Date(date);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.page {
  color: #fff;
}
.header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.badge {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.actions .btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  margin-left: 8px;
}
.actions .primary {
  background: #ff5a5f;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.search {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: none;
}
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.card {
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 140px 1fr;
}
.thumb.food {
  background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
  background-size: cover;
  background-position: center;
}
.meta {
  padding: 10px 12px;
}
.name {
  font-weight: 600;
}
.info {
  font-size: 12px;
  opacity: 0.9;
  margin: 6px 0;
}
.ops {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
.ops .btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
.ops .btn.danger {
  background: rgba(255, 90, 95, 0.2);
  color: #ff5a5f;
}
.shop-tag {
  display: inline-block;
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 4px;
}
.details {
  display: flex;
  gap: 8px;
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}
.expiry {
  font-size: 13px;
  color: #fff;
}
.expiry.expired {
  color: #ff5a5f;
  font-weight: bold;
}
.expiry.warning {
  color: #ffc107;
  font-weight: bold;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #2a2a2a;
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  color: #fff;
}
.modal h3 {
  margin-top: 0;
  margin-bottom: 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  opacity: 0.8;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  box-sizing: border-box;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
.modal-actions .btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.modal-actions .btn.primary {
  background: #4facfe;
}

.image-preview {
  width: 100%;
  height: 200px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background-color: rgba(0,0,0,0.2);
}

@media (max-width: 900px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .cards {
    grid-template-columns: 1fr;
  }
  .header {
    display: flex;
    flex-wrap: wrap;
  }
  .header h2 {
    flex: 1;
    margin-left: 8px;
  }
  .actions {
    width: 100%;
    margin-top: 10px;
    margin-left: 0;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .actions .btn {
    flex: 1;
  }
}
</style>