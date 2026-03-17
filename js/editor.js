/* ══════ PHASE 3: KEYBOARD SHORTCUTS ══════ */
const SHORTCUTS = [
  {key:'1-7', desc:'تغيير الثيم'}, {key:'8', desc:'تغيير الوضع'},
  {key:'M', desc:'تغيير الوضع'}, {key:'L', desc:'تغيير اللغة'},
  {key:'S', desc:'الصوت'}, {key:'← →', desc:'التنقل بين الأيام'},
  {key:'T', desc:'اليوم الحالي'}, {key:'Space', desc:'تشغيل/إيقاف'},
  {key:'N', desc:'التمرين التالي'}, {key:'P', desc:'التمرين السابق'},
  {key:'Enter', desc:'إنهاء المجموعة'}, {key:'Esc', desc:'إغلاق الجلسة'},
  {key:'R', desc:'إعادة المؤقت'}, {key:'C', desc:'تحديد مكتمل'},
  {key:'D', desc:'إنهاء اليوم'}, {key:'A', desc:'المدرب الذكي'},
  {key:'F', desc:'ملء الشاشة'}, {key:'?', desc:'هذه القائمة'},
];

function showShortcutsHelp() {
  const existing = document.getElementById('shortcuts-modal');
  if (existing) { existing.remove(); return; }
  const modal = document.createElement('div');
  modal.id = 'shortcuts-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9800;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
  modal.innerHTML = `
    <div style="background:var(--night);border:1px solid var(--border);border-radius:20px;padding:24px;max-width:420px;width:90%;max-height:80vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;margin-bottom:16px;">
        <span style="font-size:16px;font-weight:900;flex:1;">⌨️ اختصارات لوحة المفاتيح</span>
        <button onclick="document.getElementById('shortcuts-modal').remove()" style="font-size:20px;padding:4px 8px;border-radius:8px;background:var(--card);border:1px solid var(--border);">✕</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${SHORTCUTS.map(s=>`
          <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:var(--card);border:1px solid var(--border);">
            <kbd style="background:var(--card2);border:1px solid var(--border);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:900;font-family:monospace;color:var(--gold);white-space:nowrap;">${s.key}</kbd>
            <span style="font-size:12px;color:var(--text2);">${s.desc}</span>
          </div>`).join('')}
      </div>
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
        <div style="font-size:13px;font-weight:900;margin-bottom:8px;">📺 ريموت التلفزيون</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--text2);">
          <div>🔴 ابدأ/إيقاف الجلسة</div>
          <div>🟢 تحديد مكتمل ✓</div>
          <div>🟡 المدرب الذكي AI</div>
          <div>🔵 هذه القائمة</div>
          <div>1-7 الثيمات</div>
          <div>8 تغيير الوضع</div>
          <div>OK تأكيد/تفاصيل</div>
          <div>Back رجوع</div>
        </div>
      </div>
    </div>`;
  modal.onclick = e => { if(e.target===modal) modal.remove(); };
  document.body.appendChild(modal);
}

document.addEventListener('keydown', (e) => {
  // Don't trigger shortcuts when typing in inputs
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
  
  const sessOpen = document.getElementById('session-overlay')?.classList.contains('open');
  const key = e.key;
  const code = e.code;

  // Theme shortcuts: 1-7
  if (!e.ctrlKey && !e.altKey && key >= '1' && key <= '7') {
    const themes = ['default','fire','ocean','nature','neon','purple','light'];
    setTheme(themes[parseInt(key)-1]);
    showMiniToast(THEME_ICONS[themes[parseInt(key)-1]] + ' ' + themes[parseInt(key)-1]);
    return;
  }

  // Mode: 8 فقط (M محجوز للمدرب)
  if (!e.ctrlKey && key === '8') {
    cycleMode(); return;
  }
  // M = فتح تبويب المدرب
  if (key.toLowerCase() === 'm' && !sessOpen) {
    switchTab('coach', document.getElementById('tab-btn-coach')); return;
  }

  // Language: L
  if (key.toLowerCase() === 'l' && !sessOpen) {
    cycleLang(); return;
  }

  // Sound: S
  if (key.toLowerCase() === 's' && !sessOpen) {
    openSoundSheet(); return;
  }

  // Help: ?
  if (key === '?' || key === '/') {
    showShortcutsHelp(); return;
  }

  // Fullscreen: F
  if (key.toLowerCase() === 'f') {
    toggleFullscreen(); return;
  }

  // AI coach: A
  if (key.toLowerCase() === 'a' && !sessOpen) {
    if (typeof openAICoach === 'function') openAICoach();
    return;
  }

  // Day navigation: Arrow keys (when not in session)
  if (!sessOpen) {
    // RTL: ArrowRight = previous day (يمين = السابق), ArrowLeft = next day (يسار = التالي)
    if (key === 'ArrowRight') {
      if (S.currentDay > 1) { S.currentDay--; saveState(); render(); }
      return;
    }
    if (key === 'ArrowLeft') {
      const maxDay = S.user?.programDays || 30;
      if (S.currentDay < maxDay) { S.currentDay++; saveState(); render(); }
      return;
    }
    // ArrowDown/Up: scroll through days sequentially
    if (key === 'ArrowDown') {
      const maxDay = S.user?.programDays || 30;
      if (S.currentDay < maxDay) { S.currentDay++; saveState(); render(); }
      return;
    }
    if (key === 'ArrowUp') {
      if (S.currentDay > 1) { S.currentDay--; saveState(); render(); }
      return;
    }
    // T = today (اليوم الحالي في البرنامج)
    if (key.toLowerCase() === 't') {
      const today = S.currentDay;
      selectDay(today);
      showMiniToast('📅 اليوم ' + today);
      return;
    }
    // D = mark day done
    if (key.toLowerCase() === 'd') { toggleDayDone(); return; }
    // C = mark exercise done (first unchecked)
    if (key.toLowerCase() === 'c') {
      const firstCheck = document.querySelector('.ex-check:not(.checked)');
      if (firstCheck) firstCheck.click();
      return;
    }
    // Enter = start guided session (TV remote OK button)
    if (key === 'Enter') { startGuidedSession(); return; }
    // Space = timer play/pause
    if (key === ' ' || code === 'Space') {
      e.preventDefault();
      timerToggle(); return;
    }
    // R = reset timer
    if (key.toLowerCase() === 'r') { timerReset(); return; }
  }

  // Session shortcuts
  if (sessOpen) {
    if (key === 'Escape') { confirmCloseSession(); return; }
    if (key === ' ' || code === 'Space') { e.preventDefault(); sessPause(); return; }
    if (key === 'ArrowRight' || key.toLowerCase() === 'p') { sessPrev(); return; }
    if (key === 'ArrowLeft' || key.toLowerCase() === 'n') { sessSkip(); return; }
    if (key === 'Enter') { sessMainAction(); return; }
  }

  // TV Remote color buttons (Hbb TV standard)
  // TV Remote color buttons (HbbTV standard VK codes)
  if (key === 'ColorF0Red'   || key === 'VK_RED')    { sessOpen ? sessPause() : startGuidedSession(); }
  if (key === 'ColorF1Green' || key === 'VK_GREEN')  { toggleDayDone(); }
  if (key === 'ColorF2Yellow'|| key === 'VK_YELLOW') { openActiveRest(); }
  if (key === 'ColorF3Blue'  || key === 'VK_BLUE')   { if(typeof openAICoach==='function') openAICoach(); }
  // Real TV remote keys available on most remotes:
  if (key === 'GoBack' || key === 'BrowserBack') { confirmCloseSession && sessOpen ? confirmCloseSession() : showMiniToast('اضغط ↑↓ لتغيير اليوم'); }
  if (key === 'HomePage' || key === 'BrowserHome') { cycleMode(); }
  // Also handle Play/Pause media keys common on smart TV remotes
  if (key === 'MediaPlayPause' || key === 'MediaPlay') { sessOpen ? sessPause() : startGuidedSession(); }
  if (key === 'MediaStop') { if(sessOpen && typeof confirmCloseSession==='function') confirmCloseSession(); }
});

// Show shortcuts hint on desktop/TV
function showShortcutHint() {
  if (window.innerWidth > 600) {
    showMiniToast('⌨️ اضغط ? لعرض الاختصارات');
  }
}

/* ══════ PHASE 2: EXERCISE EDITOR ══════ */
/* ══════ DAY EDITOR ══════ */

function getEffectiveSchedule(day) {
  // FIX#2: unified — always delegate to getDaySchedule which already
  // handles S.customSchedule and progressive overload correctly
  return getDaySchedule(day);
}

function openExEditor(exId, day) {
  const allEx = [...EXERCISES, ...(S.customExercises||[])];
  const ex = allEx.find(e=>e.id===exId);
  if (!ex) return;
  document.getElementById('ex-editor-id').value = exId;
  document.getElementById('ex-editor-day').value = day;
  document.getElementById('ex-editor-title').textContent = '✏️ ' + ex.nameAr;
  document.getElementById('ex-ed-nameAr').value = ex.nameAr;
  document.getElementById('ex-ed-nameEn').value = ex.nameEn || '';
  document.getElementById('ex-ed-icon').value = ex.icon || '💪';
  document.getElementById('ex-ed-muscles').value = ex.muscles || '';
  document.getElementById('ex-ed-sets').value = ex.sets;
  document.getElementById('ex-ed-reps').value = ex.reps;
  document.getElementById('ex-ed-type').value = ex.type || 'reps';
  document.getElementById('ex-ed-steps').value = (ex.steps||[]).join('\n');
  const restEl = document.getElementById('ex-ed-rest');
  if (restEl) restEl.value = (typeof ex.rest === 'number' && ex.rest > 0) ? ex.rest : 30;
  // Build "add from list" section
  // FIX-I: read from S.customSchedule first, fall back to getDaySchedule
  const sched = (S.customSchedule && S.customSchedule[day]) || getDaySchedule(day).exercises.map(e=>e.id);
  const available = allEx.filter(e => !sched.includes(e.id));
  document.getElementById('ex-add-from-list').innerHTML = available.map(e=>
    `<button onclick="addExToDay('${e.id}',${day})" style="padding:6px 12px;border-radius:20px;background:var(--card2);border:1px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;">${e.icon} ${e.nameAr}</button>`
  ).join('');
  document.getElementById('new-ex-form').style.display = 'none';
  document.getElementById('ex-editor-modal').classList.add('open');
}

function exEdTypeChange() {
  const type = document.getElementById('ex-ed-type')?.value || 'reps';
  const lbl = document.getElementById('ex-ed-reps-lbl');
  const inp = document.getElementById('ex-ed-reps');
  if (!lbl || !inp) return;
  const labels = {reps:'التكرار', timer:'المدة (ث)', distance:'المسافة (م)'};
  const placeholders = {reps:'10', timer:'30', distance:'200'};
  lbl.textContent = labels[type] || 'التكرار';
  inp.placeholder = placeholders[type] || '10';
}

function closeExEditor() {
  document.getElementById('ex-editor-modal').classList.remove('open');
  document.getElementById('new-ex-form').style.display = 'none';
}

/* ══════════════════════════════════════════
   ACTIVE REST DAY
══════════════════════════════════════════ */
let arIdx = 0;
let arTimerInterval = null;
let arRemain = 0;
let arTotal = 0;

function openActiveRest() {
  arIdx = 0;
  document.getElementById('active-rest-overlay').style.display = 'flex';
  arLoad();
}

function closeActiveRest() {
  clearInterval(arTimerInterval);
  document.getElementById('active-rest-overlay').style.display = 'none';
}

function arLoad() {
  clearInterval(arTimerInterval);
  const ex = STRETCH_EXERCISES[arIdx];
  const total = STRETCH_EXERCISES.length;
  document.getElementById('ar-icon').textContent = ex.icon;
  document.getElementById('ar-name').textContent = ex.nameAr;
  document.getElementById('ar-steps').innerHTML = ex.steps.map(s => '• ' + s).join('<br>');
  document.getElementById('ar-progress').textContent = (arIdx+1) + ' / ' + total;
  document.getElementById('ar-main-btn').textContent = arIdx === total-1 ? '✅ انتهى' : 'التالي ←';
  // Dots
  document.getElementById('ar-dots').innerHTML = STRETCH_EXERCISES.map((_,i) =>
    `<div style="width:${i===arIdx?20:8}px;height:8px;border-radius:4px;background:${i<=arIdx?'var(--gold)':'rgba(255,255,255,.15)'};transition:all .3s;"></div>`
  ).join('');
  arTotal = ex.dur;
  arRemain = ex.dur;
  arUpdateRing();
  // Beep
  playTone(660, 0.15, 'sine', 0.3);
  arTimerInterval = setInterval(() => {
    arRemain--;
    arUpdateRing();
    if (arRemain <= 0) {
      clearInterval(arTimerInterval);
      playTone(880, 0.2, 'sine', 0.4);
      if (arIdx < STRETCH_EXERCISES.length - 1) {
        setTimeout(() => { arIdx++; arLoad(); }, 800);
      } else {
        setTimeout(() => {
          closeActiveRest();
          showMiniToast('🧘 أحسنت! انتهت جلسة الراحة النشطة');
        }, 800);
      }
    }
  }, 1000);
}

function arUpdateRing() {
  document.getElementById('ar-timer-num').textContent = arRemain;
  const pct = arRemain / arTotal;
  const circ = 377;
  document.getElementById('ar-ring').style.strokeDashoffset = circ * (1 - pct);
  // Color transition: gold → red as time runs out
  const hue = Math.round(pct * 40); // 40=gold, 0=red
  document.getElementById('ar-ring').style.stroke = pct > 0.3 ? 'var(--gold)' : '#ef4444';
}

function arSkip() {
  if (arIdx >= STRETCH_EXERCISES.length - 1) {
    closeActiveRest();
    showMiniToast('🧘 أحسنت! انتهت جلسة الراحة النشطة');
    return;
  }
  arIdx++;
  arLoad();
}

function arPrev() {
  if (arIdx > 0) { arIdx--; arLoad(); }
}

/* ══════════════════════════════════════════
   SMART STATS
══════════════════════════════════════════ */
function renderTrainingLogSection() {
  const el = document.getElementById('training-history-list');
  if (!el) return;
  const log = Object.values(S.trainingLog || {}).sort((a,b) => b.day - a.day).slice(0, 14);
  if (!log.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--dim);font-size:13px;">أكمل تمريناً لترى سجلك هنا</div>';
    return;
  }
  el.innerHTML = log.map(entry => `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--card);border-radius:14px;border:1px solid var(--border);margin-bottom:8px;">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
          <div style="font-size:14px;font-weight:900;color:var(--night);line-height:1;">${entry.day}</div>
          <div style="font-size:8px;color:var(--night);opacity:.8;">يوم</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${(entry.exercises||[]).slice(0,3).join(' · ')}${entry.exCount > 3 ? ' ...' : ''}
          </div>
          <div style="font-size:11px;color:var(--dim);margin-top:3px;">${entry.date||''}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">
          <div style="font-size:12px;font-weight:700;color:var(--gold);">🔥 ${entry.calories||0} كالوري</div>
          <div style="font-size:11px;color:var(--dim);">⏱ ${entry.duration||0} دقيقة</div>
        </div>
      </div>`).join('');
}

function renderSmartStats() {
  const el = document.getElementById('smart-stats');
  if (!el) return;
  const log = Object.values(S.trainingLog || {}).sort((a,b) => a.day - b.day);
  if (log.length < 2) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--dim);font-size:13px;">أكمل 2 أيام على الأقل لرؤية الإحصاء</div>';
    return;
  }
  // Best streak
  const streak = S.streak || 0;
  // Completion rate
  const progDays = S.user?.programDays || 30;
  const rate = Math.round((S.completedDays.length / progDays) * 100);
  // Most frequent exercise
  const exCount = {};
  log.forEach(entry => (entry.exercises||[]).forEach(n => { exCount[n] = (exCount[n]||0)+1; }));
  const topEx = Object.entries(exCount).sort((a,b)=>b[1]-a[1])[0];
  // Weekly comparison — بالتقويم الحقيقي
  const nowTs = Date.now();
  const msWeek = 7 * 24 * 3600 * 1000;
  const thisWeek = log.filter(e => e.ts && (nowTs - e.ts) < msWeek).length;
  const lastWeek = log.filter(e => e.ts && (nowTs - e.ts) >= msWeek && (nowTs - e.ts) < 2 * msWeek).length;
  const weekTrend = thisWeek >= lastWeek ? '📈 تحسن' : '📉 تراجع';
  // Best day of week (from dates)
  const dayCount = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
  log.forEach(e => { if(e.ts) dayCount[new Date(e.ts).getDay()]++; });
  const DAY_NAMES = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const bestDayIdx = Object.entries(dayCount).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const bestDay = bestDayIdx !== undefined ? DAY_NAMES[bestDayIdx] : '—';
  // Average calories per session
  const avgCal = log.length ? Math.round(log.reduce((s,e)=>s+(e.calories||150),0)/log.length) : 0;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="background:var(--card);border-radius:14px;padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:var(--gold);">${rate}%</div>
        <div style="font-size:11px;color:var(--dim);margin-top:4px;">${window.T('smartStatsCompletion','معدل الإتمام')}</div>
      </div>
      <div style="background:var(--card);border-radius:14px;padding:14px;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:var(--gold);">${avgCal}</div>
        <div style="font-size:11px;color:var(--dim);margin-top:4px;">${window.T('smartStatsAvgCal','متوسط سعرة/جلسة')}</div>
      </div>
      <div style="background:var(--card);border-radius:14px;padding:14px;text-align:center;">
        <div style="font-size:14px;font-weight:900;color:var(--txt);">${topEx ? topEx[0] : '—'}</div>
        <div style="font-size:11px;color:var(--dim);margin-top:4px;">${window.T('smartStatsFav','تمرينك المفضل')}</div>
      </div>
      <div style="background:var(--card);border-radius:14px;padding:14px;text-align:center;">
        <div style="font-size:14px;font-weight:900;color:var(--txt);">${bestDay}</div>
        <div style="font-size:11px;color:var(--dim);margin-top:4px;">${window.T('smartStatsBestDay','أفضل يوم في الأسبوع')}</div>
      </div>
      <div style="background:var(--card);border-radius:14px;padding:14px;text-align:center;grid-column:1/-1;">
        <div style="font-size:14px;font-weight:700;color:var(--txt);">${weekTrend} ${window.T('smartStatsWeekTrend','مقارنة بالأسبوع الماضي')}</div>
        <div style="font-size:12px;color:var(--dim);margin-top:4px;">${window.T('smartStatsThisWeek','هذا الأسبوع')}: ${thisWeek} | ${window.T('smartStatsLastWeek','الأسبوع الماضي')}: ${lastWeek}</div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   HISTORY + SHARE + NOTIFICATIONS
══════════════════════════════════════════ */
function renderHistory() {
  // Unified with renderTrainingLogSection to avoid duplication
  renderTrainingLogSection();
}

function shareProgress() {
  const done = (S.completedDays||[]).length;
  const total = S.user?.programDays || 30;
  const pct = Math.round(done/total*100);
  const streak = S.streak || 0;
  const name = S.user?.name || 'بطل';
  const text = `💪 ${name} أكمل ${done} يوم من ${total} في AZEM (عزم)!
🔥 سلسلة ${streak} يوم متواصل
⚡ ${S.calories||0} سعرة محترقة
📊 التقدم: ${pct}%
${pct >= 50 ? '🏆 أكثر من النصف — استمر!' : '🚀 في البداية — لا تتوقف!'}`;
  if (navigator.share) {
    navigator.share({ title: 'AZEM (عزم)', text }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(text).then(()=> showMiniToast('✅ تم نسخ التقدم!'));
  }
}

// Notifications
let notifInterval = null;
function toggleNotifSwitch() {
  const toggle = document.getElementById('notif-toggle');
  const knob = document.getElementById('notif-toggle-knob');
  const sub = document.getElementById('notif-toggle-sub');
  const isOn = toggle.dataset.on === '1';
  if (isOn) {
    // Turn off
    toggle.dataset.on = '0';
    toggle.style.background = 'rgba(100,116,139,.3)';
    knob.style.transform = 'translateX(0)';
    if (sub) sub.textContent = 'اضغط لتفعيل التنبيهات';
    return;
  }
  // Turn on → request permission
  requestNotifPerm();
}
function _setNotifToggleOn() {
  const toggle = document.getElementById('notif-toggle');
  const knob = document.getElementById('notif-toggle-knob');
  const sub = document.getElementById('notif-toggle-sub');
  if (toggle) { toggle.dataset.on = '1'; toggle.style.background = 'var(--green,#22c55e)'; }
  if (knob) knob.style.transform = 'translateX(24px)';
  if (sub) sub.textContent = '✅ التذكير مفعّل';
}
function requestNotifPerm() {
  if (!('Notification' in window)) {
    showMiniToast('المتصفح لا يدعم الإشعارات'); return;
  }
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      showMiniToast('✅ سيصلك تذكير في وقت تدريبك');
      scheduleTrainingNotif();
      _setNotifToggleOn();
    } else {
      showMiniToast('⚠️ الإشعارات غير مسموحة');
    }
  });
}


function toggleNotifFromSettings() {
  const toggle = document.getElementById('settings-notif-toggle');
  const knob = document.getElementById('settings-notif-knob');
  const sub = document.getElementById('settings-notif-sub');
  const isOn = toggle?.dataset.on === '1';
  if (isOn) {
    if (toggle) { toggle.dataset.on = '0'; toggle.style.background = 'rgba(100,116,139,.3)'; }
    if (knob) knob.style.transform = 'translateX(0)';
    if (sub) sub.textContent = 'اضغط لتفعيل التنبيهات';
    return;
  }
  if (!('Notification' in window)) { showMiniToast('المتصفح لا يدعم الإشعارات'); return; }
  Notification.requestPermission().then(perm => {
    if (perm === 'granted') {
      if (toggle) { toggle.dataset.on = '1'; toggle.style.background = 'var(--green,#22c55e)'; }
      if (knob) knob.style.transform = 'translateX(24px)';
      if (sub) sub.textContent = '✅ التذكير مفعّل';
      scheduleTrainingNotif();
      showMiniToast('✅ سيصلك تذكير في وقت تدريبك');
    } else {
      showMiniToast('⚠️ الإشعارات غير مسموحة');
    }
  });
}
function _syncSettingsNotifToggle() {
  const toggle = document.getElementById('settings-notif-toggle');
  const knob = document.getElementById('settings-notif-knob');
  const sub = document.getElementById('settings-notif-sub');
  const granted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  if (toggle) { toggle.dataset.on = granted ? '1' : '0'; toggle.style.background = granted ? 'var(--green,#22c55e)' : 'rgba(100,116,139,.3)'; }
  if (knob) knob.style.transform = granted ? 'translateX(24px)' : 'translateX(0)';
  if (sub) sub.textContent = granted ? '✅ التذكير مفعّل' : 'اضغط لتفعيل التنبيهات';
}

function scheduleTrainingNotif() {
  // FIX#9: notify via SW postMessage so it works when app is closed
  const trainTime = S.user?.trainTime;
  if (trainTime && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_REMINDER',
      trainTime,
      name: S.user?.name || 'بطل',
      day: S.currentDay
    });
  }
  // Fallback: setInterval for when app is open in browser
  if (notifInterval) clearInterval(notifInterval);
  notifInterval = setInterval(() => {
    const t = S.user?.trainTime;
    if (!t || Notification.permission !== 'granted') return;
    const now = new Date();
    const [h, m] = t.split(':').map(Number);
    if (now.getHours() === h && now.getMinutes() === m) {
      new Notification('AZEM (عزم) 🔥', {
        body: `${S.user?.name||'بطل'}، وقت تدريبك! اليوم ${S.currentDay} في انتظارك 💪`,
        icon: './icon-192-2.png',
        tag: 'azem-reminder',   // prevents duplicate toasts
        renotify: false
      });
    }
  }, 60000);
}

// Auto-schedule if permission already granted
if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
  scheduleTrainingNotif();
  setTimeout(() => {
    const btn = document.getElementById('notif-btn');
    if (btn) { btn.textContent = '✅ التذكير مفعّل'; }
  }, 500);
}


/* ══════════════════════════════════════════
   ONBOARDING v2 — تسلسل جديد
══════════════════════════════════════════ */

// الخطوات: lang → auth → password-link → info → privacy → done
// navigation يدوي عبر obGoToStep
const OB_STEPS = ['lang','auth','password-link','info','privacy','done'];
let obCurrentStep = 'lang';

function showOnboarding() {
  // اذا كانت اللغة محفوظة مسبقا (المستخدم اختارها قبل تسجيل الدخول)
  // لا نعيد شاشة اللغة — نذهب مباشرة لـ auth
  const langAlreadySet = !!(S.lang && S.lang !== '');
  obCurrentStep = langAlreadySet ? 'auth' : 'lang';
  document.getElementById('onboarding').style.display = 'flex';
  renderObStep();
}

function obGoToStep(stepId) {
  obCurrentStep = stepId;
  const obEl = document.getElementById('onboarding');
  if (obEl && obEl.style.display === 'none') obEl.style.display = 'flex';
  renderObStep();
}

function obFinish() {
  S.onboardingDone = true;
  S.privacyAccepted = window._privacyAccepted !== false;
  window._justFinishedOnboarding = true;
  saveState();
  if (window._fbUser && typeof sendToSheets === 'function') {
    sendToSheets(window._fbUser, { privacyAccepted: S.privacyAccepted });
  }
  document.getElementById('onboarding').style.display = 'none';
  // احفظ onboardingDone في Firestore — window.pushToCloud مكشوف من firebase.js
  if (typeof window.pushToCloud === 'function') window.pushToCloud();
  render();
  setTimeout(() => { window._justFinishedOnboarding = false; startTutorial(); }, 800);
}

function obSelectLang(code) {
  currentLang = code;
  S.lang = code;
  // تطبيق اللغة بدون render كامل — الـ Onboarding لم ينتهِ بعد
  document.documentElement.lang = code;
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  document.body.style.fontFamily = code === 'ar' ? "'Cairo','Tajawal',sans-serif" : "'Inter',sans-serif";
  saveState();
  obGoToStep('auth');
}

function obNext() {
  if (obCurrentStep === 'info') {
    const wEl  = document.getElementById('ob-weight-inp');
    const hEl  = document.getElementById('ob-height-inp');
    const aEl  = document.getElementById('ob-age-inp');
    const nEl  = document.getElementById('ob-name-inp2');
    const phEl = document.getElementById('ob-phone-inp');
    if (wEl  && wEl.value)  S.user.weight = parseFloat(wEl.value)  || 0;
    if (hEl  && hEl.value)  S.user.height = parseFloat(hEl.value)  || 0;
    if (aEl  && aEl.value)  S.user.age    = parseFloat(aEl.value)  || 0;
    if (nEl  && nEl.value)  S.user.name   = nEl.value.trim();
    if (phEl && phEl.value.trim()) S.user.phone = phEl.value.trim();
    if (!S.user.goal)   S.user.goal   = 'fitness';
    if (!S.user.gender) S.user.gender = 'male';
    saveState();
    obGoToStep('privacy');
    return;
  }
  if (obCurrentStep === 'privacy') {
    obFinish();
    return;
  }
  obFinish();
}

function obSetGender(g) {
  S.user.gender = g;
  const mBtn = document.getElementById('ob-gender-male');
  const fBtn = document.getElementById('ob-gender-female');
  if (mBtn) {
    mBtn.style.background = g==='male' ? 'rgba(99,102,241,.2)' : 'var(--card)';
    mBtn.style.borderColor = g==='male' ? '#6366f1' : 'var(--border)';
  }
  if (fBtn) {
    fBtn.style.background = g==='female' ? 'rgba(236,72,153,.2)' : 'var(--card)';
    fBtn.style.borderColor = g==='female' ? '#ec4899' : 'var(--border)';
  }
}

// إظهار/إخفاء حقل الاسم حسب وضع (تسجيل/دخول)
// لا تستدعي auth فوراً — فقط أظهر/أخفِ الحقول المناسبة
function obSetAuthMode(mode) {
  window._obAuthMode = mode;
  const nameEl    = document.getElementById('ob-name-inp');
  const confirmEl = document.getElementById('ob-confirm-btn');
  const signupBtn = document.getElementById('ob-email-btn');
  const loginBtn  = document.getElementById('ob-login-btn');

  if (mode === 'signup') {
    // إنشاء حساب: أظهر حقل الاسم وزر التأكيد
    if (nameEl)    nameEl.style.display    = 'block';
    if (confirmEl) confirmEl.style.display = 'block';
    // تمييز الزر النشط
    if (signupBtn) { signupBtn.style.opacity = '1'; signupBtn.style.background = 'linear-gradient(135deg,var(--gl),var(--gd))'; }
    if (loginBtn)  { loginBtn.style.opacity  = '0.5'; }
  } else {
    // دخول: أخفِ حقل الاسم وأظهر زر التأكيد للدخول
    if (nameEl)    nameEl.style.display    = 'none';
    if (confirmEl) {
      confirmEl.style.display = 'block';
      confirmEl.textContent = currentLang==='en' ? '✅ Login' : currentLang==='fr' ? '✅ Connexion' : '✅ دخول';
    }
    if (signupBtn) { signupBtn.style.opacity = '0.5'; signupBtn.style.background = 'var(--card)'; }
    if (loginBtn)  { loginBtn.style.opacity = '1'; loginBtn.style.background = 'var(--gold)'; loginBtn.style.color = 'var(--night)'; }
  }
}

function obSkip() {
  obGoToStep('info');
}

// دالة قديمة للتوافق
function obChoose(val) {
  const stepFieldMap = {goal:'goal', days:'programDays'};
  // للاستخدام من info step
  S.user.goal = val;
  renderObStep();
}

function renderObStep() {
  const _isAr = (currentLang||S.lang||'ar') === 'ar';
  const _isEn = (currentLang||S.lang||'ar') === 'en';
  const _T3   = (ar,en,fr) => _isAr?ar:_isEn?en:fr;
  const step  = obCurrentStep;

  // footer visibility
  const footerEl = document.getElementById('ob-footer');
  const nextBtn  = document.getElementById('ob-next-btn');
  const skipBtn  = document.querySelector('#ob-footer button:not(#ob-next-btn)');
  if (footerEl) footerEl.style.display = (step === 'lang' || step === 'auth' || step === 'password-link' || step === 'done') ? 'none' : 'flex';
  // Hide skip button on info step (obSkip goes to info, not useful there)
  const skipBtnEl = footerEl?.querySelector('button:not(#ob-next-btn)');
  if (skipBtnEl) skipBtnEl.style.display = step === 'info' ? 'none' : '';
  if (nextBtn)  nextBtn.textContent    = step === 'info' ? _T3('🚀 ابدأ الرحلة','🚀 Start','🚀 Commencer') : _T3('التالي ←','Next →','Suivant →');

  // dots
  const visibleSteps = ['auth','info'];
  const dotsEl = document.getElementById('ob-dots');
  if (dotsEl) {
    dotsEl.innerHTML = visibleSteps.map(s => {
      const active = s === step;
      const done   = visibleSteps.indexOf(s) < visibleSteps.indexOf(step);
      return `<div style="width:${active?20:8}px;height:8px;border-radius:4px;background:${done||active?'var(--gold)':'rgba(255,255,255,.15)'};transition:all .3s;"></div>`;
    }).join('');
  }

  let html = '';

  // ── Lang ─────────────────────────────────
  if (step === 'lang') {
    const langs = [
      { code:'ar', flag:'🇩🇿', name:'العربية' },
      { code:'en', flag:'🇺🇸', name:'English'  },
      { code:'fr', flag:'🇫🇷', name:'Français' },
    ];
    html = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;">
      <div style="font-size:70px;margin-bottom:16px;animation:iconPulse 2s ease-in-out infinite;">⚡</div>
      <div style="font-size:30px;font-weight:900;color:var(--gold);margin-bottom:4px;">AZEM</div>
      <div style="font-size:13px;color:var(--dim);margin-bottom:36px;text-align:center;">عزم · Determination · Détermination</div>
      <div style="display:flex;flex-direction:column;gap:14px;width:100%;max-width:320px;">
        ${langs.map(l => {
          const active = (S.lang || 'ar') === l.code;
          return `<button onclick="obSelectLang('${l.code}')" style="display:flex;align-items:center;gap:16px;padding:20px 22px;border-radius:18px;background:${active?'rgba(212,168,67,.15)':'var(--card)'};border:2px solid ${active?'var(--gold)':'var(--border)'};cursor:pointer;width:100%;transition:all .2s;-webkit-appearance:none;appearance:none;">
            <span style="font-size:34px;">${l.flag}</span>
            <span style="font-size:18px;font-weight:900;color:${active?'var(--gold)':'var(--txt)'};">${l.name}</span>
            ${active ? '<span style="margin-right:auto;color:var(--gold);font-size:20px;">✓</span>' : ''}
          </button>`;
        }).join('')}
      </div>
    </div>`;

  // ── Auth ─────────────────────────────────
  } else if (step === 'auth') {
    html = `<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:32px 24px;gap:16px;">
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:44px;margin-bottom:12px;">🔐</div>
        <div style="font-size:22px;font-weight:900;color:var(--txt);margin-bottom:6px;">${_T3('سجّل دخولك','Sign In','Connexion')}</div>
        <div style="font-size:12px;color:var(--dim);">${_T3('لحفظ بياناتك وتزامنها على أجهزتك','Save & sync your data across devices','Sauvegarder et synchroniser vos données')}</div>
      </div>

      <!-- Google -->
      <button id="ob-google-btn" onclick="obFirebaseGoogleSignIn()" style="width:100%;padding:16px;border-radius:16px;background:rgba(66,133,244,.12);border:2px solid rgba(66,133,244,.4);color:#4285f4;font-family:'Cairo',sans-serif;font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;-webkit-appearance:none;appearance:none;">
        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></svg>
        ${_T3('تسجيل الدخول بـ Google','Continue with Google','Continuer avec Google')}
      </button>

      <!-- Divider -->
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-size:11px;color:var(--dim);">${_T3('أو','or','ou')}</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>

      <!-- Email + Password -->
      <div id="ob-auth-err" style="display:none;padding:8px 12px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;font-size:12px;text-align:center;"></div>
      <input id="ob-email-inp" type="email" placeholder="${_T3('الإيميل','Email','E-mail')}"
        style="width:100%;padding:14px 16px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;box-sizing:border-box;outline:none;direction:ltr;text-align:left;"
        oninput="document.getElementById('ob-auth-err').style.display='none'">
      <input id="ob-pass-inp" type="password" placeholder="${_T3('كلمة المرور (6 أحرف+)','Password (6+ chars)','Mot de passe (6+ car.)')}"
        style="width:100%;padding:14px 16px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;box-sizing:border-box;outline:none;direction:ltr;text-align:left;"
        oninput="document.getElementById('ob-auth-err').style.display='none'">
      <!-- حقل الاسم — يظهر فقط عند إنشاء الحساب -->
      <input id="ob-name-inp" type="text" placeholder="${_T3('اسمك (للتسجيل فقط)','Your name (signup only)','Votre nom (inscription)')}"
        style="width:100%;padding:14px 16px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;box-sizing:border-box;outline:none;display:none;">

      <!-- Buttons -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button id="ob-email-btn" onclick="obSetAuthMode('signup')" style="padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--gl),var(--gd));color:var(--night);font-family:'Cairo',sans-serif;font-size:14px;font-weight:900;cursor:pointer;border:none;-webkit-appearance:none;appearance:none;">
          ${_T3('إنشاء حساب','Sign Up','S\'inscrire')}
        </button>
        <button id="ob-login-btn" onclick="obSetAuthMode('login')" style="padding:14px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;-webkit-appearance:none;appearance:none;">
          ${_T3('دخول','Login','Connexion')}
        </button>
      </div>
      <!-- زر التأكيد — يظهر فقط بعد اختيار "إنشاء حساب" -->
      <button id="ob-confirm-btn" onclick="obFirebaseEmailAuth(window._obAuthMode||'signup')"
        style="display:none;width:100%;padding:15px;border-radius:14px;background:linear-gradient(135deg,var(--gl),var(--gd));color:var(--night);font-family:'Cairo',sans-serif;font-size:15px;font-weight:900;cursor:pointer;border:none;-webkit-appearance:none;appearance:none;">
        ${_T3('✅ تأكيد التسجيل','✅ Confirm Sign Up','✅ Confirmer')}
      </button>

      <!-- Skip -->
      <button onclick="obGoToStep('info')" style="width:100%;padding:12px;border-radius:14px;background:transparent;border:1px solid var(--border);color:var(--dim);font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;-webkit-appearance:none;appearance:none;">
        ${_T3('تخطي — استمر بدون حساب','Skip — continue without account','Passer — continuer sans compte')}
      </button>
    </div>`;

  // ── Password Link (بعد Google) ────────────
  } else if (step === 'password-link') {
    html = `<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:32px 24px;gap:14px;">
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:44px;margin-bottom:10px;">🔑</div>
        <div style="font-size:20px;font-weight:900;color:var(--txt);margin-bottom:6px;">${_T3('أضف كلمة مرور','Add a Password','Ajouter un mot de passe')}</div>
        <div style="font-size:12px;color:var(--dim);line-height:1.7;">${_T3('يمكنك الدخول بإيميلك وكلمة المرور\nحتى بدون Google','Enter with email & password\neven without Google','Connectez-vous avec email & mot de passe\nsans Google')}</div>
      </div>
      <div id="ob-link-err" style="display:none;padding:8px 12px;border-radius:10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;font-size:12px;text-align:center;"></div>
      <input id="ob-link-pass-inp" type="password" placeholder="${_T3('كلمة المرور الجديدة','New password','Nouveau mot de passe')}"
        style="width:100%;padding:14px 16px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;box-sizing:border-box;outline:none;direction:ltr;text-align:left;">
      <input id="ob-link-pass2-inp" type="password" placeholder="${_T3('تأكيد كلمة المرور','Confirm password','Confirmer le mot de passe')}"
        style="width:100%;padding:14px 16px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;box-sizing:border-box;outline:none;direction:ltr;text-align:left;">
      <button id="ob-link-btn" onclick="obLinkPassword()" style="width:100%;padding:16px;border-radius:14px;background:linear-gradient(135deg,var(--gl),var(--gd));color:var(--night);font-family:'Cairo',sans-serif;font-size:15px;font-weight:900;cursor:pointer;border:none;-webkit-appearance:none;appearance:none;">
        ${_T3('إضافة كلمة المرور','Add Password','Ajouter le mot de passe')}
      </button>
    </div>`;

  // ── Info (الوزن + الطول + الهدف) ──────────
  } else if (step === 'info') {
    const hasAccount = !!(window._fbUid || window._fbUser);
    const goalOptions = [
      {val:'burn',    icon:'🔥', label:_T3('حرق الدهون','Burn Fat','Brûler les graisses')},
      {val:'muscle',  icon:'💪', label:_T3('بناء العضلات','Build Muscle','Musculation')},
      {val:'fitness', icon:'🏃', label:_T3('تحسين اللياقة','Improve Fitness','Améliorer la forme')},
      {val:'health',  icon:'❤️', label:_T3('الصحة العامة','General Health','Santé générale')},
    ];
    html = `<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:32px 24px 100px;gap:20px;">
      <div style="text-align:center;">
        <div style="font-size:40px;margin-bottom:10px;">📋</div>
        <div style="font-size:22px;font-weight:900;color:var(--txt);">${_T3('معلوماتك الأساسية','Your Info','Vos informations')}</div>
      </div>

      <!-- حقل الاسم — يظهر فقط للمستخدمين بدون حساب -->
      ${!hasAccount ? `
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--dim);margin-bottom:8px;">${_T3('اسمك','Your name','Votre nom')}</div>
        <input id="ob-name-inp2" type="text" value="${S.user.name||''}" placeholder="${_T3('مثال: أحمد','e.g. Ahmed','ex: Ahmed')}"
          style="width:100%;padding:14px 16px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:15px;box-sizing:border-box;outline:none;text-align:center;">
      </div>` : ''}

      <!-- العمر والجنس -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--dim);margin-bottom:8px;text-align:center;">${_T3('العمر','Age','Âge')}</div>
          <input id="ob-age-inp" type="number" value="${S.user.age||''}" placeholder="25" min="10" max="99"
            style="width:100%;padding:16px;border-radius:14px;background:var(--card);border:2px solid rgba(99,102,241,.5);color:var(--txt);font-family:'Cairo',sans-serif;font-size:20px;font-weight:700;box-sizing:border-box;outline:none;text-align:center;">
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--dim);margin-bottom:8px;text-align:center;">${_T3('الجنس','Gender','Genre')}</div>
          <div style="display:flex;gap:8px;height:56px;">
            <button id="ob-gender-male" onclick="obSetGender('male')"
              style="flex:1;border-radius:14px;background:${(S.user.gender||'male')==='male'?'rgba(99,102,241,.2)':'var(--card)'};border:2px solid ${(S.user.gender||'male')==='male'?'#6366f1':'var(--border)'};color:var(--txt);font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;-webkit-appearance:none;appearance:none;">
              👨 ${_T3('ذكر','Male','Homme')}
            </button>
            <button id="ob-gender-female" onclick="obSetGender('female')"
              style="flex:1;border-radius:14px;background:${S.user.gender==='female'?'rgba(236,72,153,.2)':'var(--card)'};border:2px solid ${S.user.gender==='female'?'#ec4899':'var(--border)'};color:var(--txt);font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;-webkit-appearance:none;appearance:none;">
              👩 ${_T3('أنثى','Female','Femme')}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div style="font-size:13px;font-weight:700;color:var(--dim);margin-bottom:8px;">${_T3('رقم الهاتف (اختياري)','Phone number (optional)','Numéro de téléphone (optionnel)')}</div>
        <input id="ob-phone-inp" type="tel" value="${S.user.phone||''}" placeholder="${_T3('+213xxxxxxxxx','+213xxxxxxxxx','+213xxxxxxxxx')}"
          style="width:100%;padding:14px 16px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:15px;box-sizing:border-box;outline:none;text-align:center;direction:ltr;">
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--dim);margin-bottom:8px;text-align:center;">${_T3('الوزن (كغ)','Weight (kg)','Poids (kg)')}</div>
          <input id="ob-weight-inp" type="number" value="${S.user.weight||''}" placeholder="74"
            style="width:100%;padding:16px;border-radius:14px;background:var(--card);border:2px solid var(--gold);color:var(--txt);font-family:'Cairo',sans-serif;font-size:20px;font-weight:700;box-sizing:border-box;outline:none;text-align:center;">
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--dim);margin-bottom:8px;text-align:center;">${_T3('الطول (سم)','Height (cm)','Taille (cm)')}</div>
          <input id="ob-height-inp" type="number" value="${S.user.height||''}" placeholder="175"
            style="width:100%;padding:16px;border-radius:14px;background:var(--card);border:2px solid var(--gold);color:var(--txt);font-family:'Cairo',sans-serif;font-size:20px;font-weight:700;box-sizing:border-box;outline:none;text-align:center;">
        </div>
      </div>

      <div>
        <div style="font-size:13px;font-weight:700;color:var(--dim);margin-bottom:12px;text-align:center;">${_T3('ما هدفك؟','Your goal?','Votre objectif?')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;" id="ob-goal-grid">
          ${goalOptions.map(o => `
            <button onclick="S.user.goal='${o.val}';document.querySelectorAll('#ob-goal-grid button').forEach(b=>b.style.borderColor='var(--border)');this.style.borderColor='var(--gold)';this.style.background='rgba(212,168,67,.15)';"
              style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 12px;border-radius:16px;background:${S.user.goal===o.val?'rgba(212,168,67,.15)':'var(--card)'};border:2px solid ${S.user.goal===o.val?'var(--gold)':'var(--border)'};cursor:pointer;transition:all .2s;-webkit-appearance:none;appearance:none;">
              <span style="font-size:30px;">${o.icon}</span>
              <span style="font-size:12px;font-weight:700;color:var(--txt);">${o.label}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
    if (footerEl) footerEl.style.display = 'flex';

  // ── Privacy Policy ──────────────────────
  } else if (step === 'privacy') {
    html = `<div style="min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:32px 24px 100px;gap:18px;">
      <div style="text-align:center;">
        <div style="font-size:44px;margin-bottom:10px;">🔒</div>
        <div style="font-size:20px;font-weight:900;color:var(--txt);margin-bottom:6px;">${_T3('سياسة الخصوصية','Privacy Policy','Politique de confidentialité')}</div>
        <div style="font-size:12px;color:var(--dim);line-height:1.8;">${_T3('نحن نهتم بخصوصيتك. اقرأ ما نجمعه.','We care about your privacy. Read what we collect.','Nous respectons votre vie privée.')}</div>
      </div>
      <div style="background:var(--card);border-radius:16px;padding:16px;border:1px solid var(--border);font-size:12px;color:var(--dim);line-height:1.9;max-height:280px;overflow-y:auto;">
        <div style="font-weight:800;color:var(--txt);margin-bottom:8px;">📋 ${_T3('ما نجمعه','What we collect','Ce que nous collectons')}</div>
        • ${_T3('الاسم والجنس والعمر والطول والوزن','Name, gender, age, height, weight','Nom, genre, âge, taille, poids')}<br>
        • ${_T3('رقم الهاتف (اختياري)','Phone number (optional)','Numéro de téléphone (optionnel)')}<br>
        • ${_T3('بيانات التدريب والتقدم','Training and progress data','Données d\'entraînement')}<br>
        • ${_T3('عنوان IP والموقع الجغرافي التقريبي','IP address and approximate location','Adresse IP et localisation approximative')}<br><br>
        <div style="font-weight:800;color:var(--txt);margin-bottom:8px;">🎯 ${_T3('لماذا نجمعها','Why we collect it','Pourquoi nous les collectons')}</div>
        • ${_T3('لتخصيص برنامجك وحساب السعرات','To personalize your program and calculate calories','Pour personnaliser votre programme')}<br>
        • ${_T3('لتحسين التطبيق وتطويره','To improve and develop the app','Pour améliorer l\'application')}<br><br>
        <div style="font-weight:800;color:var(--txt);margin-bottom:8px;">🔐 ${_T3('حقوقك','Your rights','Vos droits')}</div>
        • ${_T3('يمكنك حذف بياناتك في أي وقت من الإعدادات','You can delete your data anytime from Settings','Vous pouvez supprimer vos données depuis les Paramètres')}<br>
        • ${_T3('بياناتك لا تُباع لأطراف ثالثة','Your data is never sold to third parties','Vos données ne sont jamais vendues')}<br>
        • ${_T3('للتواصل: azem.chihani@gmail.com','Contact: azem.chihani@gmail.com','Contact: azem.chihani@gmail.com')}<br>
      </div>
      <button onclick="window._privacyAccepted=true;obNext();"
        style="width:100%;padding:16px;border-radius:14px;background:linear-gradient(135deg,var(--gl),var(--gd));color:var(--night);font-family:'Cairo',sans-serif;font-size:15px;font-weight:900;cursor:pointer;border:none;-webkit-appearance:none;appearance:none;">
        ✅ ${_T3('أوافق وأكمل','I Agree & Continue','J\'accepte et continue')}
      </button>
      <button onclick="window._privacyAccepted=false;obNext();"
        style="width:100%;padding:14px;border-radius:14px;background:transparent;border:1px solid var(--border);color:var(--dim);font-family:'Cairo',sans-serif;font-size:13px;cursor:pointer;-webkit-appearance:none;appearance:none;">
        ${_T3('أرفض (بعض الميزات قد تتأثر)','Decline (some features may be limited)','Refuser (certaines fonctionnalités limitées)')}
      </button>
    </div>`;
  }

  // ✅ كتابة المحتوى في DOM
  const stepsEl = document.getElementById('ob-steps');
  if (stepsEl) stepsEl.innerHTML = html;
}

// دالة للتوافق مع الكود القديم
function obInstallNow() {}
function obSaveApiKey() {
  const val = (document.getElementById('ob-apikey-inp')?.value||'').trim();
  if (val.startsWith('gsk_')) { S.apiKey = val; saveState(); showMiniToast('✅ تم حفظ المفتاح'); }
}
function obRequestNotif() { requestNotifPerm(); }
function obRefreshInstallStep() {}
let obStep = 0; // للتوافق

