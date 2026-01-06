<template>
  <section class="page">
    <div class="header">
      <div class="badge">⚙️</div>
      <h2>系統設定</h2>
    </div>

    <div class="content">
      <div class="card">
        <h3>Strapi 設定</h3>
        <p class="desc">請設定 Strapi API 網址與存取權杖。</p>
        
        <div class="form-group">
          <label>API URL</label>
          <div class="input-wrapper">
            <input type="text" v-model="apiUrl" placeholder="http://localhost:1337" />
            <button class="copy-btn" @click="copyToClipboard(apiUrl)">複製</button>
          </div>
        </div>

        <div class="form-group">
          <label>API Token</label>
          <div class="input-wrapper">
            <input type="text" v-model="apiToken" placeholder="Strapi API Token" />
            <button class="copy-btn" @click="copyToClipboard(apiToken)">複製</button>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" @click="saveSettings">儲存設定</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const apiUrl = ref('');
const apiToken = ref('');

onMounted(() => {
  apiUrl.value = localStorage.getItem('strapi_url') || 'https://dazzling-strength-d03d813531.strapiapp.com';
  apiToken.value = localStorage.getItem('strapi_token') || 'df4d29f7ad437b3317afb55ec815bb6837077b59bdea1a2a3ea000ae976a61bd80d4642849f37314a9a6b8074f47edf3297d8854bf302b286a00cb47400013a75540b8662478b65f541e7c185cd443eac9ee5a37a472c6bf32a83740a8dd463cb50821fb59435b472268d9a76e3ae1cd1a56f58717839f2e1953c81965ab9df8';
});

const saveSettings = () => {
  localStorage.setItem('strapi_url', apiUrl.value);
  localStorage.setItem('strapi_token', apiToken.value);
  alert('設定已儲存，請重新整理頁面以套用變更。');
  window.location.reload();
};

const copyToClipboard = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text)
    .then(() => alert('已複製到剪貼簿'))
    .catch(() => alert('複製失敗'));
};
</script>

<style scoped>
.actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}
.actions.start {
  justify-content: flex-start;
}
.btn {
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: opacity 0.2s;
}
.btn:hover {
  opacity: 0.9;
}
.primary {
  background: #ff5a5f;
  color: #fff;
}
.page {
  color: #fff;
  max-width: 800px;
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.badge {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}
h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}
.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(10px);
}
h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
}
.desc {
  margin: 0 0 20px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}
.form-group {
  margin-bottom: 16px;
}
label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}
.input-wrapper {
  display: flex;
  gap: 8px;
}
input {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 1rem;
}
input:focus {
  outline: none;
  border-color: #ff5a5f;
}
.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  padding: 0 16px;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
