<template>
  <section class="page">
    <div class="header">
      <div class="badge">🧾</div>
      <h2>訂閱管理系統</h2>
      <div class="actions">
        <input type="file" ref="fileInput" accept=".csv" style="display: none" @change="handleFileUpload" />
        <button class="btn" @click="triggerFileInput">匯入 CSV</button>
        <button class="btn" @click="downloadCSV">匯出 CSV</button>
        <button class="btn" @click="fetchData">重新載入</button>
        <button class="btn primary" @click="openModal(null)">新增訂閱</button>
      </div>
    </div>
    <div class="toolbar">
      <input class="search" placeholder="搜尋訂閱名稱或網站..." />
      <button class="btn">🔍 搜尋</button>
    </div>
    <div class="list">
      <div class="item" v-for="item in subscriptions" :key="item.id">
        <div class="main-info">
          <div class="name">{{ item.name || '未命名' }}</div>
          <div class="site-link" v-if="item.site">
            <img 
              :src="getFavicon(item.site)" 
              alt="" 
              class="site-favicon" 
              @error="$event.target.style.display='none'"
              v-if="getFavicon(item.site)"
            />
            <a :href="item.site" target="_blank" rel="noopener">前往網站</a>
          </div>
        </div>
        <div class="meta">
          <div class="price">價格：${{ item.price || 0 }}</div>
          <div class="account" v-if="item.account">帳號：{{ item.account }}</div>
          <div class="date">下期：{{ item.nextdate ? new Date(item.nextdate).toLocaleDateString() : '未設定' }}</div>
          <div class="note" v-if="item.note">備註：{{ item.note }}</div>
        </div>
        <div class="ops">
          <button class="btn" @click="openModal(item)">編輯</button>
          <button class="btn danger" @click="deleteSubscription(item)">刪除</button>
        </div>
      </div>
      <div v-if="subscriptions.length === 0" class="no-data">
        暫無資料或載入中...
      </div>
    </div>

    <!-- 編輯/新增 Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h3>{{ editingItem ? '編輯訂閱' : '新增訂閱' }}</h3>
        <div class="form-group">
          <label>名稱</label>
          <input v-model="formData.name" placeholder="請輸入訂閱名稱" />
        </div>
        <div class="form-group">
          <label>價格</label>
          <input type="number" v-model.number="formData.price" placeholder="請輸入價格" />
        </div>
        <div class="form-group">
          <label>下期扣款日</label>
          <input type="date" v-model="formData.nextdate" />
        </div>
        <div class="form-group">
          <label>網站連結</label>
          <input v-model="formData.site" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label>帳號</label>
          <input v-model="formData.account" placeholder="請輸入帳號" />
        </div>
        <div class="form-group">
          <label>備註 (Markdown)</label>
          <textarea v-model="formData.note" placeholder="備註事項 (支援 Markdown)" rows="4"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="closeModal">取消</button>
          <button class="btn primary" @click="saveSubscription">儲存</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { strapi } from '../services/strapi';

const subscriptions = ref([]);
const showModal = ref(false);
const editingItem = ref(null);
const fileInput = ref(null);
const formData = reactive({
  name: '',
  price: 0,
  nextdate: '',
  site: '',
  account: '',
  note: ''
});

const getFavicon = (url) => {
  if (!url) return '';
  try {
    // Check if url starts with http/https, if not, assume it might be invalid for URL constructor but try anyway or handle
    // If user inputs just "google.com", URL constructor might fail.
    // Strapi usually validates URL but let's be safe.
    let fullUrl = url;
    if (!url.startsWith('http')) {
        fullUrl = `https://${url}`;
    }
    const domain = new URL(fullUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (e) {
    return '';
  }
};

const openModal = (item = null) => {
  editingItem.value = item;
  if (item) {
    formData.name = item.name;
    formData.price = item.price;
    // Format date for input[type="date"]
    const date = item.nextdate;
    formData.nextdate = date ? new Date(date).toISOString().split('T')[0] : '';
    formData.site = item.site;
    formData.account = item.account;
    formData.note = item.note;
  } else {
    // Reset form
    formData.name = '';
    formData.price = 0;
    formData.nextdate = '';
    formData.site = '';
    formData.account = '';
    formData.note = '';
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingItem.value = null;
};

const saveSubscription = async () => {
  try {
    const data = {
      name: formData.name,
      price: Number(formData.price),
      nextdate: formData.nextdate ? new Date(formData.nextdate) : null,
      site: formData.site || null,
      account: formData.account || null,
      note: formData.note || null
    };

    if (editingItem.value) {
      // Use documentId if available (Strapi v5), fallback to id (Strapi v4)
      const idToUse = editingItem.value.documentId || editingItem.value.id;
      await strapi.update('subscriptions', idToUse, data);
    } else {
      await strapi.create('subscriptions', data);
    }
    
    closeModal();
    fetchData(); // Refresh list
  } catch (error) {
    console.error('Error saving subscription:', error);
    alert('儲存失敗：' + error.message);
  }
};

const deleteSubscription = async (item) => {
  if (!confirm('確定要刪除此訂閱嗎？')) return;
  
  try {
    console.log('Deleting subscription:', item.id);
    const idToUse = item.documentId || item.id;
    await strapi.delete('subscriptions', idToUse);
    alert('刪除成功！');
    await fetchData(); // Refresh list
  } catch (error) {
    console.error('Error deleting subscription:', error);
    alert('刪除失敗：' + error.message);
  }
};

const fetchData = async () => {
  try {
    subscriptions.value = await strapi.find('subscriptions', { sort: 'nextdate:asc', 'pagination[pageSize]': 100 });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
  }
};

const downloadCSV = () => {
  const headers = ['ID', '名稱', '價格', '網站', '帳號', '下期扣款日', '備註'];
  const rows = subscriptions.value.map(item => [
    item.id,
    `"${(item.name || '').replace(/"/g, '""')}"`,
    item.price,
    `"${(item.site || '').replace(/"/g, '""')}"`,
    `"${(item.account || '').replace(/"/g, '""')}"`,
    item.nextdate ? new Date(item.nextdate).toLocaleDateString() : '',
    `"${(item.note || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    '\uFEFF' + headers.join(','), // Add BOM for Excel Chinese support
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'strapisubscription.csv');
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

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      // Remove BOM if present
      const cleanText = text.replace(/^\uFEFF/, '');
      const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
      
      // Skip header
      const dataRows = lines.slice(1);
      
      let successCount = 0;
      let failCount = 0;

      for (const line of dataRows) {
        try {
          // Format: ID, Name, Price, Site, Account, NextDate, Note
          // Note: ID is ignored for creation
          const cols = parseCSVLine(line);
          if (cols.length < 2) continue; // Basic validation

          const data = {
            name: cols[1]?.replace(/^"|"$/g, '') || '未命名',
            price: Number(cols[2]) || 0,
            site: cols[3]?.replace(/^"|"$/g, '') || null,
            account: cols[4]?.replace(/^"|"$/g, '') || null,
            nextdate: cols[5] ? new Date(cols[5]) : null,
            note: cols[6]?.replace(/^"|"$/g, '') || null
          };

          await strapi.create('subscriptions', data);
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
    }
    // Reset input
    event.target.value = '';
  };
  reader.readAsText(file);
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
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.header h2 {
  flex: 1;
  min-width: 150px;
}
.actions {
  display: flex;
  gap: 8px;
}
.badge {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.actions .btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.site-favicon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: middle;
  border-radius: 2px;
}
.actions .primary {margin-left: 0;
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
.list {
  display: grid;
  gap: 10px;
}
.item {
  background: rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  align-items: center;
  gap: 10px;
}
.main-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.name {
  font-weight: 600;
  font-size: 16px;
}
.site-link a {
  color: #4facfe;
  text-decoration: none;
  font-size: 13px;
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  opacity: 0.9;
}
.note {
  font-size: 12px;
  opacity: 0.7;
  color: #ffeb3b;
}
.ops .btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  padding: 6px 10px;
  border-radius: 8px;
  margin-left: 6px;
}
.ops .danger {
  background: #ff5a5f;
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
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  box-sizing: border-box;
}
.form-group textarea {
  resize: vertical;
  font-family: inherit;
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

@media (max-width: 700px) {
  .item {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .ops {
    display: flex;
    justify-content: flex-end;
    margin-top: 4px;
  }
  .header {
    margin-bottom: 16px;
  }
  .actions {
    width: 100%;
    margin-top: 8px;
    justify-content: flex-start;
  }
  .actions .btn {
    flex: 1;
  }
  .modal {
    width: 95%;
    padding: 20px;
  }
}
</style>
