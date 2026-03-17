/* ══════════════════════════════════════════
   AZEM — CHARTS MODULE (v7)
   رسوم بيانية تفاعلية بـ Chart.js 4
   يعمل مع render.js الموجود — لا يكسر أي شيء
══════════════════════════════════════════ */

let _trendChart = null;
let _donutChart = null;

/* ── إدخال قسم الرسوم في DOM ── */
function injectChartsSection() {
  if (document.getElementById('charts-section')) return; // لا تُكرر
  const weeklyBarsEl = document.getElementById('weekly-bars');
  const anchor = weeklyBarsEl ? weeklyBarsEl.closest('.sec-card') : null;
  if (!anchor) return;

  const section = document.createElement('div');
  section.id = 'charts-section';
  section.className = 'sec-card';
  section.innerHTML = `
    <div class="sec-card-title" style="display:flex;align-items:center;justify-content:space-between;">
      <span>📈 اتجاه السعرات — 14 يوم</span>
      <div style="display:flex;gap:6px;" id="chart-range-btns">
        <button class="chart-range-btn active" data-range="14" onclick="switchChartRange(14,this)">14 يوم</button>
        <button class="chart-range-btn" data-range="30" onclick="switchChartRange(30,this)">30 يوم</button>
      </div>
    </div>
    <div style="position:relative;height:180px;margin:12px 0 6px;">
      <canvas id="chart-trend" style="display:block;"></canvas>
      <div id="chart-trend-empty" style="display:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--dim);font-size:13px;">
        <span style="font-size:32px;">📊</span>
        أكمل أول جلسة لترى الرسم البياني
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap;">
      <div class="chart-legend-dot" style="background:#D4A843;"></div>
      <span style="font-size:11px;color:var(--dim);">تمرين</span>
      <div class="chart-legend-dot" style="background:#3FD970;margin-right:6px;"></div>
      <span style="font-size:11px;color:var(--dim);">طعام مُسجَّل</span>
    </div>

    <div style="border-top:1px solid var(--border);margin:16px 0;"></div>

    <div class="sec-card-title">🎯 نسبة الإنجاز</div>
    <div style="display:flex;align-items:center;gap:20px;margin-top:8px;flex-wrap:wrap;">
      <div style="position:relative;width:110px;height:110px;flex-shrink:0;">
        <canvas id="chart-donut" style="display:block;"></canvas>
        <div id="chart-donut-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">
          <span id="donut-pct" style="font-size:26px;font-weight:900;color:var(--gold);line-height:1;">0%</span>
          <span style="font-size:10px;color:var(--dim);">مكتمل</span>
        </div>
      </div>
      <div id="chart-donut-stats" style="flex:1;min-width:140px;display:flex;flex-direction:column;gap:8px;"></div>
    </div>
  `;

  anchor.insertAdjacentElement('afterend', section);
}

/* ── رسم مخطط الاتجاه ── */
function renderTrendChart(days = 14) {
  const canvas = document.getElementById('chart-trend');
  const emptyEl = document.getElementById('chart-trend-empty');
  if (!canvas) return;
  if (typeof Chart === 'undefined') { canvas.style.display='none'; if(emptyEl){emptyEl.style.display='flex';emptyEl.innerHTML='<span style="font-size:12px;color:var(--dim);">⚠️ Chart.js غير متاح — تحقق من الإنترنت</span>';} return; }

  const today = new Date();
  const labels = [], trainData = [], nutData = [];
  let hasAnyData = false;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    // بيانات التدريب: نبحث في trainingLog بالتاريخ
    const trainLog = Object.values(S.trainingLog || {}).find(e => {
      if (e.ts) { const k = new Date(e.ts).toISOString().split('T')[0]; return k === dateKey; }
      return false;
    });
    const trainCal = trainLog?.calories || 0;
    // بيانات التغذية
    const nutEntries = (S.nutritionLog || {})[dateKey]?.entries || [];
    const nutCal = nutEntries.reduce((s, e) => s + (e.totalCal || 0), 0);

    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    labels.push(`${dd}/${mm}`);
    trainData.push(trainCal);
    nutData.push(nutCal);
    if (trainCal > 0 || nutCal > 0) hasAnyData = true;
  }

  if (!hasAnyData) {
    canvas.style.display = 'none';
    if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.style.flexDirection = 'column'; }
    return;
  }
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  if (_trendChart) { _trendChart.destroy(); _trendChart = null; }

  const ctx = canvas.getContext('2d');

  // Gradient fill for workout
  const gTrain = ctx.createLinearGradient(0, 0, 0, 160);
  gTrain.addColorStop(0, 'rgba(212,168,67,0.25)');
  gTrain.addColorStop(1, 'rgba(212,168,67,0.02)');

  const gNut = ctx.createLinearGradient(0, 0, 0, 160);
  gNut.addColorStop(0, 'rgba(63,217,112,0.18)');
  gNut.addColorStop(1, 'rgba(63,217,112,0.02)');

  _trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'تمرين',
          data: trainData,
          borderColor: '#D4A843',
          backgroundColor: gTrain,
          borderWidth: 2.5,
          fill: true,
          tension: 0.42,
          pointRadius: trainData.map(v => v > 0 ? 4 : 0),
          pointBackgroundColor: '#D4A843',
          pointBorderColor: 'rgba(212,168,67,0.3)',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          spanGaps: true,
        },
        {
          label: 'طعام',
          data: nutData,
          borderColor: '#3FD970',
          backgroundColor: gNut,
          borderWidth: 2,
          fill: false,
          tension: 0.42,
          pointRadius: nutData.map(v => v > 0 ? 3 : 0),
          pointBackgroundColor: '#3FD970',
          pointHoverRadius: 5,
          spanGaps: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 700, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          backgroundColor: 'rgba(15,15,25,0.92)',
          borderColor: 'rgba(212,168,67,0.4)',
          borderWidth: 1,
          padding: 10,
          titleColor: '#D4A843',
          bodyColor: 'rgba(255,255,255,0.75)',
          titleFont: { family: 'Cairo', size: 12, weight: '700' },
          bodyFont:  { family: 'Cairo', size: 11 },
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (ctx) => {
              const v = ctx.parsed.y;
              if (v === 0) return null;
              return `${ctx.dataset.label}: ${v} سعرة`;
            }
          },
          filter: (item) => item.parsed.y > 0
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          ticks: {
            color: 'rgba(255,255,255,0.35)',
            font: { family: 'Cairo', size: 10 },
            maxRotation: 0,
            maxTicksLimit: days <= 14 ? 7 : 10
          },
          border: { display: false }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          ticks: {
            color: 'rgba(255,255,255,0.35)',
            font: { family: 'Cairo', size: 10 },
            callback: v => v >= 1000 ? (v/1000).toFixed(1)+'k' : v
          },
          border: { display: false },
          beginAtZero: true
        }
      }
    }
  });
}

/* ── رسم الدونت ── */
function renderDonutChart() {
  const canvas = document.getElementById('chart-donut');
  if (!canvas || typeof Chart === 'undefined') return;

  const done = (S.completedDays || []).length;
  const total = S.user?.programDays || 30;
  const pct = Math.round((done / total) * 100);
  const remaining = Math.max(0, total - done);

  document.getElementById('donut-pct').textContent = pct + '%';

  // Streak + calories from log
  const totalCal = Object.values(S.trainingLog || {}).reduce((s, e) => s + (e.calories || 0), 0);
  const statsEl = document.getElementById('chart-donut-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="donut-stat-row"><span class="donut-stat-icon">✅</span><span class="donut-stat-lbl">مكتمل:</span><span class="donut-stat-val" style="color:var(--gold);">${done} / ${total} يوم</span></div>
      <div class="donut-stat-row"><span class="donut-stat-icon">🔥</span><span class="donut-stat-lbl">سلسلة:</span><span class="donut-stat-val" style="color:#f97316;">${S.streak || 0} أيام</span></div>
      <div class="donut-stat-row"><span class="donut-stat-icon">⚡</span><span class="donut-stat-lbl">إجمالي الحرق:</span><span class="donut-stat-val" style="color:#38bdf8;">${totalCal >= 1000 ? (totalCal/1000).toFixed(1)+'k' : totalCal} كال</span></div>
      <div class="donut-stat-row"><span class="donut-stat-icon">📅</span><span class="donut-stat-lbl">متبقي:</span><span class="donut-stat-val" style="color:var(--dim);">${remaining} يوم</span></div>
    `;
  }

  if (_donutChart) { _donutChart.destroy(); _donutChart = null; }
  const ctx = canvas.getContext('2d');

  const color = pct >= 80 ? '#3FD970' : pct >= 50 ? '#D4A843' : '#7C5CEF';

  _donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [done, remaining],
        backgroundColor: [color, 'rgba(255,255,255,0.06)'],
        borderColor: [color, 'transparent'],
        borderWidth: [2, 0],
        hoverOffset: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      animation: { duration: 800, easing: 'easeOutBack' },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

/* ── تبديل النطاق الزمني ── */
function switchChartRange(days, btn) {
  document.querySelectorAll('.chart-range-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTrendChart(days);
}

/* ── الدالة الرئيسية ── */
function renderAllCharts() {
  injectChartsSection();
  // Defer slightly to ensure canvas is in DOM
  requestAnimationFrame(() => {
    renderTrendChart(14);
    renderDonutChart();
  });
}

/* ══════════════════════════════════════════
   renderProgress تستدعي renderAllCharts مباشرة في render.js
   لا حاجة لـ patch هنا
══════════════════════════════════════════ */
