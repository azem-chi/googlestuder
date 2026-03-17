/* ══════ STATE ══════ */
/* ══════ SHARED API KEY — ضع مفتاح Groq المشترك هنا ══════ */
/* ضع مفتاح Groq المشترك هنا — سيُستخدم لجميع المستخدمين */
/* مثال: const SHARED_GROQ_KEY = ''; */
const SHARED_GROQ_KEY = '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';

let S = {
  currentDay:1, completedDays:[], calories:0, streak:0, lang:'',
  theme:'default', mode:'mobile',
  startDate: new Date().toISOString().split('T')[0],
  customImages:{}, fabThemePos:{top:100,right:16},
  bodyMeasurements:{}, ropeJumps:0, ropeMeters:0, ropeMins:0, ropeSessions:0,
  weeklyData:{}, completedExercises:{}, unlockedBadges:[],
  soundOn:true, tickOn:true, volume:80, ttsOn:true,
  tabata:{work:20,rest:10,rounds:8},
  customSchedule:{},
  nutritionLog:{}, // يوميات التغذية: { 'YYYY-MM-DD': { entries:[...] } }
  onboardingDone: false,
  user: { name:'', weight:0, height:0, age:0, gender:'', goal:'burn', trainTime:'18:00', programDays:30, program:'standard', startDate: new Date().toISOString().split('T')[0] },
  trainingLog: {},
  coachHistory: []
};
function loadState(){try{
  // Migrate from old fitpulse_S key if exists
  const old=localStorage.getItem('fitpulse_S');
  if(old){localStorage.setItem('azem_S',old);localStorage.removeItem('fitpulse_S');}
  const r=localStorage.getItem('azem_S');
  if(r){const p=JSON.parse(r);S={...S,...p};
    if(S.mode==='tv') S.mode='mobile'; // migrate: tv mode removed
  }
}catch(e){}}
function saveState(){
  try {
    localStorage.setItem('azem_S', JSON.stringify(S));
  } catch(e) {
    // FIX#4: QuotaExceededError — strip heavy data and retry
    try {
      const slim = JSON.parse(JSON.stringify(S));
      // 1. Strip base64 images from coach history
      if (slim.coachHistory) {
        slim.coachHistory = slim.coachHistory.map(m => {
          if (Array.isArray(m.content)) {
            return { ...m, content: m.content
              .filter(p => p.type !== 'image_url')
              .concat([{type:'text', text:'[صورة محذوفة لتوفير مساحة]'}])
            };
          }
          return m;
        });
      }
      // 2. Keep only last 10 coach messages
      if (slim.coachHistory && slim.coachHistory.length > 20) {
        slim.coachHistory = slim.coachHistory.slice(-20);
      }
      // 3. Strip large custom images (>50KB)
      if (slim.customImages) {
        Object.keys(slim.customImages).forEach(k => {
          if (slim.customImages[k]?.length > 400000) delete slim.customImages[k]; // ~300KB
        });
      }
      localStorage.setItem('azem_S', JSON.stringify(slim));
      Object.assign(S, slim);
      showMiniToast('⚠️ مساحة ممتلئة — حُذفت بعض الصور والمحادثات القديمة تلقائياً.');
    } catch(e2) {
      showMiniToast('❌ التخزين ممتلئ تماماً — يرجى مسح بيانات المتصفح.');
    }
  }
}
loadState();

/* ══════ EXERCISES ══════ */
// GIF helper - inline data
// جدول ترجمة من IDs التمارين إلى مفاتيح gifs.js
const GIF_KEY_MAP = {
  rope:     'jumprope',
  burpee:   'burpee',
  highknee: 'highknees',
  sqjump:   'squat',
  starjump: 'jumpingjack',
  climber:  'mountainclimber',
  boxing:   'shadowbox',
  plank:    'plank',
  crunch:   'crunch',
  legrise:  'crunch',
  bicycle:  'oblique',
  russian:  'russian',
  hollow:   'plank',
  pushup:   'pushup',
  squat:    'squat',
  chair:    'dip',
  neck:     'rest',
  shoulder: 'rest',
  chest:    'pushup',
  hamstring:'lunge',
  quad:     'squat',
  hip:      'glute',
  spine:    'superman',
  calf:         'wallsit',
  pike_push:    'pushup',
  side_plank:   'plank',
  jump_lunge:   'lunge',
  diamond:      'pushup',
  bottle_curl:  'curl',
  bottle_press: 'pushup',
  bottle_row:   'row',
  lateral_raise:'rest',
};
function getExGif(exId) {
  let src = window.EXERCISE_GIFS;
  if (!src || !Object.keys(src).length) {
    src = (typeof GIFS!=='undefined'&&Object.keys(GIFS||{}).length) ? GIFS
        : (typeof EXERCISE_GIFS!=='undefined'&&Object.keys(EXERCISE_GIFS||{}).length) ? EXERCISE_GIFS
        : (typeof GIF_DATA!=='undefined') ? GIF_DATA : null;
    if (src) window.EXERCISE_GIFS = src;
  }
  if (!src || !Object.keys(src).length) return null;
  const key = GIF_KEY_MAP[exId] || exId;
  return src[key] || src[exId] || null;
}
function gifsLoaded() {
  return window.EXERCISE_GIFS && Object.keys(window.EXERCISE_GIFS).length > 0;
}

const EXERCISES = [
  {id:'rope',    nameAr:'نط الحبل',      nameEn:'Jump Rope',        icon:'🪢',color:'#f5c518',muscles:'الساقان، القلب',            type:'timer',sets:3,reps:60, repsLabel:'ثانية',rest:30,steps:['أمسك طرفي الحبل بكلتا يديك','دوّر الحبل من المعصمين','اقفز بكلتا القدمين معاً','حافظ على الظهر مستقيماً','ابدأ ببطء ثم زِد السرعة']},
  {id:'burpee',  nameAr:'بيربيز',        nameEn:'Burpees',          icon:'🔥',color:'#ff4500',muscles:'الجسم كاملاً',             type:'reps',sets:3,reps:10, rest:45,steps:['قف منتصباً','انحنِ وضع يديك على الأرض','اقفز للوضع الانبطاحي','نفّذ ضغطة واحدة','اقفز للأعلى مع رفع الذراعين']},
  {id:'highknee',nameAr:'رفع الركبة',    nameEn:'High Knees',       icon:'🦵',color:'#ff8c00',muscles:'الفخذ، القلب',             type:'timer',sets:3,reps:40, repsLabel:'ثانية',rest:30,steps:['قف منتصباً','ارفع ركبتك اليسرى لمستوى الخصر','بدّل بسرعة مع اليمنى','حرك ذراعيك بشكل معاكس','إيقاع سريع ومنتظم']},
  {id:'sqjump',  nameAr:'قرفصاء قفز',   nameEn:'Jump Squat',       icon:'⬆️',color:'#ffd700',muscles:'الفخذ، الأرداف',           type:'reps',sets:3,reps:15, rest:45,steps:['قف بعرض الكتفين','انزل في القرفصاء','اندفع للأعلى بقوة','هبوط ناعم على مشط القدم','انزل مباشرة للتالية']},
  {id:'starjump',nameAr:'قفز النجمة',    nameEn:'Star Jump',        icon:'⭐',color:'#00b4d8',muscles:'الجسم كاملاً',             type:'reps',sets:3,reps:20, rest:30,steps:['قف بأقدام متلاصقة','اقفز وافرد ساقيك ويديك','عُد للوضع الأول','ركبتان مرنتان عند الهبوط','إيقاع منتظم']},
  {id:'climber', nameAr:'متسلق الجبل',  nameEn:'Mountain Climbers',icon:'⛰️',color:'#4ade80',muscles:'القلب، البطن، الكتفان',     type:'timer',sets:3,reps:40, repsLabel:'ثانية',rest:30,steps:['وضع الضغط','جسمك خط مستقيم','اشحن ركبتك اليسرى للصدر','بدّل بسرعة','إيقاع سريع']},
  {id:'boxing',  nameAr:'ملاكمة هوائية',nameEn:'Shadow Boxing',    icon:'🥊',color:'#a855f7',muscles:'الذراعان، القلب، الكتفان', type:'timer',sets:3,reps:60, repsLabel:'ثانية',rest:45,steps:['وضع الحارس','لكمات مستقيمة سريعة','تنوع بين العلوية والسفلية','تحرك للأمام والخلف','أخرج كل طاقتك']},
  {id:'plank',   nameAr:'البلانك',       nameEn:'Plank Hold',       icon:'🧘',color:'#06b6d4',muscles:'البطن، الظهر، الكتفان',    type:'timer',sets:3,reps:45, repsLabel:'ثانية',rest:30,steps:['ارتفع على الساعدين','ساعدان موازيان تحت الكتفين','جسمك خط مستقيم','اضغط البطن للداخل','تنفس بانتظام']},
  {id:'crunch',  nameAr:'الكرنش',        nameEn:'Crunches',         icon:'💪',color:'#f59e0b',muscles:'عضلة البطن الأمامية',      type:'reps',sets:3,reps:20, rest:30,steps:['استلقِ واثنِ ركبتيك','يداك خلف رأسك بخفة','ارفع كتفيك بعضلات البطن','توقف لحظة عند القمة','الزفير عند الرفع']},
  {id:'legrise', nameAr:'رفع الساقين',  nameEn:'Leg Raises',       icon:'🦿',color:'#e11d48',muscles:'البطن السفلي، الحوض',      type:'reps',sets:3,reps:15, rest:30,steps:['استلقِ على الظهر','يداك تحت الأرداف','ارفع ساقيك حتى 90 درجة','انزلهما ببطء','الظهر يلاصق الأرض']},
  {id:'bicycle', nameAr:'كرنش الدراجة', nameEn:'Bicycle Crunch',   icon:'🚲',color:'#0ea5e9',muscles:'البطن الجانبي، الريكتوس',  type:'reps',sets:3,reps:20, rest:30,steps:['استلقِ ويداك خلف الرأس','ارفع ركبتيك 90 درجة','لمس كوع اليسار بركبة اليمين','تناوب مستمر','لا تشد الرقبة']},
  {id:'russian', nameAr:'اللف الروسي',  nameEn:'Russian Twist',    icon:'🌀',color:'#8b5cf6',muscles:'البطن الجانبي، الخصر',     type:'reps',sets:3,reps:20, rest:30,steps:['اجلس بزاوية 45 درجة','ارفع قدميك قليلاً','دوّر الجذع يساراً ثم يميناً','الحركة من الخصر','ضم يديك أمامك']},
  {id:'hollow',  nameAr:'هولو هولد',    nameEn:'Hollow Hold',      icon:'🎯',color:'#ec4899',muscles:'البطن الكامل، الكور',      type:'timer',sets:3,reps:30, repsLabel:'ثانية',rest:30,steps:['استلقِ ويداك فوق رأسك','ارفع كتفيك وساقيك معاً','شكل قارب مقعّر','اضغط البطن','تنفس بانتظام']},
  {id:'pushup',  nameAr:'الضغط',         nameEn:'Push-Ups',         icon:'💥',color:'#f97316',muscles:'الصدر، الكتفان، الترايسيبس',type:'reps',sets:3,reps:15, rest:45,steps:['كفاك بعرض الكتفين','جسمك خط مستقيم','انزل حتى يقارب الصدر الأرض','ادفع للأعلى','لا تنزل البطن']},
  {id:'squat',   nameAr:'القرفصاء',      nameEn:'Squats',           icon:'🏋️',color:'#84cc16',muscles:'الفخذ الأمامي والخلفي، الأرداف',type:'reps',sets:3,reps:20,rest:45,steps:['قف بعرض الكتفين','ظهرك مستقيم وصدرك للأعلى','انزل حتى الفخذ موازٍ للأرض','ركبتاك باتجاه الأصابع','ارتفع بدفع من الكعبين']},
  {id:'chair',   nameAr:'تدفيع الكرسي', nameEn:'Chair Dips',       icon:'🪑',color:'#14b8a6',muscles:'الترايسيبس، الصدر الأسفل',  type:'reps',sets:3,reps:12, rest:45,steps:['يداك على حافة كرسي ثابت','مدّ ساقيك للأمام','انزل بثني الكوعين 90 درجة','ادفع للأعلى','ظهرك قريب من الكرسي']},

  /* ══ تمارين مقاومة الجسم المتقدمة ══ */
  {id:'pike_push', nameAr:'ضغط البايك',    nameEn:'Pike Push-Up',     icon:'🔺',color:'#a78bfa',muscles:'الكتفان، الترايسيبس، الصدر العلوي',type:'reps',sets:3,reps:10,rest:45,steps:['ابدأ بوضع الضغط العادي','ارفع وركيك للأعلى حتى يصبح جسمك بشكل مثلث','انثنِ بمرفقيك ونزّل رأسك نحو الأرض','ادفع للأعلى بقوة الكتفين','حافظ على أوتار الركبة مشدودة']},
  {id:'side_plank',nameAr:'بلانك جانبي',   nameEn:'Side Plank',       icon:'↔️',color:'#0ea5e9',muscles:'البطن الجانبي، الخاصرة، الكتف',type:'timer',sets:3,reps:30,repsLabel:'ثانية',rest:30,steps:['استلقِ على الجنب','ارفع جسمك على ساعدك الواحد','جسمك خط مستقيم من الرأس للقدم','اضغط عضلات البطن الجانبية','اثبت ثم بدّل الجانب']},
  {id:'jump_lunge',nameAr:'لنج قفز',        nameEn:'Jump Lunge',       icon:'⚡',color:'#f59e0b',muscles:'الفخذ الأمامي، الأرداف، السمانة',type:'reps',sets:3,reps:12,rest:45,steps:['قف في وضع اللنج','انزل حتى تقترب الركبة الخلفية من الأرض','اندفع للأعلى بقوة','بدّل وضع ساقيك في الهواء','هبوط ناعم بالوضع المعاكس']},
  {id:'diamond',   nameAr:'ضغط الماسة',    nameEn:'Diamond Push-Up',  icon:'💎',color:'#ec4899',muscles:'الترايسيبس، الصدر الداخلي',type:'reps',sets:3,reps:10,rest:45,steps:['يداك بشكل مثلث تحت الصدر','أصابعك تلمس مشكّلةً ماسة','انزل بضغط الترايسيبس','ادفع للأعلى ببطء','المرفقان قريبان من الجسم']},

  /* ══ أثقال منزلية خفيفة (قارورة ماء / دمبل) ══ */
  {id:'bottle_curl',nameAr:'كيرل بالقارورة',nameEn:'Bottle Curl',     icon:'💧',color:'#22c55e',muscles:'البايسيبس، الساعد',type:'reps',sets:3,reps:15,rest:30,steps:['أمسك قارورتي ماء أو دمبل خفيف','ذراعاك على الجانبين','اثنِ المرفق ببطء ورفع القارورة','اضغط البايسيبس في الأعلى','انزل ببطء ولا تخطف']},
  {id:'bottle_press',nameAr:'ضغط كتف قارورة',nameEn:'Shoulder Press', icon:'🏺',color:'#f97316',muscles:'الكتفان، الترايسيبس، الصدر العلوي',type:'reps',sets:3,reps:12,rest:30,steps:['أمسك القاروتين عند مستوى الكتفين','ظهرك مستقيم جالساً أو واقفاً','ادفع للأعلى حتى تمتد الذراعان','انزل ببطء إلى مستوى الأذنين','لا تقوّس ظهرك']},
  {id:'bottle_row', nameAr:'رو بالقارورة', nameEn:'Bent-Over Row',     icon:'🏋️',color:'#8b5cf6',muscles:'الظهر العريض، البايسيبس، الكتف الخلفي',type:'reps',sets:3,reps:12,rest:30,steps:['انحنِ للأمام 45 درجة مع ظهر مستقيم','قارورتان معلقتان للأسفل','اسحب للأعلى نحو الخصر بضغط الظهر','اثبت لحظة عند القمة','انزل ببطء']},
  {id:'lateral_raise',nameAr:'رفع جانبي',  nameEn:'Lateral Raise',    icon:'↕️',color:'#06b6d4',muscles:'الكتف الجانبي، الدلتا',type:'reps',sets:3,reps:12,rest:30,steps:['ذراعاك على الجانبين مع القاروتين','ارفع الذراعين جانبياً حتى مستوى الكتف','مرفقاك خفيف الانثناء (لا مستقيمان تماماً)','توقف لحظة عند الأعلى','انزل ببطء']},
];


/* ══════════════════════════════════════════
   CALORIE ENGINE — MET-based calculation
   Formula: cal = MET × weight(kg) × duration(h)
══════════════════════════════════════════ */
const MET_BY_ID = {
  rope:     10.0,   // jump rope — vigorous
  burpee:    8.5,   // full body explosive
  highknee:  7.5,   // high knees cardio
  sqjump:    6.5,   // jump squats
  starjump:  7.0,   // star jumps / jumping jacks
  climber:   8.0,   // mountain climbers
  boxing:    6.0,   // shadow boxing
  plank:     3.5,   // isometric hold
  crunch:    3.8,   // abs crunch
  legrise:   3.5,   // leg raises
  bicycle:   4.0,   // bicycle crunch
  russian:   4.0,   // russian twist
  hollow:    3.5,   // hollow hold
  pushup:    5.0,   // push-ups
  squat:     5.0,   // bodyweight squat
  chair:     4.5,   // chair dips
  // Advanced bodyweight
  pike_push:    5.5,
  side_plank:   3.8,
  jump_lunge:   7.0,
  diamond:      5.2,
  // Home weights
  bottle_curl:  3.5,
  bottle_press: 4.0,
  bottle_row:   4.0,
  lateral_raise:3.5,
};
const MET_BY_TYPE = { timer: 4.0, reps: 5.0, cardio: 7.5, distance: 7.0 };

function calcExCal(ex, kgParam) {
  if (!ex) return 10;
  const kg = parseFloat(kgParam ?? S?.user?.weight) || 70;
  const met = MET_BY_ID[ex.id] ?? MET_BY_TYPE[ex.type] ?? 5.0;
  // Duration in minutes:
  // timer-type: reps = seconds  → sets × reps / 60
  // reps-type:  ~3 s per rep    → sets × reps × 3 / 60
  const durationMins = ex.type === 'timer'
    ? (ex.sets * ex.reps) / 60
    : (ex.sets * ex.reps * 3) / 60;
  const mins = Math.max(0.5, durationMins);
  return Math.max(5, Math.round(met * kg * mins / 60));
}

function calcScheduleCal(sched, kg) {
  if (!sched || !sched.exercises || !sched.exercises.length) return 0;
  const total = sched.exercises.reduce((s, ex) => s + calcExCal(ex, kg), 0);
  // Add ~15% for warm-up/cool-down activity and between-set movement
  return Math.round(total * 1.15);
}

const STRETCH_EXERCISES = [
  {id:'neck',    nameAr:'تمدد الرقبة',      icon:'🧘', dur:30, steps:['أمل رأسك ببطء للجانب الأيمن','اثبت 15 ثانية','كرر للجانب الأيسر']},
  {id:'shoulder',nameAr:'تمدد الكتف',       icon:'💪', dur:30, steps:['مد ذراعك للأمام عبر الصدر','اضغط بذراعك الأخرى','اثبت 15 ثانية لكل جانب']},
  {id:'chest',   nameAr:'فتح الصدر',        icon:'🫁', dur:40, steps:['شبّك يديك خلف ظهرك','ارفع صدرك للأعلى','تنفس بعمق واثبت']},
  {id:'hamstring',nameAr:'تمدد الهامسترينج',icon:'🦵', dur:45, steps:['اجلس على الأرض','مد ساقيك أمامك','ابسط إلى الأمام وامسك قدميك']},
  {id:'quad',    nameAr:'تمدد الفخذ الأمامي',icon:'🏃', dur:30, steps:['قف على قدم واحدة','اسحب قدمك الأخرى للخلف','اثبت 15 ثانية لكل ساق']},
  {id:'hip',     nameAr:'فتح الوركين',      icon:'🧘', dur:45, steps:['استلقِ على ظهرك','اثنِ ركبة واحدة على الأخرى','اسحب برفق نحو صدرك']},
  {id:'spine',   nameAr:'لف العمود الفقري', icon:'🌀', dur:40, steps:['اجلس باستقامة','الف جذعك ببطء يميناً','اثبت ثم كرر لليسار']},
  {id:'calf',    nameAr:'تمدد الساق السفلية',icon:'👟', dur:30, steps:['قف أمام الجدار','خطوة للخلف مع قدم مستقيمة','اضغط الكعب للأرض']},
];

const WEEK_SCHEDULE = [
  {day:'الاثنين', type:'rope_hiit', labelKey:'typeRopeHiit',   label:'حبل+HIIT',  exercises:['rope','burpee','highknee','sqjump','starjump','climber']},
  {day:'الثلاثاء',type:'circuit',   labelKey:'typeCircuit',     label:'سيركيت',   exercises:['burpee','sqjump','climber','boxing','pushup','squat']},
  {day:'الأربعاء',type:'rope_core', labelKey:'typeRopeCore',    label:'حبل+كور',   exercises:['rope','plank','crunch','legrise','bicycle','russian']},
  {day:'الخميس', type:'rest',      labelKey:'typeActiveRest',  label:'راحة نشطة', exercises:[]},
  {day:'الجمعة', type:'hiit_core', labelKey:'typeHiitCore',    label:'HIIT+كور',  exercises:['burpee','highknee','climber','boxing','crunch','hollow']},
  {day:'السبت',  type:'strength',  labelKey:'typeStrength',    label:'قوة',       exercises:['pushup','squat','chair','plank','legrise','russian']},
  {day:'الأحد',  type:'rest',      labelKey:'typeRest',        label:'راحة',      exercises:[]},
];

// ── برنامج المبتدئين 21 يوم ──
// أخف، أبطأ، راحة أكثر، تمارين أسهل
const BEGINNER_SCHEDULE = [
  {day:1,  type:'intro',    label:'تعارف',     exercises:['pushup','squat','plank']},
  {day:2,  type:'rest',     label:'راحة',      exercises:[]},
  {day:3,  type:'cardio1',  label:'كارديو خفيف',exercises:['highknee','starjump','climber']},
  {day:4,  type:'rest',     label:'راحة',      exercises:[]},
  {day:5,  type:'core1',    label:'كور',       exercises:['crunch','legrise','plank']},
  {day:6,  type:'rest',     label:'راحة',      exercises:[]},
  {day:7,  type:'rest',     label:'راحة كاملة',exercises:[]},
  {day:8,  type:'strength1',label:'قوة',       exercises:['pushup','squat','chair']},
  {day:9,  type:'rest',     label:'راحة',      exercises:[]},
  {day:10, type:'cardio2',  label:'كارديو',    exercises:['highknee','starjump','sqjump','climber']},  // FIX-E: boxjump→sqjump (boxjump undefined)
  {day:11, type:'rest',     label:'راحة',      exercises:[]},
  {day:12, type:'core2',    label:'كور+',      exercises:['crunch','bicycle','legrise','plank']},
  {day:13, type:'rest',     label:'راحة',      exercises:[]},
  {day:14, type:'rest',     label:'استراحة أسبوعية',exercises:[]},
  {day:15, type:'hiit1',    label:'HIIT',      exercises:['burpee','highknee','climber','sqjump']},
  {day:16, type:'rest',     label:'راحة',      exercises:[]},
  {day:17, type:'strength2',label:'قوة+',      exercises:['pushup','squat','chair','plank']},
  {day:18, type:'rest',     label:'راحة',      exercises:[]},
  {day:19, type:'fullbody', label:'جسم كامل',  exercises:['burpee','pushup','squat','crunch','climber']},
  {day:20, type:'rest',     label:'راحة',      exercises:[]},
  {day:21, type:'finale',   label:'🎉 الختام', exercises:['pushup','squat','plank','crunch','highknee','burpee']},
];

function getRepsLabel(ex) {
  if (!ex) return '';
  if (ex.type === 'timer')    return window.T ? window.T('lblSecs','ثانية') : (ex.repsLabel||'ثانية');
  if (ex.type === 'distance') return window.T ? window.T('lblMeters','م')   : (ex.repsLabel||'م');
  return window.T ? window.T('lblReps','تكرار') : (ex.repsLabel||'تكرار');
}

function getExName(ex) {
  if (!ex) return '';
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'ar';
  if (lang !== 'ar' && ex.nameEn) return ex.nameEn;
  return ex.nameAr || ex.nameEn || '';
}

function getExercisesLabel(count) {
  return count + ' ' + (window.T ? window.T('lblExercises','تمارين') : 'تمارين');
}

function getScheduleLabel(ws) {
  if (!ws) return '';
  if (ws.labelKey && window.T) return window.T(ws.labelKey, ws.label);
  return ws.label || '';
}

const PHASES = [
  {nameKey:'phaseFound', name:'التأسيس', icon:'🌱', days:'1-7',   start:1, end:7},
  {nameKey:'phaseBuilt', name:'البناء',   icon:'⚡', days:'8-14',  start:8, end:14},
  {nameKey:'phasePeak',  name:'الذروة',   icon:'🔥', days:'15-21', start:15,end:21},
  {nameKey:'phaseFinal', name:'الحسم',    icon:'🏆', days:'22-30', start:22,end:30},
];

function getPhaseName(phase) {
  if (!phase) return '';
  if (phase.nameKey && window.T) return window.T(phase.nameKey, phase.name);
  return phase.name || '';
}

// FIX#7: Extended week templates for programs > 30 days
// Weeks 1-4: foundation → Weeks 5-8: intensity → Weeks 9+: peak
const EXTENDED_WEEK_SCHEDULES = [
  // Weeks 1-2: Foundation (same as WEEK_SCHEDULE)
  null,
  // Weeks 3-4: Build — add advanced exercises
  [
    {day:'الاثنين', type:'rope_hiit',  label:'حبل+HIIT+', exercises:['rope','burpee','highknee','sqjump','jump_lunge','climber']},
    {day:'الثلاثاء',type:'circuit',    label:'سيركيت+',   exercises:['burpee','sqjump','climber','boxing','pushup','diamond','squat']},
    {day:'الأربعاء',type:'rope_core',  label:'حبل+كور+',  exercises:['rope','plank','side_plank','crunch','legrise','bicycle','russian']},
    {day:'الخميس', type:'rest',        label:'راحة نشطة', exercises:[]},
    {day:'الجمعة', type:'hiit_core',   label:'HIIT+كور+', exercises:['burpee','jump_lunge','climber','boxing','hollow','crunch']},
    {day:'السبت',  type:'strength',    label:'قوة+',      exercises:['pike_push','diamond','squat','chair','plank','side_plank']},
    {day:'الأحد',  type:'rest',        label:'راحة',      exercises:[]},
  ],
  // Weeks 5-6: Intensity — full advanced
  [
    {day:'الاثنين', type:'rope_hiit',  label:'حبل+HIIT متقدم', exercises:['rope','burpee','highknee','sqjump','jump_lunge','climber','boxing']},
    {day:'الثلاثاء',type:'circuit',    label:'سيركيت متقدم',   exercises:['pike_push','diamond','sqjump','climber','boxing','pushup','squat']},
    {day:'الأربعاء',type:'rope_core',  label:'حبل+كور متقدم',  exercises:['rope','hollow','side_plank','crunch','legrise','bicycle','russian']},
    {day:'الخميس', type:'rest',        label:'راحة نشطة',      exercises:[]},
    {day:'الجمعة', type:'hiit_core',   label:'HIIT قصوى',      exercises:['burpee','jump_lunge','climber','boxing','sqjump','starjump','highknee']},
    {day:'السبت',  type:'strength',    label:'قوة كاملة',      exercises:['pike_push','diamond','squat','chair','side_plank','hollow','legrise']},
    {day:'الأحد',  type:'rest',        label:'راحة',           exercises:[]},
  ],
];

function getWeekTemplate(weekNumber) {
  if (weekNumber <= 2) return WEEK_SCHEDULE;
  if (weekNumber <= 4) return EXTENDED_WEEK_SCHEDULES[1];
  return EXTENDED_WEEK_SCHEDULES[2];
}

function getDaySchedule(day) {
  // Check if beginner 21-day program is active
  if (S.user?.program === 'beginner') {
    const bDay = BEGINNER_SCHEDULE.find(d => d.day === day);
    const ws = bDay || { day, type: 'rest', label: 'راحة', exercises: [] };
    const customIds = S.customSchedule && S.customSchedule[day];
    if (customIds === 'rest') return { ...ws, type: 'rest', exercises: [] };
    const exIds = customIds || ws.exercises;
    const allEx = [...EXERCISES, ...(S.customExercises||[])];
    // Beginner: no progressive overload in week 1, gentle increase after
    const week = Math.ceil(day / 7);
    const exercises = exIds.map(id => {
      const ex = allEx.find(e => e.id === id);
      if (!ex) return null;
      // Reduced reps for beginner + gentler progression
      const repsIncrease = week > 2 ? (ex.type === 'timer' ? (week-2)*3 : (week-2)) : 0;
      return { ...ex, sets: Math.max(2, ex.sets - 1), reps: Math.max(5, Math.round(ex.reps * 0.7) + repsIncrease) };
    }).filter(Boolean);
    return { ...ws, exercises };
  }

  const week = Math.ceil(day / 7);
  const weekTemplate = getWeekTemplate(week); // FIX#7: use progressive template
  const weekIdx = (day - 1) % 7;
  const ws = weekTemplate[weekIdx];
  // Use custom schedule if set for this day
  const customIds = S.customSchedule && S.customSchedule[day];
  // Handle 'rest' string set by coach setRest command
  if (customIds === 'rest') return { ...ws, type: 'rest', exercises: [] };
  const exIds = customIds || ws.exercises;
  const allEx = [...EXERCISES, ...(S.customExercises||[])];
  const exercises = exIds.map(id => {
    const ex = allEx.find(e => e.id === id);
    if (!ex) return null;
    // Progressive overload: reps increase each week, sets stay constant
    const repsIncrease = ex.type === 'timer' ? (week - 1) * 5 : (week - 1) * 2;
    return { ...ex, sets: ex.sets, reps: ex.reps + repsIncrease };
  }).filter(Boolean);
  return { ...ws, exercises };
}

function getPhase(day) {
  // Beginner program phases
  if (S.user?.program === 'beginner') {
    if (day <= 7)  return { nameKey:'phaseDiscovery', name:'الاكتشاف', icon:'🌱', days:'1-7',  start:1,  end:7  };
    if (day <= 14) return { nameKey:'phaseBuilt',     name:'البناء',    icon:'⚡', days:'8-14', start:8,  end:14 };
    return           { nameKey:'phaseMastery',    name:'الإتقان',   icon:'🏆', days:'15-21',start:15, end:21 };
  }
  // Scale phases proportionally to programDays
  const prog = S.user?.programDays || 30;
  if (prog === 30) return PHASES.find(p => day >= p.start && day <= p.end) || PHASES[3];
  // Dynamic: divide program into 4 equal quarters
  const q = prog / 4;
  const phases = [
    {...PHASES[0], start:1,              end:Math.floor(q)},
    {...PHASES[1], start:Math.floor(q)+1, end:Math.floor(q*2)},
    {...PHASES[2], start:Math.floor(q*2)+1, end:Math.floor(q*3)},
    {...PHASES[3], start:Math.floor(q*3)+1, end:prog},
  ];
  return phases.find(p => day >= p.start && day <= p.end) || phases[3];
}

/* ══════ THEMES ══════ */
const THEMES = [
  {id:'default', name:'🌑 داكن',    dot:'linear-gradient(135deg,#0284C7,#38BDF8)'},
  {id:'fire',    name:'🔥 ناري',    dot:'linear-gradient(135deg,#DC2F02,#F48C06)'},
  {id:'ocean',   name:'🌊 بحري',   dot:'linear-gradient(135deg,#023E8A,#00B4D8)'},
  {id:'nature',  name:'🌿 طبيعي',  dot:'linear-gradient(135deg,#1B4332,#52B788)'},
  {id:'neon',    name:'⚡ نيون',    dot:'linear-gradient(135deg,#C500A3,#FF6FD8)'},
  {id:'purple',  name:'🔮 بنفسجي', dot:'linear-gradient(135deg,#9C27B0,#FF80FF)'},
  {id:'light',   name:'☀️ فاتح',   dot:'linear-gradient(135deg,#1D4ED8,#93C5FD)'},
];
const THEME_ICONS = {default:'🌑',fire:'🔥',ocean:'🌊',nature:'🌿',neon:'⚡',purple:'🔮',light:'☀️'};

function setTheme(id) {
  const el = document.documentElement;
  if (id === 'default') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', id);
  S.theme = id;
  saveState();
  // Change animated background
  setBG(id === 'default' ? 'default' : id);
  // Update header theme button icon
  const btn = document.getElementById('theme-hdr-btn');
  if (btn) btn.textContent = THEME_ICONS[id] || '🎨';
  const fab = document.getElementById('fab-theme');
  if (fab) fab.textContent = THEME_ICONS[id] || '🎨';
  // Update desktop/tv dots
  dtBuildThemeDots();
  buildThemeGrid();
  closeThemeModal();
}
function buildThemeGrid() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  grid.innerHTML = THEMES.map(t => `
    <div class="theme-opt${S.theme===t.id?' active':''}" onclick="setTheme('${t.id}')">
      <div class="th-dot" style="background:${t.dot}"></div>
      <span class="th-name">${t.name}</span>
    </div>`).join('');
}
function openThemeModal() { buildThemeGrid(); document.getElementById('theme-modal').classList.add('open'); }
function closeThemeModal() { document.getElementById('theme-modal').classList.remove('open'); }
function setMode(m) {
  S.mode = m;
  saveState();
  const icons = {mobile:'📱',desktop:'🖥️'};
  const modeBtn = document.getElementById('mode-hdr-btn');
  if (modeBtn) modeBtn.textContent = icons[m]||'📱';
  showMiniToast('وضع ' + (m==='mobile'?'الجوال':'الكمبيوتر') + ' ✓');
}

/* ══════ QUOTES & TIPS ══════ */
const QUOTES_BY_LANG = {
  ar:[
    {text:'كل رحلة ألف ميل تبدأ بخطوة واحدة.',attr:'لاوتزي'},
    {text:'الانضباط هو الجسر بين أهدافك وإنجازاتك.',attr:'جيم رون'},
    {text:'لا تتوقف عند الإرهاق، توقف عند الانتهاء.',attr:'—'},
    {text:'جسمك يسمع كل شيء يقوله عقلك.',attr:'—'},
    {text:'من جدّ وجد، ومن زرع حصد.',attr:'مثل عربي'},
    {text:'النية الصادقة تضاعف الأجر والنتيجة.',attr:'—'},
    {text:'اجعل صحتك عبادة وتمرينك قربة.',attr:'—'},
    {text:'القوة لا تأتي من القدرة الجسدية، بل من الإرادة الذهنية.',attr:'غاندي'},
    {text:'كل تعرق في التدريب يوفر دم في الميدان.',attr:'—'},
    {text:'رمضان فرصة لتجديد الروح والجسد معاً.',attr:'—'},
  ],
  en:[
    {text:'A journey of a thousand miles begins with a single step.',attr:'Lao Tzu'},
    {text:'Discipline is the bridge between goals and accomplishment.',attr:'Jim Rohn'},
    {text:'Don\'t stop when you\'re tired. Stop when you\'re done.',attr:'—'},
    {text:'Your body hears everything your mind says.',attr:'—'},
    {text:'The only bad workout is the one that didn\'t happen.',attr:'—'},
    {text:'Push yourself, because no one else is going to do it for you.',attr:'—'},
    {text:'Success is the sum of small efforts, repeated daily.',attr:'R. Collier'},
    {text:'Strength doesn\'t come from physical capacity. It comes from indomitable will.',attr:'Gandhi'},
    {text:'Sweat in training so you don\'t bleed in battle.',attr:'—'},
    {text:'Make your health a priority, not an afterthought.',attr:'—'},
  ],
  fr:[
    {text:'Un voyage de mille lieues commence par un seul pas.',attr:'Lao Tseu'},
    {text:'La discipline est le pont entre les objectifs et l\'accomplissement.',attr:'Jim Rohn'},
    {text:'Ne t\'arrête pas quand tu es fatigué. Arrête-toi quand tu as fini.',attr:'—'},
    {text:'Ton corps entend tout ce que dit ton esprit.',attr:'—'},
    {text:'La seule mauvaise séance est celle que tu n\'as pas faite.',attr:'—'},
    {text:'Pousse-toi, car personne d\'autre ne le fera pour toi.',attr:'—'},
    {text:'Le succès est la somme de petits efforts répétés chaque jour.',attr:'R. Collier'},
    {text:'La force ne vient pas de la capacité physique, mais de la volonté.',attr:'Gandhi'},
    {text:'Transpire à l\'entraînement pour ne pas saigner sur le terrain.',attr:'—'},
    {text:'Fais de ta santé une priorité, pas une réflexion après coup.',attr:'—'},
  ],
};
function getQuotes(){return QUOTES_BY_LANG[currentLang]||QUOTES_BY_LANG.ar;}
const QUOTES=QUOTES_BY_LANG.ar; // backward compat
const TIPS = [
  {cat:'💧 تغذية',  text:'اشرب 8 أكواب من الماء يومياً. الترطيب يزيد الأداء بنسبة 20%.'},
  {cat:'😴 نوم',    text:'7-8 ساعات نوم ضروري لبناء العضل وحرق الدهون بشكل طبيعي.'},
  {cat:'🥩 بروتين', text:'تناول بروتيناً بعد التمرين بساعة. 1.6 غرام لكل كيلو من وزنك يومياً.'},
  {cat:'🧘 تعافي',  text:'يوم الراحة بنفس أهمية يوم التمرين. العضل يبنى أثناء الراحة.'},
  {cat:'⏰ توقيت',  text:'أفضل وقت للتمرين هو الذي تستطيع الالتزام به. الانتظام أهم من الوقت.'},
  {cat:'🌙 رمضان',  text:'في رمضان، تمرن قبل الإفطار بـ30 دقيقة أو بعده بساعتين للحصول على أفضل نتائج.'},
  {cat:'🔥 دهون',   text:'التمارين الهوائية المتقطعة (HIIT) تحرق الدهون حتى 48 ساعة بعد التمرين.'},
  {cat:'💡 تركيز',  text:'ركّز على صحة الحركة قبل كمية الوزن. التقنية الصحيحة تمنع الإصابات.'},
  {cat:'📈 تقدم',   text:'زِد شدة التمرين بـ10% أسبوعياً فقط. التدرج يحمي من الإصابة ويضمن التقدم.'},
  {cat:'🤲 نية',    text:'ابدأ كل جلسة بنية خالصة. اجعل صحتك أمانة في عنقك لتؤدي واجباتك خيراً.'},
];

/* ══════ BADGES ══════ */
const BADGES = [
  {id:'first_day',  name:'الخطوة الأولى', icon:'👟', desc:'إكمال أول يوم',           check:()=>S.completedDays.length>=1},
  {id:'week1',      name:'أسبوع كامل',    icon:'📅', desc:'7 أيام مكتملة',           check:()=>S.completedDays.length>=7},
  {id:'week2',      name:'14 يوم',         icon:'⚡', desc:'نصف الطريق',              check:()=>S.completedDays.length>=14},
  {id:'week3',      name:'21 يوم',         icon:'🔥', desc:'عادة راسخة',              check:()=>S.completedDays.length>=21},
  {id:'champion',   name:'البطل',           icon:'🏆', desc:'30 يوم كاملة',            check:()=>S.completedDays.length>=30},
  {id:'streak5',    name:'سلسلة 5',        icon:'⛓️', desc:'5 أيام متواصلة',          check:()=>S.streak>=5},
  {id:'streak10',   name:'سلسلة 10',       icon:'💎', desc:'10 أيام متواصلة',         check:()=>S.streak>=10},
  {id:'cal1000',    name:'محرق السعرات',   icon:'🌋', desc:'1000 سعرة محروقة',        check:()=>S.calories>=1000},
  {id:'cal5000',    name:'آلة الحرق',      icon:'☀️', desc:'5000 سعرة محروقة',        check:()=>S.calories>=5000},
  {id:'rope_hero',  name:'بطل الحبل',      icon:'🪢', desc:'100 جلسة حبل',            check:()=>S.ropeSessions>=100},
  {id:'early_bird', name:'الطائر المبكر',  icon:'🐦', desc:'إكمال 3 تمارين صباحية',  check:()=>(S.morningWorkouts||0)>=3},
  {id:'perfect_wk', name:'أسبوع مثالي',   icon:'⭐', desc:'7 أيام متواصلة بدون انقطاع',check:()=>S.streak>=7},
];

function checkBadges() {
  BADGES.forEach(b => {
    if (!S.unlockedBadges.includes(b.id) && b.check()) {
      S.unlockedBadges.push(b.id);
      saveState();
      showBadgeToast(b);
      playFanfare();
    }
  });
}
function showBadgeToast(b) {
  document.getElementById('bt-icon').textContent = b.icon;
  document.getElementById('bt-name').textContent = b.name;
  document.getElementById('bt-desc').textContent = b.desc;
  const t = document.getElementById('badge-toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

