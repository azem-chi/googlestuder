/* ══════════════════════════════════════════
   AZEM — NUTRITION DIARY MODULE (v7)
   يوميات التغذية بقاعدة بيانات أطعمة عربية/جزائرية
══════════════════════════════════════════ */

/* ─── قاعدة بيانات الأطعمة ─── */
const FOODS_DB = [
  // ── بروتين ──
  { id:'egg',      name:'بيضة مسلوقة',        icon:'🥚', cal:78,  unit:'حبة',       cat:'بروتين' },
  { id:'egg_fr',   name:'بيضة مقلية',          icon:'🍳', cal:90,  unit:'حبة',       cat:'بروتين' },
  { id:'chicken',  name:'دجاج مشوي',           icon:'🍗', cal:165, unit:'100 غ',     cat:'بروتين' },
  { id:'tuna',     name:'تونة (علبة)',          icon:'🐟', cal:130, unit:'علبة',      cat:'بروتين' },
  { id:'beef',     name:'لحم بقري مشوي',       icon:'🥩', cal:250, unit:'100 غ',     cat:'بروتين' },
  { id:'fish',     name:'سمك مشوي',            icon:'🐠', cal:200, unit:'100 غ',     cat:'بروتين' },
  { id:'kafta',    name:'كفتة مشوية',           icon:'🥙', cal:240, unit:'2 قطعة',   cat:'بروتين' },
  { id:'lentils',  name:'عدس مطبوخ',           icon:'🫘', cal:140, unit:'كوب',       cat:'بروتين' },
  { id:'chickpea', name:'حمص مطبوخ',           icon:'🫘', cal:160, unit:'كوب',       cat:'بروتين' },
  // ── نشويات ──
  { id:'rice',     name:'أرز مطبوخ',           icon:'🍚', cal:200, unit:'كوب',       cat:'نشويات' },
  { id:'bread_ar', name:'خبز عربي',            icon:'🫓', cal:170, unit:'رغيف',      cat:'نشويات' },
  { id:'bread_br', name:'خبز أسمر (شريحة)',    icon:'🍞', cal:70,  unit:'شريحة',     cat:'نشويات' },
  { id:'pasta',    name:'مكرونة مطبوخة',       icon:'🍝', cal:220, unit:'كوب',       cat:'نشويات' },
  { id:'couscous', name:'كسكوس مطبوخ',         icon:'🥣', cal:180, unit:'كوب',       cat:'نشويات' },
  { id:'potato',   name:'بطاطا مسلوقة',        icon:'🥔', cal:150, unit:'حبة متوسطة', cat:'نشويات' },
  { id:'oats',     name:'شوفان بالحليب',       icon:'🥣', cal:300, unit:'كوب',       cat:'نشويات' },
  { id:'corn',     name:'ذرة مسلوقة',          icon:'🌽', cal:130, unit:'كوز',       cat:'نشويات' },
  // ── فاكهة ──
  { id:'banana',   name:'موزة',                icon:'🍌', cal:105, unit:'حبة',       cat:'فاكهة' },
  { id:'apple',    name:'تفاحة',               icon:'🍎', cal:80,  unit:'حبة',       cat:'فاكهة' },
  { id:'orange',   name:'برتقالة',             icon:'🍊', cal:60,  unit:'حبة',       cat:'فاكهة' },
  { id:'dates',    name:'تمر',                 icon:'🫘', cal:60,  unit:'3 حبات',    cat:'فاكهة' },
  { id:'grape',    name:'عنب',                 icon:'🍇', cal:90,  unit:'عنقود صغير', cat:'فاكهة' },
  { id:'water_m',  name:'بطيخ',                icon:'🍉', cal:85,  unit:'شريحة',     cat:'فاكهة' },
  // ── ألبان ──
  { id:'milk',     name:'حليب',                icon:'🥛', cal:150, unit:'كوب',       cat:'ألبان' },
  { id:'yogurt',   name:'لبن زبادي',           icon:'🍶', cal:100, unit:'كوب',       cat:'ألبان' },
  { id:'cheese',   name:'جبنة (شريحة)',         icon:'🧀', cal:80,  unit:'شريحة',     cat:'ألبان' },
  { id:'labneh',   name:'لبنة',                icon:'🥄', cal:150, unit:'2 ملعقة',   cat:'ألبان' },
  // ── دهون ──
  { id:'olive_oil',name:'زيت زيتون',           icon:'🫙', cal:120, unit:'ملعقة كبيرة', cat:'دهون' },
  { id:'nuts',     name:'مكسرات مشكلة',        icon:'🥜', cal:170, unit:'حفنة',      cat:'دهون' },
  { id:'almond',   name:'لوز',                 icon:'🌰', cal:160, unit:'حفنة',      cat:'دهون' },
  { id:'avocado',  name:'أفوكادو',             icon:'🥑', cal:240, unit:'حبة متوسطة', cat:'دهون' },
  // ── خضروات ──
  { id:'salad',    name:'سلطة خضراء',          icon:'🥗', cal:30,  unit:'طبق',       cat:'خضروات' },
  { id:'tomato',   name:'طماطم',               icon:'🍅', cal:35,  unit:'2 حبات',    cat:'خضروات' },
  { id:'cucumber', name:'خيار',                icon:'🥒', cal:25,  unit:'حبة',       cat:'خضروات' },
  { id:'soup',     name:'شوربة خضار',          icon:'🍲', cal:80,  unit:'طبق',       cat:'خضروات' },
  { id:'chorba',   name:'شوربة / حريرة',       icon:'🍵', cal:120, unit:'طبق',       cat:'خضروات' },
  // ── مشروبات ──
  { id:'water',    name:'ماء',                 icon:'💧', cal:0,   unit:'كوب',       cat:'مشروبات' },
  { id:'coffee',   name:'قهوة (بدون سكر)',     icon:'☕', cal:5,   unit:'كوب',       cat:'مشروبات' },
  { id:'tea',      name:'شاي (بدون سكر)',      icon:'🍵', cal:2,   unit:'كوب',       cat:'مشروبات' },
  { id:'juice',    name:'عصير برتقال طبيعي',  icon:'🧃', cal:120, unit:'كوب',       cat:'مشروبات' },
  { id:'soda',     name:'مشروب غازي',          icon:'🥤', cal:140, unit:'علبة',      cat:'مشروبات' },
  // ── وجبات جاهزة ──
  { id:'ch_plate', name:'وجبة دجاج (أرز+دجاج)',icon:'🍽️', cal:500, unit:'طبق',       cat:'وجبات' },
  { id:'cous_plt', name:'كسكسي بالدجاج',       icon:'🍽️', cal:450, unit:'طبق',       cat:'وجبات' },
  { id:'shawarma', name:'شاورما دجاج',          icon:'🌯', cal:400, unit:'حبة',       cat:'وجبات' },
  { id:'burger',   name:'برغر',                icon:'🍔', cal:500, unit:'حبة',       cat:'وجبات' },
  { id:'pizza',    name:'بيتزا (شريحة)',        icon:'🍕', cal:300, unit:'شريحة',     cat:'وجبات' },
  { id:'sandwich', name:'ساندويتش دجاج',       icon:'🥪', cal:350, unit:'حبة',       cat:'وجبات' },
  { id:'tagine',   name:'طاجين لحم',           icon:'🍲', cal:380, unit:'طبق',       cat:'وجبات' },
  // ── حلويات ──
  { id:'choco',    name:'شوكولاتة',            icon:'🍫', cal:150, unit:'30 غ',      cat:'حلويات' },
  { id:'cake',     name:'كيك (شريحة)',          icon:'🎂', cal:350, unit:'شريحة',     cat:'حلويات' },
  { id:'icecream', name:'آيس كريم',            icon:'🍦', cal:200, unit:'كوب',       cat:'حلويات' },
  { id:'baklava',  name:'بقلاوة',              icon:'🍯', cal:150, unit:'قطعة',      cat:'حلويات' },
  { id:'makroud',  name:'مقروض',               icon:'🧆', cal:130, unit:'حبة',       cat:'حلويات' },
  { id:'honey_sp', name:'عسل',                icon:'🍯', cal:60,  unit:'ملعقة',     cat:'حلويات' },
  // ── مكملات ──
  { id:'protein_s',name:'شيك بروتين',          icon:'💪', cal:150, unit:'كوب',       cat:'مكملات' },
  { id:'protbar',  name:'قضيب بروتين',         icon:'🍫', cal:220, unit:'قضيب',      cat:'مكملات' },
];

const NUT_CATS = ['الكل','بروتين','نشويات','فاكهة','ألبان','دهون','خضروات','مشروبات','وجبات','حلويات','مكملات'];
let _nutActiveCat = 'الكل';
let _nutSearch = '';
let _pendingFood = null; // الطعام المحدد قيد الإضافة
let _pendingQty = 1;

/* ─── حساب الهدف اليومي (Mifflin-St Jeor بعمر وجنس حقيقيين) ─── */
function calcDailyCalTarget() {
  const kg     = parseFloat(S.user?.weight) || 70;
  const cm     = parseFloat(S.user?.height) || 170;
  const age    = parseFloat(S.user?.age)    || 25;
  const gender = S.user?.gender || 'male';
  const goal   = S.user?.goal   || 'burn';
  const bmr = gender === 'female'
    ? Math.round(10*kg + 6.25*cm - 5*age - 161)
    : Math.round(10*kg + 6.25*cm - 5*age + 5);
  const tdee = Math.round(bmr * 1.375);
  if (goal === 'burn')   return Math.round(tdee - 300);
  if (goal === 'muscle') return Math.round(tdee + 300);
  return tdee;
}

/* ─── مفتاح اليوم ─── */
function todayKey() {
  return new Date().toISOString().split('T')[0];
}

/* ─── الإجمالي اليومي ─── */
function todayNutTotal() {
  const entries = (S.nutritionLog || {})[todayKey()]?.entries || [];
  return entries.reduce((s, e) => s + (e.totalCal || 0), 0);
}

/* ═══════════════════════════════════════
   RENDER DIARY — يُعيد رسم قسم التغذية
═══════════════════════════════════════ */
function renderNutritionDiary() {
  const el = document.getElementById('nutrition-plan');
  if (!el) return;

  const target  = calcDailyCalTarget();
  const total   = todayNutTotal();
  const pct     = Math.min(100, Math.round((total / target) * 100));
  const entries = (S.nutritionLog || {})[todayKey()]?.entries || [];

  const barColor = pct > 110 ? '#E05A4B' : pct >= 80 ? '#D4A843' : '#3FD970';

  // Macro split
  const goal = S.user?.goal || 'burn';
  const kg   = parseFloat(S.user?.weight) || 70;
  const protein = Math.round(kg * (goal === 'muscle' ? 2.0 : 1.6));
  const fat     = Math.round(kg * 0.8);
  const carb    = Math.max(50, Math.round((target - protein * 4 - fat * 9) / 4));

  el.innerHTML = `
    <!-- رأس القسم -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div style="font-size:12px;color:var(--dim);">
        الهدف: <strong style="color:var(--gold);">${target.toLocaleString('ar')} كال</strong> ·
        مُسجَّل: <strong style="color:${barColor};">${total.toLocaleString('ar')} كال</strong>
      </div>
      <button onclick="openNutritionModal()" class="nut-add-btn-small">+ إضافة طعام</button>
    </div>

    <!-- شريط التقدم -->
    <div style="background:rgba(255,255,255,0.07);border-radius:8px;height:10px;overflow:hidden;margin-bottom:6px;">
      <div style="width:${pct}%;height:100%;background:${barColor};border-radius:8px;transition:width .6s ease;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--dim);margin-bottom:16px;">
      <span>${pct}% من هدفك</span>
      <span>${Math.max(0, target - total).toLocaleString('ar')} كال متبقية</span>
    </div>

    <!-- الماكرو المستهدف -->
    <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;">
      ${[
        { lbl:'🥩 بروتين', val:protein, color:'#f97316' },
        { lbl:'🍚 كارب',   val:carb,    color:'#38bdf8' },
        { lbl:'🥑 دهون',   val:fat,     color:'#a78bfa' },
      ].map(m=>`
        <div style="flex:1;min-width:80px;background:var(--card);border-radius:10px;padding:8px;text-align:center;border:1px solid var(--border);">
          <div style="font-size:11px;color:var(--dim);margin-bottom:3px;">${m.lbl}</div>
          <div style="font-size:14px;font-weight:900;color:${m.color};">${m.val}<span style="font-size:10px;"> غ</span></div>
        </div>`).join('')}
    </div>

    <!-- قائمة الوجبات -->
    ${entries.length === 0 ? `
      <div style="text-align:center;padding:24px 0;color:var(--dim);">
        <div style="font-size:32px;margin-bottom:8px;">🍽️</div>
        <div style="font-size:13px;">لا توجد وجبات مُسجَّلة اليوم</div>
        <div style="font-size:11px;margin-top:4px;opacity:.6;">ابدأ بتسجيل وجباتك لتتبع سعراتك</div>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
        ${entries.map((e, idx) => `
          <div class="nut-entry-row">
            <span class="nut-entry-icon">${e.icon || '🍽️'}</span>
            <div class="nut-entry-info">
              <div class="nut-entry-name">${e.name}</div>
              <div class="nut-entry-meta">${e.qty} ${e.unit || ''}</div>
            </div>
            <div class="nut-entry-cal">${e.totalCal} <span style="font-size:9px;color:var(--dim);">كال</span></div>
            <button class="nut-del-btn" onclick="removeNutEntry(${idx})" title="حذف">×</button>
          </div>
        `).join('')}
      </div>
    `}

    <!-- زر إضافة -->
    <button onclick="openNutritionModal()" class="nut-add-main-btn">
      ＋ إضافة طعام أو وجبة
    </button>

    <!-- نصيحة الماء -->
    <div style="margin-top:12px;padding:10px 14px;background:rgba(56,189,248,0.07);border-radius:10px;border:1px solid rgba(56,189,248,0.15);font-size:11px;color:var(--dim);">
      💧 اشرب ${((parseFloat(S.user?.weight)||70) * 0.035).toFixed(1)} لتر ماء يومياً
      ${(S.completedDays||[]).includes(S.currentDay) ? '+ 0.5 لتر إضافية (يوم تدريب) 🔥' : ''}
    </div>
  `;
}

/* ═══════════════════════════════════════
   MODAL — فاتح منتقي الطعام
═══════════════════════════════════════ */
function openNutritionModal() {
  _nutActiveCat = 'الكل';
  _nutSearch = '';
  document.getElementById('nut-modal').style.display = 'flex';
  document.getElementById('nut-search-inp').value = '';
  renderNutCategoryTabs();
  renderNutFoodList();
  setTimeout(() => document.getElementById('nut-search-inp').focus(), 300);
}

function closeNutritionModal() {
  document.getElementById('nut-modal').style.display = 'none';
  _pendingFood = null;
  document.getElementById('nut-qty-panel').style.display = 'none';
}

function renderNutCategoryTabs() {
  const el = document.getElementById('nut-cat-tabs');
  if (!el) return;
  el.innerHTML = NUT_CATS.map(cat => `
    <button class="nut-cat-tab ${_nutActiveCat === cat ? 'active' : ''}"
      onclick="nutSetCat('${cat}')">${cat}</button>
  `).join('');
}

function nutSetCat(cat) {
  _nutActiveCat = cat;
  renderNutCategoryTabs();
  renderNutFoodList();
}

function renderNutFoodList() {
  const el = document.getElementById('nut-food-list');
  if (!el) return;

  let filtered = FOODS_DB;
  if (_nutActiveCat !== 'الكل') filtered = filtered.filter(f => f.cat === _nutActiveCat);
  if (_nutSearch) {
    const q = _nutSearch.toLowerCase();
    filtered = filtered.filter(f => f.name.includes(q) || f.cat.includes(q));
  }

  if (filtered.length === 0) {
    el.innerHTML = `<div style="text-align:center;padding:32px;color:var(--dim);font-size:13px;">
      <div style="font-size:28px;margin-bottom:8px;">🔍</div>
      لا توجد نتائج — جرب إضافة وجبة مخصصة
    </div>`;
    return;
  }

  el.innerHTML = filtered.map(f => `
    <button class="nut-food-item" onclick="nutSelectFood('${f.id}')">
      <span class="nut-food-icon">${f.icon}</span>
      <div class="nut-food-info">
        <div class="nut-food-name">${f.name}</div>
        <div class="nut-food-unit">لكل ${f.unit}</div>
      </div>
      <div class="nut-food-cal">${f.cal} <span style="font-size:10px;">كال</span></div>
    </button>
  `).join('');
}

function nutSelectFood(id) {
  const food = FOODS_DB.find(f => f.id === id);
  if (!food) return;
  _pendingFood = food;
  _pendingQty = 1;
  showNutQtyPanel();
}

function showNutQtyPanel() {
  if (!_pendingFood) return;
  const panel = document.getElementById('nut-qty-panel');
  panel.style.display = 'flex';
  updateQtyPanel();
}

function updateQtyPanel() {
  if (!_pendingFood) return;
  document.getElementById('qty-food-icon').textContent = _pendingFood.icon;
  document.getElementById('qty-food-name').textContent = _pendingFood.name;
  document.getElementById('qty-food-unit').textContent = `لكل ${_pendingFood.unit}`;
  document.getElementById('qty-num').textContent = _pendingQty;
  document.getElementById('qty-total-cal').textContent = Math.round(_pendingFood.cal * _pendingQty);
}

function nutAdjQty(delta) {
  _pendingQty = Math.max(0.5, _pendingQty + delta);
  // Round to 0.5 steps
  _pendingQty = Math.round(_pendingQty * 2) / 2;
  updateQtyPanel();
}

function confirmNutAdd() {
  if (!_pendingFood) return;
  const dateKey = todayKey();
  if (!S.nutritionLog) S.nutritionLog = {};
  if (!S.nutritionLog[dateKey]) S.nutritionLog[dateKey] = { entries: [] };

  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  S.nutritionLog[dateKey].entries.push({
    id:       _pendingFood.id,
    name:     _pendingFood.name,
    icon:     _pendingFood.icon,
    cal:      _pendingFood.cal,
    unit:     _pendingFood.unit,
    qty:      _pendingQty,
    totalCal: Math.round(_pendingFood.cal * _pendingQty),
    time:     timeStr,
    ts:       Date.now()
  });

  saveState();
  renderNutritionDiary();
  closeNutritionModal();
  // تحديث الرسم البياني إذا كان مفتوحاً
  if (typeof renderTrendChart === 'function') {
    try { renderTrendChart(14); } catch(e) {}
  }
  showMiniToast(`✅ ${_pendingFood.icon} ${_pendingFood.name} — ${Math.round(_pendingFood.cal * _pendingQty)} كال`);
  _pendingFood = null;
  _pendingQty = 1;
}

/* ─── إضافة وجبة مخصصة ─── */
function nutAddCustom() {
  const name = document.getElementById('nut-custom-name').value.trim();
  const cal  = parseInt(document.getElementById('nut-custom-cal').value) || 0;
  if (!name || cal <= 0) {
    showMiniToast('⚠️ أدخل اسم الوجبة والسعرات');
    return;
  }
  const dateKey = todayKey();
  if (!S.nutritionLog) S.nutritionLog = {};
  if (!S.nutritionLog[dateKey]) S.nutritionLog[dateKey] = { entries: [] };

  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  S.nutritionLog[dateKey].entries.push({
    id: 'custom_' + Date.now(),
    name, icon:'🍽️', cal, unit:'وجبة', qty:1, totalCal:cal,
    time: timeStr, ts: Date.now()
  });

  saveState();
  renderNutritionDiary();
  closeNutritionModal();
  showMiniToast(`✅ ${name} — ${cal} كال`);
  document.getElementById('nut-custom-name').value = '';
  document.getElementById('nut-custom-cal').value = '';
}

/* ─── حذف إدخال ─── */
function removeNutEntry(idx) {
  const dateKey = todayKey();
  const entries = (S.nutritionLog || {})[dateKey]?.entries;
  if (!entries) return;
  entries.splice(idx, 1);
  saveState();
  renderNutritionDiary();
}

/* ─── البحث ─── */
function nutSearch(val) {
  _nutSearch = val.trim();
  renderNutFoodList();
}

/* ══════════════════════════════════════════
   Patch renderNutrition in render.js (override)
══════════════════════════════════════════ */
window.renderNutrition = renderNutritionDiary;
