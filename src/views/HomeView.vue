<template>
  <section class="home">
    <div class="hero">
      <div class="logo">鋒</div>
      <h1 class="title">鋒兄AI資訊系統</h1>
      <p class="subtitle">智能管理您的影片和圖片收藏 · 支援智能分類和快速搜尋</p>
      <div class="copyright">鋒兄塗哥公關資訊© 版權所有 2025 ~ 2125</div>
      <div class="tech">
        <div class="card">
          <div class="card-title">⚡ 前端技術</div>
          <ul class="list">
            <li>Vue 3 (Vite)</li>
            <li>網頁存放於 Local</li>
            <li>響應式設計 + CSS</li>
          </ul>
        </div>
        <div class="card">
          <div class="card-title">🚀 後端技術</div>
          <ul class="list">
            <li>Strapi (Headless CMS)</li>
            <li>資料存放於 Strapi Cloud</li>
            <li>RESTful API</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="dashboard">
      <div class="panel">
        <div class="panel-title">🧾 訂閱管理</div>
        <div class="stats">
          <div class="stat">
            <div class="label">項目數</div>
            <div class="value">{{ subscriptionTotal }}</div>
          </div>
          <div class="stat">
            <div class="label">7天提醒</div>
            <div class="value">{{ subscription7 }}</div>
            <div class="hint">最近：{{ subscription7Date }}</div>
          </div>
          <div class="stat">
            <div class="label">30天提醒</div>
            <div class="value">{{ subscription30 }}</div>
            <div class="hint">最近：{{ subscription30Date }}</div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">🍎 食品管理</div>
        <div class="stats">
          <div class="stat">
            <div class="label">項目數</div>
            <div class="value">{{ foodTotal }}</div>
          </div>
          <div class="stat">
            <div class="label">3天提醒</div>
            <div class="value">{{ food3 }}</div>
            <div class="hint">最近：{{ food3Date }}</div>
          </div>
          <div class="stat">
            <div class="label">7天提醒</div>
            <div class="value">{{ food7 }}</div>
            <div class="hint">最近：{{ food7Date }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="section-title">☀️ 系統功能選單</div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { strapi } from '../services/strapi';

const subscriptionTotal = ref(0);
const subscription7 = ref(0);
const subscription30 = ref(0);
const subscription7Date = ref('-');
const subscription30Date = ref('-');
const foodTotal = ref(0);
const food3 = ref(0);
const food7 = ref(0);
const food3Date = ref('-');
const food7Date = ref('-');

const addDays = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDate = (d) => {
  if (!d) return '-';
  const x = new Date(d);
  return x.toLocaleDateString();
};

const fetchDashboard = async () => {
  try {
    const now = new Date();
    // Fetch all to calculate stats on client side (simplest for migration)
    const subs = await strapi.find('subscriptions', { sort: 'nextdate:asc' });
    const foods = await strapi.find('foods', { sort: 'todate:asc' });

    // Subscriptions stats
    subscriptionTotal.value = subs.length;
    
    // 7 days
    const subs7 = subs.filter(s => {
        if (!s.nextdate) return false;
        const d = new Date(s.nextdate);
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        // diff >= -1 to include today (roughly)
        return diff >= -1 && diff <= 7;
    });
    subscription7.value = subs7.length;
    subscription7Date.value = subs7.length > 0 ? formatDate(subs7[0].nextdate) : '-';

    // 30 days
    const subs30 = subs.filter(s => {
        if (!s.nextdate) return false;
        const d = new Date(s.nextdate);
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 30;
    });
    subscription30.value = subs30.length;
    subscription30Date.value = subs30.length > 0 ? formatDate(subs30[0].nextdate) : '-';

    // Foods stats
    foodTotal.value = foods.length;

    // 3 days
    const foods3 = foods.filter(f => {
        if (!f.todate) return false;
        const d = new Date(f.todate);
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 3;
    });
    food3.value = foods3.length;
    food3Date.value = foods3.length > 0 ? formatDate(foods3[0].todate) : '-';

    // 7 days
    const foods7 = foods.filter(f => {
        if (!f.todate) return false;
        const d = new Date(f.todate);
        const diff = (d - now) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 7;
    });
    food7.value = foods7.length;
    food7Date.value = foods7.length > 0 ? formatDate(foods7[0].todate) : '-';

  } catch (error) {
      console.error('Error loading dashboard:', error);
  }
};

onMounted(() => {
  fetchDashboard();
});
</script>

<style scoped>
.home {
  color: #fff;
}
.hero {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 980px;
  margin: 0 auto;
}
.logo {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: #ff5a5f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 12px;
}
.title {
  font-size: 32px;
  margin-bottom: 8px;
}
.subtitle {
  opacity: 0.95;
  margin-bottom: 8px;
}
.copyright {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 20px;
}
.tech {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  text-align: left;
}
.card-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.list {
  padding-left: 18px;
}
.section-title {
  text-align: center;
  margin-top: 24px;
  font-weight: 600;
}
@media (max-width: 680px) {
  .tech {
    grid-template-columns: 1fr;
  }
}
.dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 980px;
  margin: 18px auto 0;
}
.panel {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
}
.panel-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.stat .label {
  font-size: 13px;
  opacity: 0.9;
}
.stat .value {
  font-size: 22px;
  font-weight: 700;
}
.stat .hint {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.9;
}
@media (max-width: 680px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 480px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
