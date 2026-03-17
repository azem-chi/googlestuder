import { GoogleGenAI } from "@google/genai";

/* ══════════════════════════════════════════
   LOCAL AI COACH ENGINE
   يعمل بدون API Key — ردود ذكية تعتمد على بيانات المستخدم
══════════════════════════════════════════ */
function localCoachReply(msg, S) {
  const u = S.user || {};
  const name = u.name || 'بطل';
  const kg = parseFloat(u.weight) || 70;
  const cm = parseFloat(u.height) || 170;
  const age = parseFloat(u.age) || 25;
  const gender = u.gender || 'male';
  const isFemale = gender === 'female';
  const bmi = cm > 0 ? (kg / Math.pow(cm/100, 2)).toFixed(1) : '—';
  // حساب السعرات الأساسية (Mifflin-St Jeor) حسب الجنس والعمر
  const bmr = isFemale
    ? Math.round(10*kg + 6.25*cm - 5*age - 161)
    : Math.round(10*kg + 6.25*cm - 5*age + 5);
  const goal = u.goal || 'burn';
  const goalAr = {burn:'حرق الدهون', muscle:'بناء العضلات', fitness:'تحسين اللياقة', health:'الصحة العامة'}[goal] || 'عام';
  const day = S.currentDay || 1;
  const done = (S.completedDays||[]).length;
  const streak = S.streak || 0;
  const cal = S.calories || 0;
  const progDays = u.programDays || 30;
  const pct = Math.round(done/progDays*100);
  const todaySched = (() => { try { return getDaySchedule(day); } catch(e) { return null; } })();
  const todayEx = todaySched?.exercises?.map(e=>e.nameAr).join('، ') || '—';
  const isDoneToday = (S.completedDays||[]).includes(day);
  const m = msg.trim().toLowerCase();

  // ── Intent detection helpers ──
  const has = (...kws) => kws.some(k => m.includes(k));

  // ── Greeting / welcome ──
  if (has('مرحبا','السلام','هاي','هلو','اهلا','كيف حالك','كيفك','صباح','مساء','hello','hi')) {
    const greetings = [
      `أهلاً ${name}! 💪 أنت في اليوم **${day}** من البرنامج وأكملت **${done} يوم** — رائع!\nهدفك الحالي: **${goalAr}**. كيف أقدر أساعدك اليوم؟`,
      `وعليك السلام ${name}! 🔥 سلسلتك **${streak} أيام** متواصلة — هذا إنجاز حقيقي!\nاليوم ${day} في انتظارك: **${todayEx}**. أخبرني إذا احتجت أي شيء.`,
      `هلا ${name}! ⚡ ${done} يوم مكتمل حتى الآن — أنت جاد في التغيير!\nاسألني عن التمارين، التغذية، أو البرنامج وأنا هنا.`,
    ];
    return greetings[day % greetings.length];
  }

  // ── Fatigue / rest ──
  if (has('تعبان','متعب','مرهق','ألم','وجع','إصابة','اصابة','لا أقدر','مو قادر','صعب اليوم')) {
    if (has('ألم','وجع','إصابة','اصابة')) {
      return `${name}، إذا كان الألم حاداً أو في مفصل — **توقف فوراً** وأعطِ جسمك راحة كاملة يوم أو يومين. 🩹\nتمارين خفيفة مؤقتاً:\n• **البلانك** بدلاً من التمارين ذات الاندفاع\n• **التمدد** 10-15 دقيقة\n• **المشي البطيء** 20 دقيقة\n\nإذا استمر الألم أكثر من 48 ساعة استشر طبيباً. صحتك أهم من أي برنامج.`;
    }
    return `${name}، التعب طبيعي جداً — جسمك يتكيّف ويتطور! 💪\nهنا خياران:\n\n**الخيار 1 — خفّف اليوم:**\n• قلّل المجموعات إلى 2 بدلاً من 3\n• زِد وقت الراحة 15 ثانية\n• تمارين بدون قفز فقط\n\n**الخيار 2 — راحة نشطة:**\n• اضغط "راحة نشطة" في الأسفل\n• 8 تمارين تمدد لطيفة (${STRETCH_EXERCISES.reduce((s,e)=>s+e.dur,0)} ثانية)\n\nبعد غد ستشعر أقوى بكثير! 🔥`;
  }

  // ── Calorie burn / how to burn faster ──
  if (has('حرق','سعرات','كالوري','يحرق','أحرق','أسرع','وزن','سمنة','دهون')) {
    const dailyCal = todaySched ? calcScheduleCal(todaySched, kg) : 150;
    const weekCal = dailyCal * 5;
    const targetCal = goal === 'burn' ? bmr - 300 : goal === 'muscle' ? bmr + 300 : bmr;
    return `${name}، بناءً على وزنك **${kg} كغ** وطولك **${cm} سم** وعمرك **${age} سنة** — إليك أرقامك الحقيقية:\n\n🔥 **جلسة اليوم:** ~${dailyCal} سعرة\n📅 **أسبوع تدريب (5 أيام):** ~${weekCal} سعرة\n⚡ **حرقت حتى الآن:** ${cal} سعرة إجمالية\n🧮 **سعراتك اليومية المقترحة:** ~${targetCal} سعرة (${isFemale ? 'أنثى' : 'ذكر'})\n\n**نصيحتي لتسريع الحرق:**\n• **HIIT قصير (20 دقيقة)** = نفس حرق الكارديو 45 دقيقة\n• البيربيز ونط الحبل الأعلى MET في البرنامج\n• اشرب ماء بارد قبل التمرين مباشرة`;
  }

  // ── Nutrition post-workout ──
  if (has('أكل','طعام','غذاء','تغذية','بعد التمرين','قبل التمرين','بروتين','بروتيين','كارب','دجاج','بيض')) {
    const proteinG = Math.round(kg * (goal === 'muscle' ? 2.0 : 1.6));
    const carbG = Math.round(kg * (goal === 'burn' ? 2.0 : 3.0));
    const fatG = Math.round(kg * 0.8);
    const calsLabel = isFemale ? `${bmr - 200} - ${bmr}` : `${bmr} - ${bmr + 200}`;
    return `${name}، هنا خطة تغذية مبنية على وزنك **${kg} كغ** وهدف **${goalAr}** ${isFemale ? '👩' : '👨'}:\n\n**السعرات اليومية المقترحة:** ${calsLabel} سعرة\n\n**احتياجك اليومي:**\n🥩 **بروتين:** ${proteinG}غ — (دجاج، بيض، تونا، لبن)\n🍚 **كارب:** ${carbG}غ — (أرز، شوفان، خبز أسمر)\n🥑 **دهون:** ${fatG}غ — (زيت زيتون، مكسرات، أفوكادو)\n\n**قبل التمرين (45-60 دقيقة):**\n• موزة + ملعقة عسل\n• أو كوب شوفان بالحليب\n\n**بعد التمرين (خلال 45 دقيقة) — الأهم:**\n• بيضتان + خبز أسمر\n• أو دجاج + أرز + خضار`;
  }

  // ── Today's workout info ──
  if (has('اليوم','تمارين اليوم','برنامج اليوم','ماذا','شو','ايش','وش')) {
    if (todaySched?.type === 'rest') {
      return `${name}، اليوم **${day}** يوم راحة مبرمج في برنامجك! 😴\nجسمك يبني العضلات أثناء الراحة — لا تتخطاها.\n\nإذا أردت التحرك خفيفاً: جرّب **الراحة النشطة** (8 تمارين تمدد، ${STRETCH_EXERCISES.reduce((s,e)=>s+e.dur,0)} ثانية فقط).`;
    }
    const calToday = calcScheduleCal(todaySched, kg);
    return `${name}، يوم **${day}** — ${todaySched?.label || 'تدريب'} 💪\n\nالتمارين:\n${(todaySched?.exercises||[]).map((e,i)=>`${i+1}. **${e.nameAr}** — ${e.sets}×${e.reps} ${e.type==='timer'?'ثانية':'تكرار'} (${calcExCal(e, kg)} كالوري)`).join('\n')}\n\n🔥 **إجمالي مقدر:** ~${calToday} سعرة\n⏱️ **المدة المتوقعة:** ~${Math.max(20, (todaySched?.exercises||[]).length * 5)} دقيقة`;
  }

  // ── Progress evaluation ──
  if (has('تقدم','إنجاز','كيف أنا','قيّم','قيم','نتائجي','تقييم')) {
    let eval_ = '';
    if (pct >= 80) eval_ = '🏆 ممتاز! أنت من الـ5% الذين يُكملون البرامج.';
    else if (pct >= 50) eval_ = '💪 أكثر من النصف — الأصعب ورائك!';
    else if (pct >= 25) eval_ = '⚡ بداية قوية — لا تتوقف الآن!';
    else eval_ = '🚀 رحلتك بدأت — كل يوم يهم!';
    return `${name}، تقييمك الحالي:\n\n${eval_}\n📊 **التقدم:** ${done}/${progDays} يوم (${pct}%)\n🔥 **السلسلة:** ${streak} أيام متواصلة\n⚡ **السعرات المحروقة:** ${cal}\n🎯 **الهدف:** ${goalAr}\n\n${streak >= 7 ? '🏅 أسبوع متواصل — شارة الثبات في متناول يدك!' : streak >= 3 ? '📈 3 أيام متتالية — أحسنت!' : 'حاول تتابع 3 أيام متتالية لتشعل سلسلتك! 🔥'}`;
  }

  // ── FIX#11: Adaptive AI — next session suggestion ──
  if (has('جلسة القادمة','جلسة قادمة','اقتراح جلسة','ماذا أتدرب','الجلسة القادمة','ايش أتدرب','وش أتدرب','شو أتدرب')) {
    const log = Object.values(S.trainingLog||{}).sort((a,b)=>b.day-a.day).slice(0,7);
    if (!log.length) {
      return `${name}، لا يوجد سجل تدريب بعد. أكمل جلستك الأولى وسأحلل أداءك! 💪`;
    }
    // Muscle fatigue analysis
    const muscleCount = {};
    log.forEach(e=>{
      const ids = e.exerciseIds || [];
      ids.forEach(id=>{
        const ex = [...EXERCISES,...(S.customExercises||[])].find(x=>x.id===id);
        if(ex?.muscles) ex.muscles.split('،').forEach(m=>{const k=m.trim();muscleCount[k]=(muscleCount[k]||0)+1;});
      });
    });
    const tired = Object.entries(muscleCount).filter(([,v])=>v>=3).map(([k])=>k);
    const avgCal = Math.round(log.reduce((s,e)=>s+(e.calories||0),0)/log.length);
    const lastCal = log[0]?.calories||0;
    const trending = lastCal < avgCal * 0.85 ? 'منخفضة' : lastCal > avgCal * 1.15 ? 'مرتفعة' : 'طبيعية';
    const restDaysRecent = log.slice(0,3).filter(e=>!e.exercises?.length).length;
    const needsRest = tired.length >= 2 && restDaysRecent === 0;
    const todayExList = todaySched?.exercises?.map(e=>e.nameAr).join('، ') || '—';
    let suggestion = '';
    if (needsRest) {
      suggestion = `🔴 **توصية: راحة نشطة اليوم!**
العضلات المُرهقة: **${tired.join('، ')}**
ثلاثة أيام تدريب متتالية بدون راحة — الجسم يحتاج تعافٍ.

✅ **بدلاً من ذلك:**
• 10 دقائق تمدد
• مشي خفيف 20 دقيقة
• ماء كافٍ وبروتين`;
    } else {
      const intensityNote = trending === 'منخفضة'
        ? '⚡ **السعرات تنازلية — حان وقت رفع الكثافة!** زِد مجموعة واحدة لكل تمرين.'
        : trending === 'مرتفعة' ? '🔥 أداء ممتاز — حافظ على هذا المستوى!'
        : '✅ الكثافة مناسبة — استمر.';
      suggestion = `${intensityNote}

📋 **جلسة اليوم المقترحة (يوم ${day}):**
${todayExList}

${tired.length ? `⚠️ تجنب الإجهاد الزائد على: **${tired.join('، ')}**` : '✅ توزيع العضلات متوازن'}`;
    }
    return `${name}، إليك تحليل جلستك القادمة بناءً على آخر ${log.length} تمارين:

${suggestion}`;
  }

  // ── Program / schedule suggestion ──
  if (has('برنامج','اقترح','خطة','جدول','أسبوع','ورتين','روتين')) {
    return `${name}، بناءً على هدفك **${goalAr}** — هنا أسبوع مقترح:

**اليوم 1 — قلب وتحمل:** 🔥
• نط الحبل 3×60ث
• رفع الركبة 3×40ث
• متسلق الجبل 3×40ث

**اليوم 2 — قوة وكور:** 💪
• ضغط 3×15
• بلانك 3×45ث
• كرنش 3×20

**اليوم 3 — راحة نشطة** 😴

**اليوم 4 — HIIT:** ⚡
• بيربيز 3×10
• قرفصاء قفز 3×15
• قفز النجمة 3×20

**اليوم 5 — كور وثبات:** 🎯
• هولو هولد 3×30ث
• رفع الساقين 3×15
• لف روسي 3×20

**اليوم 6 — راحة** 😴

**اليوم 7 — راحة** 😴

هل أطبق هذا البرنامج على التطبيق الآن؟`;
  }

  // ── Motivation ──
  if (has('تحفيز','همة','نشاط','محفور','كسلان','كسل','ما عندي خلق','مو شايف فايدة','يأس')) {
    const motivations = [
      `${name}، اسمع — ${streak > 0 ? `سلسلتك ${streak} أيام لن تضيع بيوم واحد.` : 'كل بطل بدأ من الصفر.'} 💪\n\nالبداية فقط 5 دقائق. افتح التطبيق، ابدأ تمريناً واحداً. الجسم سيأخذك هو.\n\n"الانضباط يصنع ما يعجز عنه الحماس" — أنت هنا = أنت منضبط. ابدأ الآن! 🔥`,
      `${name}، الفرق بين من يتغير ومن لا يتغير: الأول يتدرب حتى لو لم يكن لديه خلق. 🎯\n\nأنت أكملت **${done} يوم** — هذا يعني أنك الأول. 3 تمارين فقط اليوم وانتهيت! 💥`,
      `${name}، جسمك يتذكر كل تمرين حتى لو شعرت أنك لا تتقدم. 🧠\nأسرع نتيجة تراها: بعد 3 أسابيع متتالية. أنت في اليوم **${day}** — لا توقف الآن!`,
    ];
    return motivations[Math.floor(Math.random() * motivations.length)];
  }

  // ── BMI / weight analysis ──
  if (has('bmi','الوزن المثالي','كم وزني المثالي','وزن طبيعي','وزن صحي')) {
    const bmiN = parseFloat(bmi);
    let bmiStatus = '';
    if (bmiN < 18.5) bmiStatus = 'نقص في الوزن';
    else if (bmiN < 25) bmiStatus = 'وزن مثالي ✅';
    else if (bmiN < 30) bmiStatus = 'زيادة طفيفة في الوزن';
    else bmiStatus = 'سمنة — ننصح بمتابعة طبيب';
    const idealW = Math.round((22.5 * Math.pow(cm/100, 2)));
    return `${name}، بناءً على بياناتك:\n\n📏 **الطول:** ${cm} سم\n⚖️ **الوزن:** ${kg} كغ\n📊 **BMI:** ${bmi} — ${bmiStatus}\n🎯 **الوزن المثالي لطولك:** ${idealW-3} – ${idealW+3} كغ\n\nالبرنامج الحالي مناسب جداً لهدفك. استمر! 💪`;
  }

  // ── Sleep / recovery ──
  if (has('نوم','استشفاء','تعافي','راحة','كم نوم','ساعات النوم')) {
    return `${name}، النوم هو "تمرين الليل" الخفي! 😴\n\n**التوصية للرياضيين:**\n• **7-9 ساعات** نوم ليلي\n• نم قبل 11 مساءً إذا تدرب صباحاً\n• تجنب الأكل الثقيل 2 ساعة قبل النوم\n\n**لتحسين جودة النوم:**\n• تمدد خفيف 5 دقائق قبل النوم\n• تقليل الشاشات 30 دقيقة قبل النوم\n• درجة حرارة منخفضة في الغرفة\n\nالعضلات تنمو أثناء النوم — لا تستهن به! 💪`;
  }

  // ── Water / hydration ──
  if (has('ماء','مياه','شرب','ترطيب')) {
    const waterL = (kg * 0.035).toFixed(1);
    return `${name}، احتياجك من الماء يومياً: **${waterL} لتر** (بناءً على وزنك ${kg} كغ) 💧\n\nأيام التمرين: أضف **500-700 مل** إضافية.\n\n**خطة عملية:**\n• كوب كبير فور الاستيقاظ\n• كوب قبل كل وجبة\n• 500مل قبل التمرين و500مل بعده\n• الهدف: بول شفاف أو أصفر فاتح جداً`;
  }

  // ── API Key suggestion ──
  if (has('api','مفتاح','groq','أذكى','أقوى','تحسين المدرب')) {
    return `${name}، أنا الآن في **الوضع المحلي** وأعرف بياناتك كاملة 🤖\n\nللحصول على ردود أكثر تخصصاً ودقة مع الذكاء الاصطناعي:\n1️⃣ افتح الإعدادات ⚙️\n2️⃣ أدخل مفتاح **Groq API** (مجاني من console.groq.com)\n3️⃣ استمتع بمدرب GPT-4 مستوى!\n\nبدون مفتاح: أنا ما زلت هنا أساعدك في كل شيء 💪`;
  }

  // ── Identity / capabilities ──
  if (has('من انت','من أنت','عرف نفسك','ماذا تفعل','ماذا يمكنك','قدرات','مميزات','ايش تسوي','وش تسوي','شو تسوي','ما هو دورك','دورك')) {
    return `${name}، أنا **كوتش فيت** 🤖 — مدربك الذكي في تطبيق AZEM!\n\nأستطيع مساعدتك في:\n💪 **التمارين** — شرح أي تمرين، تعديل الجدول\n🥗 **التغذية** — خطة أكل على وزنك ${kg}كغ وهدف ${goalAr}\n📊 **التقدم** — تقييم أدائك ومتابعة إنجازاتك\n💧 **الصحة** — ماء، نوم، تعافي\n🎨 **التطبيق** — تغيير الثيم، الوضع، البرنامج\n\nفقط اسألني بالعربية الدارجة وأنا أفهم! 🔥`;
  }

  // ── Stretching / flexibility ──
  if (has('تمدد','إطالة','مرونة','يوغا','ظهر','رقبة','مفصل')) {
    return `${name}، التمدد ضروري للتعافي وتجنب الإصابات! 🧘\n\n**روتين تمدد 10 دقائق (بعد كل جلسة):**\n• **رقبة:** 30 ثانية لكل جهة\n• **صدر وكتفين:** 45 ثانية\n• **ظهر علوي:** 45 ثانية\n• **أوتار الركبة:** 45 ثانية لكل ساق\n• **فخذ أمامي:** 45 ثانية لكل جانب\n• **تنفس عميق:** 1 دقيقة\n\nالتمدد يحسن الأداء بنسبة 15-20% في التمارين التالية. 💪`;
  }

  // ── Supplements / creatine / protein powder ──
  if (has('بروتين باودر','مكمل','كرياتين','supplement','protein powder','واي','whey')) {
    return `${name}، المكملات الغذائية ليست ضرورية لنتائج جيدة، لكن:\n\n**الأكثر فائدة للمبتدئين:**\n🥛 **بروتين واي:** مفيد إذا كنت تصعب الحصول على ${Math.round(kg*1.6)}غ يومياً من الطعام\n⚡ **كرياتين مونوهيدرات:** يزيد القوة 10-15% (3-5غ يومياً آمن)\n🌞 **فيتامين D3:** مهم إذا لم تتعرض لشمس كافية\n\n**الأساس الأهم:** الأكل الكافي من الطعام الطبيعي يكفي في مرحلتك. 💪`;
  }

  // ── Specific exercise explanation ──
  if (has('بيربيز','burpee','ضغط','pushup','قرفصاء','squat','بلانك','plank','نط الحبل','متسلق الجبل','رفع الركبة','كيف أؤدي','طريقة')) {
    const exMap = {
      'بيربيز': 'قف مستقيماً → ضع يديك على الأرض → ارجل للخلف (وضعية الضغط) → اضغطة كاملة → ارجل للأمام → قفز عالياً مع رفع الذراعين. **المسافة:** 3×10 مع 30 ثانية راحة.',
      'ضغط': 'يدان بعرض الكتفين → جسم مستقيم → انزل حتى تلامس صدرك الأرض → ارتفع ببطء. **المفتاح:** الجسم كالخشبة طوال الوقت.',
      'قرفصاء': 'قدمان بعرض الكتفين → انزل كأنك تجلس على كرسي → ركبتك لا تتجاوز أصابعك → ظهرك مستقيم.',
      'بلانك': 'ضع ساعديك على الأرض → جسم مستقيم من الرأس للعقب → بطنك مشدودة → تنفس بانتظام.',
      'نط الحبل': 'أمسك الحبل بيدين → حركة المعصم فقط للدوران → انط بكلا القدمين معاً → ابدأ ببطء ثم سرّع.',
    };
    const found = Object.entries(exMap).find(([k]) => m.includes(k));
    if (found) return `${name}، **${found[0]}** — طريقة الأداء الصحيحة:\n\n${found[1]}\n\n**أخطاء شائعة يجب تجنبها:** لا تحبس أنفاسك، راقب شكل جسمك في المرآة إذا أمكن.`;
  }

  // ── General health / wellbeing ──
  if (has('مناعة','صحة','مرض','دواء','سكر','ضغط','قلب','دهون الدم','كوليسترول')) {
    return `${name}، للحصول على أفضل النتائج الصحية من التمرين:\n\n**الفوائد الصحية للبرنامج:**\n❤️ يحسن صحة القلب خلال **3-4 أسابيع** من التمرين المنتظم\n🩺 يخفض ضغط الدم والكوليسترول\n🧠 يحسن المزاج والنوم\n💪 يقوي المناعة\n\n**مهم:** إذا كان لديك حالة طبية، استشر طبيبك قبل رفع شدة التمارين. برنامجنا الحالي مناسب لمعظم الأشخاص الأصحاء.`;
  }

  // ── Thank you / positive responses ──
  if (has('شكرا','مشكور','شكراً','ممتاز','رائع','حلو','جيد جدا','تمام','أحسنت','برافو','thanks','thank')) {
    return `${name}، العفو! 😊 هذا واجبي.\n\nاستمر في التدريب، وأنا دائماً هنا إذا احتجت أي مساعدة. 💪🔥\n\nتذكر: **الاتساق > الشدة** — يوم واحد كل أسبوع أفضل من أسبوع واحد ثم توقف!`;
  }

  // ── Default smart fallback — tries to be helpful with anything ──
  const q = msg.trim();
  if (q.endsWith('?') || q.endsWith('؟') || has('ماذا','كيف','متى','لماذا','هل','ما ','ايش','وش','شو','وين','أين')) {
    return `${name}، سؤال جيد! 🤔\n\nأنا متخصص في اللياقة البدنية وأقدر أساعدك في التمارين، التغذية، التعافي، والبرنامج. سؤالك يبدو خارج نطاق تخصصي مباشرة — لكن إذا له علاقة بالرياضة أو الصحة، أخبرني أكثر.\n\n**جرّب اسألني:**\n• "كيف أؤدي البيربيز صح؟"\n• "ما الأكل المناسب لهدف ${goalAr}؟"\n• "أنا في اليوم ${day} — كيف أكون؟" 💬`;
  }

  return `${name}، أنا مدرب لياقتك الذكي! 💪 اليوم ${day} من برنامجك.\n\nتمارين اليوم: **${todayEx}**\nالسعرات المحروقة حتى الآن: **${cal}** 🔥\n\nاسألني عن التمارين، التغذية، أو البرنامج وأنا أجيبك فوراً! 🤖`;
}

/* ══════════════════════════════════════════
   GEMINI AI COACH ENGINE
══════════════════════════════════════════ */
async function geminiCoachReply(sys, history, apiKey) {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: Array.isArray(m.content) 
          ? m.content.map(p => {
              if (p.type === 'text') return { text: p.text };
              if (p.type === 'image_url') {
                const base64 = p.image_url.url.split(',')[1];
                const mimeType = p.image_url.url.split(';')[0].split(':')[1];
                return { inlineData: { data: base64, mimeType } };
              }
              return { text: '' };
            })
          : [{ text: m.content }]
      })),
      config: {
        systemInstruction: sys,
        temperature: 0.7,
        maxOutputTokens: 1200,
      }
    });

    return response.text || 'لم أتمكن من الرد.';
  } catch (e) {
    console.error('Gemini Error:', e);
    throw e;
  }
}

/* ══════════════════════════════════════════
   AI COACH
══════════════════════════════════════════ */
function openAICoach() {
  const mode = S.mode || 'mobile';
  if (mode === 'mobile') {
    const btn = document.getElementById('tab-btn-coach');
    switchTab('coach', btn || null);
  } else {
    // Desktop/TV: open modal, clear tab first to avoid duplicate coach-inp IDs
    const tabCoach = document.getElementById('tab-coach');
    if (tabCoach) tabCoach.innerHTML = '';
    const modal = document.getElementById('coach-modal');
    if (modal) {
      modal.style.display = 'flex';
      renderCoach();
    }
  }
}

function closeCoachModal() {
  const modal = document.getElementById('coach-modal');
  if (modal) modal.style.display = 'none';
  // Restore coach tab for next mobile use
  renderCoach();
}

function renderCoach() {
  // Render into active coach container: modal (desktop/tv) or tab (mobile)
  const modal = document.getElementById('coach-modal');
  const isModalOpen = modal && modal.style.display !== 'none';
  const target = isModalOpen
    ? document.getElementById('coach-modal-body')
    : document.getElementById('tab-coach');
  const tab = target || document.getElementById('tab-coach');
  if (!tab) return;
  const name = S.user?.name || 'المستخدم';
  const msgs = S.coachHistory || [];
  const hasTyping = msgs.length > 0 && msgs[msgs.length-1].role === 'user';

  tab.innerHTML = `<div style="display:flex;flex-direction:column;height:${isModalOpen ? '100%' : 'calc(100vh - 120px)'};">
    ${!isModalOpen ? `<div style="padding:14px 16px 10px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;">
      <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🤖</div>
      <div style="flex:1;">
        <div style="font-size:15px;font-weight:900;color:var(--txt);">المدرب الذكي</div>
        <div style="font-size:11px;color:${S.apiKey || (typeof SHARED_GROQ_KEY !== 'undefined' && SHARED_GROQ_KEY) ? '#4ade80' : '#f97316'};">${S.apiKey || (typeof SHARED_GROQ_KEY !== 'undefined' && SHARED_GROQ_KEY) ? window.T('coachOnline') : '🤖 محلي — بدون API'}</div>
      </div>
      <button onclick="clearCoachHistory()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">مسح</button>
      <button onclick="startTutorial()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">❓</button>
    </div>` : `<div style="padding:8px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-shrink:0;">
      <button onclick="clearCoachHistory()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">مسح</button>
      <button onclick="startTutorial()" style="background:none;border:1px solid var(--border);color:var(--dim);border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;">❓</button>
    </div>`}
    <div id="coach-msgs" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
      ${msgs.length === 0 ? `
          <div style="text-align:center;padding:24px 16px;">
          <div style="font-size:40px;margin-bottom:10px;">💬</div>
          <div style="font-size:14px;color:var(--dim);line-height:1.9;">مرحباً ${name}! 💪<br>اليوم ${S.currentDay||1} من برنامجك.<br>اسألني أي شيء أو أخبرني كيف حالك.</div>

          <div style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
            ${['📅 اقترح لي برنامج','🍗 ما الأكل بعد التمرين؟','😴 أنا متعب اليوم','🔥 كيف أحرق أسرع؟','📊 قيّم تقدمي','💧 كم أشرب ماء؟'].map(q=>
              `<button onclick="coachAsk('${q}')" style="padding:7px 12px;border-radius:20px;background:var(--card);border:1px solid var(--border);color:var(--txt);font-size:12px;cursor:pointer;font-family:'Cairo',sans-serif;">${q}</button>`
            ).join('')}
          </div>
        </div>` :
        msgs.map((m, idx)=>{
          // Handle multimodal content
          let dispText = '', dispImg = null;
          if (Array.isArray(m.content)) {
            const tp = m.content.find(p=>p.type==='text'); dispText = tp?.text||'';
            const ip = m.content.find(p=>p.type==='image_url'); dispImg = ip?.image_url?.url;
          } else { dispText = m.content || ''; }
          // FIX XSS: sanitize messages before innerHTML rendering
          const sanitize = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
          };
          
          let safeText = '';
          if (m.role === 'user') {
            safeText = sanitize(dispText);
          } else {
            // For assistant, we allow some formatting but sanitize the rest
            // This is a basic approach; a real Markdown parser would be better
            safeText = dispText
              .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') // Basic escape
              .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
              .replace(/\*(.+?)\*/g,'<em>$1</em>')
              .replace(/^• /gm,'<span style="color:var(--gold);">•</span> ');
          }

          const formattedText = safeText;
          const msgId = 'cmsg-' + idx;
          const isLong = formattedText.length > 600 && m.role === 'assistant';
          const textHtml = formattedText ? `<div id="${msgId}" style="padding:10px 14px;font-size:13px;line-height:1.8;color:var(--txt);white-space:pre-wrap;${isLong?'max-height:220px;overflow:hidden;mask-image:linear-gradient(to bottom,black 60%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,black 60%,transparent 100%);':''}">${formattedText}</div>${isLong?`<button onclick="(function(el,btn){el.style.maxHeight='';el.style.maskImage='';el.style.webkitMaskImage='';btn.style.display='none';})(document.getElementById('${msgId}'),this)" style="width:100%;padding:6px;background:none;border-none;border-top:1px solid var(--border);color:var(--gold);font-size:11px;font-family:'Cairo',sans-serif;cursor:pointer;">▼ اقرأ أكثر</button>`:''}` : '';
          return `<div style="display:flex;gap:8px;align-items:flex-end;${m.role==='user'?'flex-direction:row-reverse':''}">
          <div style="width:32px;height:32px;border-radius:50%;background:${m.role==='user'?'rgba(212,168,67,.2)':'linear-gradient(135deg,var(--gold),var(--gd))'};display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${m.role==='user'?'👤':'🤖'}</div>
          <div style="max-width:82%;border-radius:${m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px'};background:${m.role==='user'?'rgba(212,168,67,.12)':'var(--card)'};border:1px solid ${m.role==='user'?'rgba(212,168,67,.25)':'var(--border)'};overflow:hidden;">
            ${dispImg?`<img src="${dispImg}" style="width:100%;max-width:220px;display:block;border-radius:inherit;" loading="lazy">`:''}
            ${textHtml}
          </div>
        </div>`;}).join('')
      }
      ${hasTyping ? `<div style="display:flex;gap:8px;align-items:center;">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--gd));display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div>
        <div style="background:var(--card);border-radius:14px;padding:12px 16px;"><span style="display:inline-flex;gap:4px;"><span style="animation:pulse 1s ease-in-out infinite;opacity:.5">●</span><span style="animation:pulse 1s ease-in-out .2s infinite;opacity:.5">●</span><span style="animation:pulse 1s ease-in-out .4s infinite;opacity:.5">●</span></span></div>
      </div>` : ''}
    </div>
    <div style="text-align:center;font-size:10px;color:var(--dim);padding:3px 12px;opacity:.65;">⚠️ المدرب في مرحلة تجريبية — قد تحدث أخطاء</div>
    <div style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;">
      <label id="coach-img-btn" title="إرسال صورة" style="width:38px;height:38px;border-radius:12px;background:var(--card);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;flex-shrink:0;position:relative;">
        📷
        <input type="file" id="coach-img-inp" accept="image/*" style="display:none" onchange="coachImgSelected(this)">
      </label>
      <label id="coach-pdf-btn" title="رفع PDF" style="width:38px;height:38px;border-radius:12px;background:var(--card);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;flex-shrink:0;">
        📄
        <input type="file" id="coach-pdf-inp" accept=".pdf" style="display:none" onchange="coachPdfSelected(this)">
      </label>
      <div id="coach-img-preview" style="display:none;position:relative;width:38px;height:38px;flex-shrink:0;">
        <img id="coach-img-thumb" style="width:38px;height:38px;border-radius:10px;object-fit:cover;border:1.5px solid var(--gold);">
        <button onclick="coachClearImg()" style="position:absolute;top:-5px;right:-5px;width:16px;height:16px;border-radius:50%;background:#ef4444;border:none;color:#fff;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">✕</button>
      </div>
      <input id="coach-inp" placeholder="${window.T('coachPlaceholder')}"
        style="flex:1;padding:11px 14px;border-radius:14px;background:var(--card);border:1.5px solid var(--border);color:var(--txt);font-family:'Cairo',sans-serif;font-size:14px;outline:none;"
        onkeydown="if(event.key==='Enter')coachSend()"
        onfocus="this.style.borderColor='var(--gold)'" onblur="this.style.borderColor='var(--border)'">
      <button id="coach-send-btn" onclick="coachSend()" style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--gold),var(--gd));border:none;font-size:18px;cursor:pointer;flex-shrink:0;">↑</button>
    </div>
  </div>`;
  setTimeout(()=>{ const el=document.getElementById('coach-msgs'); if(el) el.scrollTop=el.scrollHeight; }, 120);
}

function clearCoachHistory() { S.coachHistory=[]; saveState(); renderCoach(); }
function coachAsk(q) {
  const modal = document.getElementById('coach-modal');
  const isModalOpen = modal && modal.style.display !== 'none';
  const container = isModalOpen ? document.getElementById('coach-modal-body') : document.getElementById('tab-coach');
  const i = container ? container.querySelector('#coach-inp') : document.getElementById('coach-inp');
  if (i) { i.value = q; }
  coachSend();
}

// ── صور المدرب ──
let coachPendingImg = null; // { base64, mediaType }

function coachImgSelected(input) {
  const file = input.files[0];
  if (!file) return;
  // حد أقصى 2MB للصور المرسلة للمدرب
  if (file.size > 2 * 1024 * 1024) {
    showMiniToast('⚠️ الصورة كبيرة جداً (الحد 2MB)');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const [header, base64] = dataUrl.split(',');
    const mediaType = header.match(/:(.*?);/)[1];
    coachPendingImg = { base64, mediaType };
    const thumbEl   = document.getElementById('coach-img-thumb');
    const previewEl = document.getElementById('coach-img-preview');
    const imgBtnEl  = document.getElementById('coach-img-btn');
    if (thumbEl)   thumbEl.src = dataUrl;
    if (previewEl) previewEl.style.display = 'flex';
    if (imgBtnEl)  imgBtnEl.style.display  = 'none';
    // Focus input
    const inpFocus = document.getElementById('coach-inp');
    if (inpFocus) inpFocus.focus();
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function coachClearImg() {
  coachPendingImg = null;
  const previewEl = document.getElementById('coach-img-preview');
  const imgBtnEl  = document.getElementById('coach-img-btn');
  if (previewEl) previewEl.style.display = 'none';
  if (imgBtnEl)  imgBtnEl.style.display  = 'flex';
}

function coachPdfSelected(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showMiniToast('⚠️ الملف أكبر من 5MB'); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    // Send as document type to Groq (treat as text extraction prompt)
    const inp = document.getElementById('coach-inp');
    if (inp) inp.value = `📄 لدي برنامج تدريبي في هذا الـ PDF — طبّقه على تطبيقي`;
    // Store PDF data for next send
    window._coachPendingPdf = { base64, name: file.name };
    showMiniToast('✅ تم تحميل الـ PDF — اضغط إرسال');
    document.getElementById('coach-pdf-btn').style.opacity = '0.5';
  };
  reader.readAsDataURL(file);
}

async function coachSend() {
  // Find the ACTIVE input: in modal (desktop/tv) or in tab (mobile)
  const modal = document.getElementById('coach-modal');
  const isModalOpen = modal && modal.style.display !== 'none';
  const container = isModalOpen
    ? document.getElementById('coach-modal-body')
    : document.getElementById('tab-coach');
  const inp = container ? container.querySelector('#coach-inp') : document.getElementById('coach-inp');
  const msg = inp?.value?.trim();
  const hasImg = !!coachPendingImg;
  const hasPdf = !!window._coachPendingPdf;
  if (!msg && !hasImg && !hasPdf) return;
  if (inp) inp.value = '';
  if (!S.coachHistory) S.coachHistory = [];
  // Build user content (text + optional image)
  const userText = msg || (hasImg ? '📷' : hasPdf ? '📄' : '');
  let userContent;
  if (hasImg) {
    userContent = [
      { type:'image_url', image_url:{ url:`data:${coachPendingImg.mediaType};base64,${coachPendingImg.base64}` } },
      { type:'text', text: msg || 'حلل هذه الصورة' }
    ];
  } else if (hasPdf) {
    userContent = [
      { type:'text', text: (msg || 'طبّق هذا البرنامج') + `

[PDF: ${window._coachPendingPdf.name}]
(ملاحظة: حلّل محتوى هذا البرنامج وطبّقه على بيانات المستخدم)` }
    ];
    window._coachPendingPdf = null;
    const pdfBtn = document.getElementById('coach-pdf-btn');
    if (pdfBtn) pdfBtn.style.opacity = '1';
  } else {
    userContent = userText;
  }
  if (coachPendingImg) { coachPendingImg = null; }
  S.coachHistory.push({role:'user', content: userContent});
  // تقليص استباقي: احتفظ بآخر 20 رسالة فقط لتجنب تجاوز حد السياق
  if (S.coachHistory.length > 40) S.coachHistory = S.coachHistory.slice(-40);
  saveState(); renderCoach();
  // Lock input AFTER renderCoach (which recreates the DOM elements)
  const freshInp = document.getElementById('coach-inp');
  const freshBtn = document.getElementById('coach-send-btn');
  if (freshInp) freshInp.disabled = true;
  if (freshBtn) { freshBtn.textContent = '⏳'; freshBtn.disabled = true; }
  setTimeout(()=>{const m=document.getElementById('coach-msgs');if(m)m.scrollTop=m.scrollHeight;},80);

  const apiKey = S.apiKey || (typeof SHARED_GEMINI_KEY !== 'undefined' ? SHARED_GEMINI_KEY : '') || (typeof SHARED_GROQ_KEY !== 'undefined' ? SHARED_GROQ_KEY : '') || '';
  const isGemini = apiKey.startsWith('AIza') || (S.apiKey && S.apiKey.startsWith('AIza')) || (typeof SHARED_GEMINI_KEY !== 'undefined' && SHARED_GEMINI_KEY.startsWith('AIza'));

  if (!apiKey) {
    // ── Local AI Engine — smart offline coach ──
    if (hasPdf) {
      window._coachPendingPdf = null;
      const pdfBtn = document.getElementById('coach-pdf-btn');
      if (pdfBtn) pdfBtn.style.opacity = '1';
      S.coachHistory.push({role:'assistant', content:'⚠️ رفع PDF يتطلب مفتاح Groq — أضف مفتاحك من الإعدادات ⚙️'});
      saveState(); renderCoach();
      const inpElL2 = document.getElementById('coach-inp');
      if (inpElL2) inpElL2.disabled = false;
      const sBtnL2 = document.getElementById('coach-send-btn');
      if (sBtnL2) { sBtnL2.textContent = '↑'; sBtnL2.disabled = false; }
      return;
    }
    const localReply = localCoachReply(msg || '', S);
    S.coachHistory.push({role:'assistant', content: localReply});
    saveState(); renderCoach();
    const inpElL = document.getElementById('coach-inp');
    if (inpElL) inpElL.disabled = false;
    const sBtnL = document.getElementById('coach-send-btn');
    if (sBtnL) { sBtnL.textContent = '↑'; sBtnL.disabled = false; }
    setTimeout(()=>{const m=document.getElementById('coach-msgs');if(m)m.scrollTop=m.scrollHeight;},100);
    return;
  }

  const u = S.user || {};
  const progDays = u.programDays || 30;
  const goalAr = {burn:'حرق الدهون', muscle:'بناء العضلات', fitness:'تحسين اللياقة', health:'الصحة العامة'}[u.goal] || 'عام';
  const bmi = (u.weight && u.height) ? (u.weight / Math.pow(u.height/100, 2)).toFixed(1) : '—';
  // ✅ حساب BMR لاستخدامه في system prompt
  const _isFemale = u.gender === 'female';
  const bmr = (u.weight && u.height && u.age)
    ? Math.round(_isFemale
        ? 10*u.weight + 6.25*u.height - 5*u.age - 161
        : 10*u.weight + 6.25*u.height - 5*u.age + 5)
    : '—';

  // Build schedule summary for AI
  const WEEK_AR = ['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'];
  let schedSummary = '';
  try {
    for (let d = 1; d <= Math.min(progDays, 9); d++) {
      const sched = getDaySchedule(d);
      schedSummary += `يوم${d}(${sched.label||sched.type}): ${sched.type==='rest'?'راحة':(sched.exercises||[]).map(e=>e.nameAr).join('،')}\n`;
    }
  } catch(e) {}

  const todaySched = (() => { try { return getDaySchedule(S.currentDay||1); } catch(e) { return null; } })();
  const todayEx = todaySched?.exercises?.map(e => `${e.nameAr}(${e.sets}×${e.reps}${e.repsLabel||'تكرار'})`).join('، ') || '—';

  const ALL_EX_LIST = [...EXERCISES, ...(S.customExercises||[])].map(e =>
    `${e.id}→${e.nameAr}(${e.type==='timer'?e.reps+'ث':e.type==='distance'?e.reps+'م':e.reps+'تكرار'}, ${e.sets}مج)`
  ).join(' | ');

  // ── Language-aware goal label ──
  const _lang = currentLang || 'ar';
  const _isEn = _lang === 'en', _isFr = _lang === 'fr';
  const _T = (ar, en, fr) => _isEn ? en : _isFr ? fr : ar;

  const goalLabel = {
    burn:    _T('حرق الدهون',      'Fat Burn',         'Brûler les graisses'),
    muscle:  _T('بناء العضلات',    'Muscle Building',  'Musculation'),
    fitness: _T('تحسين اللياقة',   'Improve Fitness',  'Améliorer la forme'),
    health:  _T('الصحة العامة',    'General Health',   'Santé générale'),
  }[u.goal] || 'general';

  // ── Language instruction for system prompt ──
  const langInstruction = _isEn
    ? `LANGUAGE RULE: The user's app language is English. You MUST reply in clear, friendly English at all times — even if the user writes in another language. Exercise names can use English terms.`
    : _isFr
      ? `RÈGLE DE LANGUE: La langue de l'application est le français. Tu DOIS répondre en français clair et amical — même si l'utilisateur écrit dans une autre langue. Les noms d'exercices peuvent utiliser des termes français ou anglais.`
      : `قاعدة اللغة: لغة التطبيق عربية. اردّ دائماً بالعربية البسيطة الواضحة — حتى لو كتب المستخدم بلغة أخرى. أسماء التمارين بالعربية أو بالإنجليزية عند الضرورة.`;

  const sys = _T(
    `أنت "كوتش فيت" — مدرب لياقة بدنية خبير ومحلل أداء رياضي احترافي مدمج في تطبيق AZEM (عزم).`,
    `You are "FitCoach" — an expert fitness trainer and performance analyst integrated into the AZEM app.`,
    `Tu es "CoachFit" — un coach fitness expert intégré dans l'application AZEM.`
  ) + `

${langInstruction}

══════════════════════════════════
🧠 ${_T('كيف تفكر قبل كل رد:','How to think before each reply:','Comment penser avant chaque réponse:')}
══════════════════════════════════
${_T(
  '١. اقرأ بيانات المستخدم بعناية — لا تتجاهل أي رقم\n٢. حدّد حالته الآن: مبتدئ؟ متعب؟ يتقدم؟ يحتاج تعديل؟\n٣. قارن هدفه بأدائه الفعلي\n٤. قدّم رداً مخصصاً لهذا الشخص تحديداً — ليس إجابة عامة',
  '1. Read user data carefully — ignore nothing\n2. Identify their state: beginner? tired? progressing?\n3. Compare goal vs actual performance\n4. Give a personalized reply — not generic advice',
  '1. Lis les données avec attention — rien à ignorer\n2. Identifie son état: débutant? fatigué? en progression?\n3. Compare objectif et performance réelle\n4. Réponds de façon personnalisée — pas de conseils génériques'
)}

══════════════════════════════════
👤 ${_T('بيانات المستخدم:','User data:','Données utilisateur:')}
══════════════════════════════════
${_T('الاسم:','Name:',' Prénom:')} ${u.name||'—'}
${_T('العمر:','Age:','Âge:')} ${u.age||'—'} | ${_T('الجنس:','Gender:','Genre:')} ${u.gender==='female'?_T('أنثى','Female','Femme'):u.gender==='male'?_T('ذكر','Male','Homme'):'—'}
${_T('الوزن:','Weight:','Poids:')} ${u.weight||'—'} kg | ${_T('الطول:','Height:','Taille:')} ${u.height||'—'} cm | BMI: ${bmi} | BMR: ${bmr}
${_T('الهدف:','Goal:','Objectif:')} ${goalLabel} | ${_T('البرنامج:','Program:','Programme:')} ${u.programDays||30} ${_T('يوم','days','jours')}
${_T('اليوم الحالي:','Current day:','Jour actuel:')} ${S.currentDay||1} | ${_T('الأيام المكتملة:','Completed days:','Jours complétés:')} ${(S.completedDays||[]).length}
${_T('السلسلة:','Streak:','Série:')} ${S.streak||0} ${_T('أيام','days','jours')} | ${_T('السعرات:','Calories:','Calories:')} ${S.calories||0}
${_T('وقت التدريب:','Workout time:','Heure d\'entraînement:')} ${u.trainTime||'—'} | ${_T('البداية:','Start:','Début:')} ${u.startDate||'—'}

══════════════════════════════════
📅 ${_T(`تمارين اليوم ${S.currentDay||1}:`,`Today's exercises (day ${S.currentDay||1}):`,`Exercices du jour ${S.currentDay||1}:`)}
══════════════════════════════════
${todayEx}

══════════════════════════════════
📋 ${_T('سجل آخر التدريبات (14 يوم):','Last 14 training sessions:','14 dernières séances:')}
══════════════════════════════════
${(()=>{const log=Object.values(S.trainingLog||{}).sort((a,b)=>b.day-a.day).slice(0,14);return log.length?log.map(e=>`day${e.day}(${e.date||''}): ${(e.exercises||[]).join(',')} | ${e.calories||0}cal | ${e.duration||0}min`).join('\n'):'(no log yet)';})()}

══════════════════════════════════
📊 ${_T('مقارنة الأسبوع:','Weekly comparison:','Comparaison hebdo:')}
══════════════════════════════════
${(()=>{
  const allLog = Object.values(S.trainingLog||{}).sort((a,b)=>b.day-a.day);
  const thisWeek = allLog.slice(0,7);
  const lastWeek = allLog.slice(7,14);
  if (!thisWeek.length || !lastWeek.length) return '(not enough data)';
  const thisCalAvg = Math.round(thisWeek.reduce((s,e)=>s+(e.calories||0),0)/thisWeek.length);
  const lastCalAvg = Math.round(lastWeek.reduce((s,e)=>s+(e.calories||0),0)/lastWeek.length);
  const diff = thisCalAvg - lastCalAvg;
  const pct = lastCalAvg ? Math.abs(Math.round((diff/lastCalAvg)*100)) : 0;
  const trend = diff > 0 ? '📈 +'+pct+'%' : diff < 0 ? '📉 -'+pct+'%' : '➡️ stable';
  const allLogSorted = Object.values(S.trainingLog||{}).sort((a,b)=>b.day-a.day);
  let cnt=0; for(const e of allLogSorted){if(e.exercises&&e.exercises.length)cnt++;else break;}
  const restWarning = cnt >= 5 ? `⚠️ ${_T('تحذير: '+cnt+' أيام متتالية — يجب الراحة!', cnt+' consecutive days — rest needed!', cnt+' jours consécutifs — repos nécessaire!')}` : '';
  return `${_T('هذا الأسبوع','This week','Cette semaine')}: ${thisCalAvg} cal/session | ${_T('الأسبوع الماضي','Last week','Semaine passée')}: ${lastCalAvg} cal/session | ${trend}${restWarning?'\n'+restWarning:''}`;
})()}

══════════════════════════════════
🧠 ${_T('تحليل التعب:','Fatigue analysis:','Analyse de fatigue:')}
══════════════════════════════════
${(()=>{
  const log = Object.values(S.trainingLog||{}).sort((a,b)=>b.day-a.day).slice(0,7);
  if (!log.length) return '(no data)';
  const avgCal = Math.round(log.reduce((s,e)=>s+(e.calories||0),0)/log.length);
  const avgDur = Math.round(log.reduce((s,e)=>s+(e.duration||0),0)/log.length);
  const trend = log.length>1 ? (log[0].calories > log[1].calories ? '📈' : '📉') : '—';
  const muscleGroups = {};
  log.forEach(e=>{
    const ids = e.exerciseIds || [];
    ids.forEach(id=>{
      const ex = [...(typeof EXERCISES!=='undefined'?EXERCISES:[]),...(S.customExercises||[])].find(x=>x.id===id);
      if(ex?.muscles) ex.muscles.split('،').forEach(m=>{muscleGroups[m.trim()]=(muscleGroups[m.trim()]||0)+1;});
    });
  });
  const topMuscle = Object.entries(muscleGroups).sort((a,b)=>b[1]-a[1])[0];
  const fatigue = topMuscle && topMuscle[1]>=4
    ? `⚠️ ${_T('تحذير: '+topMuscle[0]+' مُرهقة ('+topMuscle[1]+' جلسات)','Warning: '+topMuscle[0]+' overworked ('+topMuscle[1]+' sessions)','Alerte: '+topMuscle[0]+' surmené ('+topMuscle[1]+' séances)')}`
    : _T('✅ توزيع متوازن','✅ Balanced muscle distribution','✅ Distribution musculaire équilibrée');
  return `avg ${avgCal} cal/session | avg ${avgDur}min | trend: ${trend} | ${fatigue}`;
})()}

══════════════════════════════════
💪 ${_T('التمارين المتاحة:','Available exercises:','Exercices disponibles:')}
══════════════════════════════════
${ALL_EX_LIST}

══════════════════════════════════
🎨 ${_T('الثيمات:','Themes:','Thèmes:')} default, fire, ocean, nature, neon, purple, light
══════════════════════════════════

══════════════════════════════════
🔧 FITCMD ${_T('(تحكم بالتطبيق):','(app control):','(contrôle app):')}
══════════════════════════════════
${_T('أضف في نهاية ردك:','Add at the end of your reply:','Ajouter à la fin de ta réponse:')}
\`\`\`FITCMD
{"cmd":"..."}
\`\`\`

${_T('الأوامر:','Commands:','Commandes:')}
setDay → {"cmd":"setDay","day":1,"exercises":["rope","burpee","squat"]}
setRest → {"cmd":"setRest","day":4}
setWeek → {"cmd":"setWeek","days":[["rope","burpee"],"rest",["squat","pushup"],"rest",["climber"],"rest","rest"]}
setTheme → {"cmd":"setTheme","theme":"ocean"}
setSetting → {"cmd":"setSetting","setting":"goal","value":"burn"}
setCurrentDay → {"cmd":"setCurrentDay","day":5}
addCalories → {"cmd":"addCalories","amount":150}
addExercise → {"cmd":"addExercise","exercise":{"id":"wall_sit","nameAr":"الجلوس على الجدار","nameEn":"Wall Sit","type":"timer","sets":3,"reps":30,"rest":30,"icon":"🧱","steps":["stand against wall","lower to 90°","hold"]}}
addExToDay → {"cmd":"addExToDay","day":2,"exId":"wall_sit"}

${_T('IDs المدمجة:','Built-in IDs:','IDs intégrés:')} rope,burpee,highknee,sqjump,starjump,climber,boxing,plank,crunch,legrise,bicycle,russian,hollow,pushup,squat,chair
${_T('IDs أنشأتها:','Coach-created IDs:','IDs créés:')} ${(S.customExercises||[]).filter(e=>e._coachCreated).map(e=>e.id+' ('+e.nameAr+')').join(', ') || '—'}
${_T('التمارين المخصصة:','Custom exercises:','Exercices personnalisés:')} ${(S.customExercises||[]).map(e=>e.id+' ('+e.nameAr+')').join(', ') || '—'}

══════════════════════════════════
📐 ${_T('قواعد الرد:','Reply rules:','Règles de réponse:')}
══════════════════════════════════
- ${_T('**ردّ دائماً بنفس لغة التطبيق** ('+currentLang+') — هذا إلزامي','**Always reply in the app language** ('+currentLang+') — mandatory','**Toujours répondre dans la langue de l\'app** ('+currentLang+') — obligatoire')}
- ${_T('لا تكرر نفس الجملة أكثر من مرة','Do not repeat the same sentence','Ne répète pas la même phrase')}
- ${_T('3-6 جمل إلا إذا طُلب برنامج كامل','3-6 sentences unless a full program is requested','3-6 phrases sauf si un programme complet est demandé')}
- ${_T('لا تبدأ بنفي — ابدأ بالمساعدة أو باسم المستخدم','Don\'t start with negation — start with help or user\'s name','Ne commence pas par un refus — commence par l\'aide ou le prénom')}

══════════════════════════════════
⚠️ ${_T('قاعدة حرجة — خلط الحروف ممنوع:','CRITICAL — No script mixing:','CRITIQUE — Pas de mélange d\'écriture:')}
══════════════════════════════════
- ${_T(
  '**ممنوع منعاً باتاً** وضع حروف كورية أو يابانية أو لاتينية أو أي حروف أجنبية داخل كلمة عربية — هذا خطأ لغوي خطير. كل كلمة يجب أن تكون بحروف عربية خالصة أو إنجليزية خالصة، لا خلط أبداً.',
  '**Strictly forbidden** to mix Arabic, Korean, Japanese or any non-Latin characters inside English words. Every word must be pure Latin script.',
  '**Strictement interdit** de mélanger des caractères arabes, coréens, japonais ou autres dans les mots français. Chaque mot doit être en script latin pur.'
)}
- ${_T(
  'أسماء التمارين: إما عربية خالصة مثل (القرفصاء، الضغط) أو إنجليزية خالصة مثل (squat, push-up) — لا مزيج أبداً.',
  'Exercise names: pure English like (squat, push-up) — never mixed with other scripts.',
  'Noms d\'exercices: français pur (squat, pompes) — jamais mélangés avec d\'autres écritures.'
)}
- ${_T(
  'تحقق من كل كلمة قبل الإرسال — إذا رأيت حرفاً غريباً داخل كلمة عربية فأعد كتابتها فوراً.',
  'Check every word before sending — if you see a non-Latin character inside an English word, rewrite it immediately.',
  'Vérifiez chaque mot avant d\'envoyer — si un caractère non-latin apparaît dans un mot français, réécrivez-le.'
)}

══════════════════════════════════
✍️ ${_T('التنسيق:','Formatting:','Formatage:')}
══════════════════════════════════
- ${_T('**نص** للعناوين، • للقوائم','**text** for headings, • for lists','**texte** pour titres, • pour listes')}
- ${_T('سطر فارغ بين الأقسام','empty line between sections','ligne vide entre sections')}

══════════════════════════════════
🎯 FITCMD ${_T('قواعد:','rules:','règles:')}
══════════════════════════════════
- ${_T('عند تنفيذ أمر: اكتب ما فعلته في ردك','When executing a command: describe what you did','Lors d\'une commande: décris ce que tu as fait')}
- ${_T('عند اقتراح برنامج كامل: اعرضه واسأل قبل تطبيقه','When suggesting a full program: show it and ask before applying','Pour un programme complet: montre-le et demande confirmation')}
- ${_T('ممنوع IDs وهمية أو أسماء مكان IDs','No fake IDs or names instead of IDs','Pas de faux IDs ou noms à la place d\'IDs')}
- ${_T('setWeek: 7 أيام بالضبط','setWeek: exactly 7 days','setWeek: exactement 7 jours')}

══════════════════════════════════
💬 ${_T('سلوك عام:','General behavior:','Comportement général:')}
══════════════════════════════════
- ${_T('إذا طلب تعديل: نفّذ فوراً','If edit requested: execute immediately','Si modification demandée: exécuter immédiatement')}
- ${_T('إذا شكا من ألم: أوصِ بالراحة أو الطبيب','If pain complaint: recommend rest or doctor','Si douleur: recommander repos ou médecin')}
- ${_T('إذا كان متحمساً: أضف تحدياً','If enthusiastic: add a challenge','Si enthousiaste: ajouter un défi')}`;
  try {
    let reply = '';
    if (isGemini) {
      reply = await geminiCoachReply(sys, S.coachHistory, apiKey);
    } else {
      const _ctrl = new AbortController();
      const _timeout = setTimeout(() => _ctrl.abort(), 30000);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        signal: _ctrl.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // ✅ نموذج ثابت وموثوق
          max_tokens: 1200,
          temperature: 0.65,
          messages: [
            {role:'system', content: sys},
            ...S.coachHistory.map((m, idx) => {
              // نحتفظ بآخر صورة وآخر PDF في السياق
              const isLast = idx === S.coachHistory.length - 1;
              if (Array.isArray(m.content)) {
                // آخر صورة: أبقِها كاملة
                const hasImg = m.content.find(p=>p.type==='image_url');
                const hasPdf = m.content.find(p=>p.type==='document');
                if ((hasImg || hasPdf) && m.role === 'user') {
                  // تحقق إذا هي آخر رسالة تحتوي صورة/PDF
                  const lastMediaIdx = S.coachHistory.reduce((last, mm, i) => {
                    return Array.isArray(mm.content) && mm.content.find(p=>p.type==='image_url'||p.type==='document') ? i : last;
                  }, -1);
                  if (idx === lastMediaIdx) return {role:m.role, content:m.content};
                }
                const t = m.content.find(p=>p.type==='text');
                return {role:m.role, content: t?.text || '📷 [صورة]'};
              }
              return {role:m.role, content:m.content};
            })
          ]
        })
      });
      clearTimeout(_timeout);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'خطأ في الـ API');
      reply = data.choices?.[0]?.message?.content || 'لم أتمكن من الرد.';
    }

    // Execute all FITCMD blocks in the response
    let execCount = 0;
    const cmdRegex = /```FITCMD\s*([\s\S]*?)```/g;
    let cmdMatch;
    while ((cmdMatch = cmdRegex.exec(reply)) !== null) {
      try {
        const cmd = JSON.parse(cmdMatch[1].trim());
        if (coachExecCmd(cmd)) execCount++;
      } catch(e) {}
    }
    reply = reply.replace(/```FITCMD[\s\S]*?```/g, '').trim();
    // لا نضيف رسالة تلقائية — المدرب يكتبها بنفسه في ردّه

    // إذا أضاف المدرب تمريناً جديداً — أبلغ المستخدم برفع الصورة يدوياً
    if (window._coachNewExId) {
      reply += '\n\n📷 **ملاحظة:** تمرين **' + window._coachNewExName + '** أُضيف بنجاح. يمكنك إضافة صورة له يدوياً من **مكتبة التمارين** ← ابحث عنه ← اضغط عليه ← 📷';
      window._coachNewExId = null;
      window._coachNewExName = null;
    }

    S.coachHistory.push({role:'assistant', content: reply});
    // حد أقصى 40 رسالة للتاريخ (20 محادثة) لحماية localStorage
    // FIX#8: strip image data from history before saving (kills localStorage bloat)
    // Cache images in memory before stripping from history
    if (!window._coachImgCache) window._coachImgCache = [];
    S.coachHistory.forEach((m,idx) => {
      if (Array.isArray(m.content)) {
        const img = m.content.find(p => p.type === 'image_url');
        const txt = m.content.find(p => p.type === 'text');
        if (img) window._coachImgCache.push({ idx, img, txt: txt?.text || '' });
      }
    });
    // Keep only last 3 images in cache
    if (window._coachImgCache.length > 3) window._coachImgCache = window._coachImgCache.slice(-3);
    
    S.coachHistory = S.coachHistory.map(m => {
      if (Array.isArray(m.content)) {
        const txt = m.content.find(p => p.type === 'text');
        return { role: m.role, content: txt ? txt.text : '📷 [صورة]' };
      }
      return m;
    });
    if (S.coachHistory.length > 40) S.coachHistory = S.coachHistory.slice(-40);
  } catch(e) {
    const errMsg = e.name === 'AbortError'
      ? '⚠️ انتهت مهلة الاتصال (30 ثانية). تحقق من الإنترنت وحاول مجدداً.'
      : '⚠️ خطأ: ' + (e.message || 'تحقق من مفتاح Groq والإنترنت.');
    S.coachHistory.push({role:'assistant', content: errMsg});
  }
  saveState();
  renderCoach();
  // Re-enable input
  const inpEl = document.getElementById('coach-inp');
  if (inpEl) inpEl.disabled = false;
  const sBtn = document.getElementById('coach-send-btn');
  if (sBtn) { sBtn.textContent = '↑'; sBtn.disabled = false; }
  // Clear pending image
  if (coachPendingImg) coachClearImg();
  // Auto-scroll to bottom
  setTimeout(() => {
    const msgs = document.getElementById('coach-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 50);
}

function coachExecCmd(cmd) {
  if (!cmd || !cmd.cmd) return false;
  let changed = false;

  if (cmd.cmd === 'setDay' && cmd.day != null && Array.isArray(cmd.exercises)) {
    if (cmd.exercises.length === 0) return false;
    const _dayNum = Math.max(1, Math.min(Number(cmd.day), (S.user?.programDays||90)));
    const _allExIds = [...EXERCISES, ...(S.customExercises||[])].map(e => e.id);
    const validExs = cmd.exercises.filter(id => typeof id === 'string' && _allExIds.includes(id));
    if (validExs.length === 0) return false;
    if (!S.customSchedule) S.customSchedule = {};
    S.customSchedule[_dayNum] = validExs;
    saveState(); loadCustomSchedule();
    if (S.currentDay === _dayNum) renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'setRest' && cmd.day != null) {
    if (!S.customSchedule) S.customSchedule = {};
    S.customSchedule[Number(cmd.day)] = 'rest';
    saveState();
    if (S.currentDay === Number(cmd.day)) renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'setWeek' && Array.isArray(cmd.days)) {
    if (cmd.days.length === 0) return false;
    const _allExIds2 = [...EXERCISES, ...(S.customExercises||[])].map(e => e.id);
    let weekChanged = false;
    if (!S.customSchedule) S.customSchedule = {};
    cmd.days.forEach((v, i) => {
      const dayNum = i + 1;
      if (v === 'rest') {
        // يوم راحة صريح — فقط عند 'rest' النصية
        S.customSchedule[dayNum] = 'rest';
        weekChanged = true;
      } else if (v === null || v === undefined) {
        // null = لا تغيير لهذا اليوم — نتجاهله
      } else if (Array.isArray(v) && v.length > 0) {
        // مصفوفة تمارين — تحقق ان IDs صحيحة
        const validIds = v.filter(id => typeof id === 'string' && _allExIds2.includes(id));
        if (validIds.length > 0) {
          S.customSchedule[dayNum] = validIds;
          weekChanged = true;
        }
      }
      // اذا كانت القيمة undefined او مصفوفة فارغة نتجاهلها ولا نكتب فوق
    });
    if (!weekChanged) return false;
    saveState(); loadCustomSchedule(); renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'setTheme' && cmd.theme) {
    const valid = ['default','fire','ocean','nature','neon','purple','light'];
    setTheme(valid.includes(cmd.theme) ? cmd.theme : 'default');
    changed = true;
  }
  if (cmd.cmd === 'setMode' && cmd.mode) {
    const map = {mobile:'mobile',جوال:'mobile',desktop:'desktop',كمبيوتر:'desktop'};
    S.mode = map[cmd.mode] || 'mobile';
    saveState(); applyMode();
    changed = true;
  }
  if (cmd.cmd === 'setSetting') {
    if (!S.user) S.user = {};
    if (cmd.setting === 'sound') { S.soundOn = !!cmd.value; saveState(); }
    if (cmd.setting === 'tick')  { S.tickOn  = !!cmd.value; saveState(); }
    if (cmd.setting === 'goal' && cmd.value)  { S.user.goal = cmd.value; saveState(); }
    if (cmd.setting === 'days' && cmd.value)  { S.user.programDays = parseInt(cmd.value); saveState(); }
    if (cmd.setting === 'trainTime' && cmd.value) { S.user.trainTime = cmd.value; saveState(); }
    changed = true;
  }
  if (cmd.cmd === 'setCurrentDay' && cmd.day != null) {
    S.currentDay = Math.max(1, Math.min(parseInt(cmd.day), (S.user && S.user.programDays) || 90));
    saveState(); renderWorkoutTab();
    changed = true;
  }
  if (cmd.cmd === 'addCalories' && cmd.amount != null) {
    S.calories = (S.calories || 0) + parseInt(cmd.amount);
    saveState();
    changed = true;
  }

  // ── إنشاء تمرين جديد ──
  if (cmd.cmd === 'addExercise' && cmd.exercise) {
    // تأكد من أن الـ ID فريد
    const _allIds = [...EXERCISES, ...(S.customExercises||[])].map(e=>e.id);
    if (_allIds.includes(cmd.exercise.id)) {
      // ID مكرر — أضف suffix
      cmd.exercise.id = cmd.exercise.id + '_' + Date.now().toString(36).slice(-4);
    }
    const ex = cmd.exercise;
    if (!ex.id || !ex.nameAr) return false;
    if (!S.customExercises) S.customExercises = [];
    // Don't duplicate
    const exists = S.customExercises.find(e => e.id === ex.id);
    if (!exists) {
      const newEx = {
        id:       ex.id,
        nameAr:   ex.nameAr,
        nameEn:   ex.nameEn   || ex.nameAr,
        icon:     ex.icon     || '💪',
        color:    ex.color    || '#f59e0b',
        muscles:  ex.muscles  || '',
        type:     ex.type     || 'reps',
        sets:     parseInt(ex.sets)  || 3,
        reps:     parseInt(ex.reps)  || 10,
        repsLabel:ex.repsLabel || (ex.type === 'timer' ? 'ثانية' : 'تكرار'),
        rest:     parseInt(ex.rest)  || 30,
        steps:    Array.isArray(ex.steps) ? ex.steps : [],
        _coachCreated: true,
      };
      S.customExercises.push(newEx);
      saveState();
      window._coachNewExId = newEx.id;
      window._coachNewExName = newEx.nameAr || newEx.id;
      changed = true;
    }
  }

  // ── حذف تمرين مخصص ──
  if (cmd.cmd === 'deleteExercise' && cmd.exId) {
    if (S.customExercises) {
      S.customExercises = S.customExercises.filter(e => e.id !== cmd.exId);
      // تنظيف customSchedule من ID المحذوف
      if (S.customSchedule) {
        Object.keys(S.customSchedule).forEach(day => {
          if (Array.isArray(S.customSchedule[day])) {
            S.customSchedule[day] = S.customSchedule[day].filter(id => id !== cmd.exId);
            if (S.customSchedule[day].length === 0) S.customSchedule[day] = 'rest';
          }
        });
      }
      saveState(); renderWorkoutTab();
      changed = true;
    }
  }

  // ── إضافة التمرين للجدول اليومي ──
  if (cmd.cmd === 'addExToDay' && cmd.day != null && cmd.exId) {
    if (!S.customSchedule) S.customSchedule = {};
    const dayNum = Math.max(1, Math.min(Number(cmd.day), (S.user?.programDays||90)));
    const _allExCheck = [...EXERCISES, ...(S.customExercises||[])];
    if (!_allExCheck.find(e => e.id === cmd.exId)) return false; // ID غير موجود
    const current = S.customSchedule[dayNum] || getDaySchedule(dayNum).exercises.map(e => e.id);
    if (!current.includes(cmd.exId)) {
      S.customSchedule[dayNum] = [...current, cmd.exId];
      saveState(); loadCustomSchedule();
      if (S.currentDay === dayNum) renderWorkoutTab();
    }
    changed = true;
  }

  if (changed) { try { renderProgress(); } catch(e) {} }
  return changed;
}


/* ══════════════════════════════════════════
   EXERCISE LIBRARY (inside day editor)
══════════════════════════════════════════ */
const LIB_CATEGORY = {
  rope:'cardio', burpee:'cardio', highknee:'cardio', sqjump:'lower',
  starjump:'cardio', climber:'core', boxing:'cardio', plank:'core',
  crunch:'core', legrise:'core', bicycle:'core', russian:'core',
  hollow:'core', pushup:'upper', squat:'lower', chair:'upper',
};
let deLibFilter = 'all';

function deShowLibrary() {
  document.getElementById('de-panel-list').style.display = 'none';
  const lib = document.getElementById('de-panel-library');
  lib.style.display = 'flex';
  // Clear search
  const s = document.getElementById('de-lib-search');
  if (s) s.value = '';
  // Render filter chips
  const cats = [{id:'all',label:'الكل'},{id:'cardio',label:'كارديو'},{id:'core',label:'كور'},{id:'upper',label:'جسم علوي'},{id:'lower',label:'جسم سفلي'},{id:'custom',label:'مخصص'}];
  document.getElementById('de-lib-filters').innerHTML = cats.map((c,i) =>
    `<button data-cat="${c.id}" onclick="deSetFilter(this)" class="lib-chip${i===0?' lib-filter-active':''}" style="padding:6px 14px;border-radius:20px;border:1.5px solid ${i===0?'var(--gold)':'var(--border)'};background:${i===0?'rgba(212,168,67,.15)':'transparent'};color:${i===0?'var(--gold)':'var(--dim)'};font-family:'Cairo',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:.2s;">${c.label}</button>`
  ).join('');
  deRenderLibGrid();
}
function deSetFilter(btn) {
  document.querySelectorAll('.lib-chip').forEach(b => {
    b.classList.remove('lib-filter-active');
    b.style.borderColor = 'var(--border)';
    b.style.background = 'transparent';
    b.style.color = 'var(--dim)';
  });
  btn.classList.add('lib-filter-active');
  btn.style.borderColor = 'var(--gold)';
  btn.style.background = 'rgba(212,168,67,.15)';
  btn.style.color = 'var(--gold)';
  deRenderLibGrid();
}

function deHideLibrary() {
  document.getElementById('de-panel-library').style.display = 'none';
  document.getElementById('de-panel-list').style.display = 'flex';
}

function deRenderLibGrid() {
  const grid = document.getElementById('de-lib-grid');
  if (!grid) return;
  const searchEl = document.getElementById('de-lib-search');
  const query = (searchEl?.value || '').trim().toLowerCase();
  const activeFilter = document.querySelector('#de-lib-filters .lib-filter-active')?.dataset?.cat || 'all';
  const catMap = {
    cardio: ['rope','burpee','highknee','sqjump','starjump','climber','boxing'],
    core:   ['plank','crunch','legrise','bicycle','russian','hollow'],
    upper:  ['pushup','boxing','chair'],
    lower:  ['sqjump','squat','legrise','highknee','starjump']
  };
  // Use dayEditorDay (the day being edited), fallback to currentDay
  const editDay = dayEditorDay || S.currentDay || 1;
  const daySchedule = getDaySchedule(editDay);
  const currentExIds = S.customSchedule?.[editDay]
    ? S.customSchedule[editDay]
    : (daySchedule.exercises || []).map(e => typeof e === 'string' ? e : e.id);
  const allEx = [...EXERCISES, ...(S.customExercises || [])];

  const filtered = allEx.filter(ex => {
    if (activeFilter === 'custom') return !!(S.customExercises?.find(e => e.id === ex.id));
    if (activeFilter !== 'all' && !catMap[activeFilter]?.includes(ex.id)) return false;
    if (query) {
      const q = query.toLowerCase();
      return ex.nameAr.includes(q) || (ex.nameEn||'').toLowerCase().includes(q) || (ex.muscles||'').includes(q);
    }
    return true;
  });
  if (!filtered.length) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--dim);">لا توجد نتائج</div>';
    return;
  }

  // Grid layout: 2 columns
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr';
  grid.style.gap = '10px';
  grid.style.padding = '8px 16px 80px';
  // ✅ force square cells on Android WebView
  requestAnimationFrame(() => {
    const gw = grid.offsetWidth || (window.innerWidth - 32);
    const cellW = Math.floor((gw - 42) / 2);
    if (cellW > 0) grid.style.gridAutoRows = cellW + 'px';
  });

  grid.innerHTML = filtered.map(ex => {
    const inDay = currentExIds.includes(ex.id);
    const isCustom = !!S.customExercises?.find(e=>e.id===ex.id);
    const customImg = S.customImages?.[ex.id];
    const gifSrc = getExGif(ex.id);
    const hasSrc = !!(customImg || gifSrc);
    const imgSrc = customImg || gifSrc || '';
    const borderColor = inDay ? 'var(--gold)' : 'var(--border)';
    const bgTint = ex.color ? ex.color + '22' : 'rgba(212,168,67,.1)';
    const iconFallback = `<div style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-size:44px;">${ex.icon}</div>`;
    const mediaHTML = hasSrc
      ? `<img src="${imgSrc}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:0;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">${iconFallback}`
      : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px;">${ex.icon}</div>`;
    const checkmark = inDay ? `<div style="position:absolute;top:7px;left:7px;width:24px;height:24px;border-radius:50%;background:var(--gold);color:var(--night);font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2);">✓</div>` : '';
    const badge = isCustom ? `<div style="position:absolute;top:7px;right:7px;font-size:9px;padding:2px 7px;border-radius:6px;background:rgba(99,102,241,.9);color:#fff;font-weight:700;">مخصص</div>` : '';
    const statusBtn = `<div style="margin-top:6px;font-size:11px;font-weight:800;padding:3px 8px;border-radius:7px;display:inline-block;background:${inDay ? 'rgba(212,168,67,.15)' : 'rgba(128,128,128,.1)'};color:${inDay ? 'var(--gold)' : 'var(--dim)'};">${inDay ? '✓ مضاف' : '+ أضف'}</div>`;
    return `<div onclick="deLibAddEx('${ex.id}')" style="border-radius:16px;background:var(--card);border:2px solid ${borderColor};overflow:hidden;cursor:pointer;position:relative;aspect-ratio:1/1;">`
      + `<div style="position:absolute;inset:0;background:${bgTint};overflow:hidden;">`
      + mediaHTML + checkmark + badge
      + `<div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 100%);">`
      + `<div style="font-size:11px;font-weight:900;color:#fff;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ex.nameAr}</div>`
      + `<div style="font-size:9px;color:${inDay ? 'var(--gold)' : 'rgba(255,255,255,.6)'};margin-top:2px;font-weight:700;">${inDay ? '✓ مضاف' : '+ أضف'}</div>`
      + `</div>`
      + `</div></div>`;
  }).join('');
}

function deLibSearch() { deRenderLibGrid(); }


function deLibAddEx(exId) {
  const dayKey = (typeof dayEditorDay !== 'undefined' && dayEditorDay !== null) ? dayEditorDay : S.currentDay || 1;
  // إذا كان اليوم راحة — تحويله لتدريب أولاً
  if (S.customSchedule && S.customSchedule[dayKey] === 'rest') {
    S.customSchedule[dayKey] = [];
  }
  const list = getDayExerciseList(dayKey);
  if (!list.includes(exId)) {
    list.push(exId);
    if (!S.customSchedule) S.customSchedule = {};
    S.customSchedule[dayKey] = list;
    saveState();
    showMiniToast('تمت الإضافة ✅');
  } else {
    // Toggle off if already added
    const idx = list.indexOf(exId);
    list.splice(idx, 1);
    S.customSchedule[dayKey] = list;
    saveState();
    showMiniToast('تم الحذف 🗑️');
  }
  deRenderLibGrid();
  renderDayEditorList();
}

/* ── إضافة تمرين مخصص ── */
function openAddCustomEx() { document.getElementById('add-custom-ex-modal').style.display='flex'; }
function closeAddCustomEx() { document.getElementById('add-custom-ex-modal').style.display='none'; }

function saveCustomEx() {
  const nameAr = document.getElementById('cex-nameAr').value.trim();
  if (!nameAr) { document.getElementById('cex-nameAr').focus(); return; }
  const id = 'custom_' + Date.now();
  const ex = {
    id, isCustom:true, icon: document.getElementById('cex-icon').value.trim()||'💪',
    nameAr, nameEn: document.getElementById('cex-nameEn').value.trim()||nameAr,
    muscles: document.getElementById('cex-muscles').value.trim()||'عام',
    sets: parseInt(document.getElementById('cex-sets').value)||3,
    reps: parseInt(document.getElementById('cex-reps').value)||10,
    type: document.getElementById('cex-type').value,
    rest: parseInt(document.getElementById('cex-rest')?.value)||30,
    color:'#a855f7',
    repsLabel: {reps:'تكرار',timer:'ث',distance:'م'}[document.getElementById('cex-type').value]||'تكرار',
    steps: (document.getElementById('cex-steps').value.trim()||'').split('\n').filter(Boolean),
  };
  const imgData = document.getElementById('cex-img-preview').dataset.src;
  if (!S.customExercises) S.customExercises=[];
  S.customExercises.push(ex);
  if (imgData) { if(!S.customImages)S.customImages={}; S.customImages[id]=imgData; }
  saveState();
  // Reset form
  ['cex-nameAr','cex-nameEn','cex-icon','cex-muscles','cex-steps'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value='';
  });
  ['cex-sets','cex-reps'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = id==='cex-sets'?'3':'10';
  });
  const p = document.getElementById('cex-img-preview');
  if (p) { p.style.backgroundImage=''; p.dataset.src=''; p.textContent='📷'; }
  closeAddCustomEx();
  if (typeof deRenderLibGrid === 'function') deRenderLibGrid();
  showMiniToast('تمت إضافة التمرين ✅');
}

function cexImgUpload(input) {
  const file = input.files[0]; if (!file) return;
  if (file.size > 500 * 1024) {
    showMiniToast('⚠️ الصورة كبيرة جداً (الحد 500KB)');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const p = document.getElementById('cex-img-preview');
    // ✅ ضغط الصورة قبل الحفظ لتجنب تجاوز حد localStorage
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 400;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      p.style.backgroundImage = `url(${compressed})`;
      p.style.backgroundSize = 'cover';
      p.style.backgroundPosition = 'center';
      p.dataset.src = compressed;
      p.textContent = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ══════ DAY EDITOR ══════ */
let dayEditorDay = null;
let dayEditorDragSrc = null;

function openDayEditor(day) {
  dayEditorDay = day;
  const sched = getDaySchedule(day);
  document.getElementById('day-editor-label').textContent = `(${sched.day})`;
  renderDayEditorList();
  document.getElementById('day-editor-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.body.style.touchAction = 'none';
}

function closeDayEditor() {
  document.getElementById('day-editor-modal').style.display = 'none';
  document.body.style.overflow = '';
  document.body.style.touchAction = '';
  render();
  // Also refresh desktop/TV panels
  if (typeof dtRenderExList === 'function') dtRenderExList();
  
}

function getDayExerciseList(day) {
  // Returns the mutable list of exercise IDs for a day (custom or default)
  if (!S.customSchedule) S.customSchedule = {};
  const sched = getDaySchedule(day);
  if (!S.customSchedule[day]) {
    S.customSchedule[day] = [...sched.exercises.map(e => e.id)];
  }
  return S.customSchedule[day];
}

function renderDayEditorList() {
  const list = document.getElementById('day-editor-list');
  const exIds = getDayExerciseList(dayEditorDay);
  const allEx = [...EXERCISES, ...(S.customExercises||[])];

  list.innerHTML = exIds.map((id, i) => {
    const ex = allEx.find(e => e.id === id);
    if (!ex) return '';
    const gifSrc = getExGif(id);
    const thumb = gifSrc
      ? `<img src="${gifSrc}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;">`
      : `<div style="width:44px;height:44px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${ex.icon}</div>`;
    return `<div class="de-row" data-idx="${i}" data-id="${id}"
        ondragover="deDragOver(event)"
        ondrop="deDrop(event,${i})"
        ondragend="deDragEnd()"
        style="display:flex;align-items:center;gap:10px;background:var(--card);border:1.5px solid rgba(212,168,67,.12);border-radius:14px;padding:10px 12px;transition:opacity .25s,transform .2s,box-shadow .2s;">
      <div class="de-handle" data-idx="${i}" onpointerdown="deHandleDown(event,${i})" style="color:var(--gold);font-size:22px;cursor:grab;padding:4px 6px;touch-action:none;user-select:none;flex-shrink:0;border-radius:8px;background:rgba(212,168,67,.08);transition:background .15s;" onmouseenter="this.style.background='rgba(212,168,67,.18)'" onmouseleave="this.style.background='rgba(212,168,67,.08)'">☰</div>
      ${thumb}
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:700;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ex.nameAr}</div>
        <div style="font-size:11px;color:var(--dim);">${ex.sets}×${ex.reps} ${getRepsLabel(ex)} • ${ex.muscles}</div>
      </div>
      <button onclick="dayEditorEditEx('${id}')" style="background:rgba(212,168,67,.12);border:1px solid rgba(212,168,67,.25);color:var(--gold);border-radius:8px;padding:6px 10px;font-size:14px;cursor:pointer;">✏️</button>
      <button onclick="dayEditorDeleteEx(${i})" style="background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.25);color:#e74c3c;border-radius:8px;padding:6px 10px;font-size:14px;cursor:pointer;">🗑️</button>
    </div>`;
  }).join('');
}


function dayEditorDeleteEx(idx) {
  const exIds = getDayExerciseList(dayEditorDay);
  exIds.splice(idx, 1);
  if (exIds.length === 0) {
    // آخر تمرين — تحويل اليوم لراحة تلقائياً
    S.customSchedule[dayEditorDay] = 'rest';
    saveState();
    closeDayEditor();
    showMiniToast('😴 تم تحويل اليوم لراحة');
    return;
  }
  saveState();
  renderDayEditorList();
}

function dayEditorAddEx(id) {
  // إذا كان اليوم راحة — تحويله لتدريب أولاً
  if (S.customSchedule && S.customSchedule[dayEditorDay] === 'rest') {
    S.customSchedule[dayEditorDay] = [];
  }
  const exIds = getDayExerciseList(dayEditorDay);
  if (!exIds.includes(id)) { exIds.push(id); saveState(); }
  renderDayEditorList();
}

function dayEditorEditEx(id) {
  closeDayEditor();
  openExEditor(id, dayEditorDay);
}

// ══════ Drag & Drop reorder ══════
function deDragOver(e) { e.preventDefault(); }
function deDragEnd() {}
function deDrop(e, targetIdx) { e.preventDefault(); }

function deHandleDown(e, srcIdx) {
  e.preventDefault();
  e.stopPropagation();

  const handle = e.currentTarget;
  const row    = handle.closest('.de-row');
  const list   = document.getElementById('day-editor-list');
  if (!row || !list) return;

  // ── Pointer capture: يضمن تتبع الإصبع حتى خارج العنصر ──
  handle.setPointerCapture(e.pointerId);
  handle.style.cursor = 'grabbing';

  const rowRect = row.getBoundingClientRect();
  const startY  = e.clientY;

  // ── Ghost ──
  const ghost = row.cloneNode(true);
  ghost.style.cssText = [
    'position:fixed',
    'pointer-events:none',
    'z-index:9999',
    'border-radius:14px',
    'background:var(--card)',
    'border:2px solid var(--gold)',
    'box-shadow:0 16px 40px rgba(0,0,0,.4),0 2px 8px rgba(212,168,67,.35)',
    'transform:scale(1.03) rotate(-0.8deg)',
    'opacity:0.95',
    'transition:none',
    'left:' + rowRect.left + 'px',
    'top:'  + rowRect.top  + 'px',
    'width:' + rowRect.width + 'px',
    'height:' + rowRect.height + 'px',
    'margin:0',
  ].join(';');
  document.body.appendChild(ghost);

  // ── Fade original ──
  row.style.opacity = '0.3';

  // ── Drop indicator ──
  const indicator = document.createElement('div');
  indicator.style.cssText = 'position:absolute;left:8px;right:8px;height:3px;border-radius:2px;pointer-events:none;z-index:200;display:none;background:linear-gradient(90deg,transparent,var(--gold),transparent);box-shadow:0 0 8px rgba(212,168,67,.5);';
  list.style.position = 'relative';
  list.appendChild(indicator);

  let dropIdx = srcIdx;

  function getRows() { return [...list.querySelectorAll('.de-row')]; }

  function onMove(ev) {
    ev.preventDefault();
    const y = ev.clientY;
    const dy = y - startY;

    // تحريك الـ ghost
    ghost.style.top = (rowRect.top + dy) + 'px';

    // تحديد موضع الإسقاط
    const rows = getRows();
    let newDrop = srcIdx;
    for (let i = 0; i < rows.length; i++) {
      if (i === srcIdx) continue;
      const r = rows[i].getBoundingClientRect();
      if (y > r.top + r.height * 0.5) newDrop = i;
    }
    dropIdx = newDrop;

    // تحريك الصفوف بصرياً
    rows.forEach((r, i) => {
      r.style.transition = 'transform .15s ease';
      if (i === srcIdx) return;
      if (srcIdx < newDrop && i > srcIdx && i <= newDrop)
        r.style.transform = 'translateY(-' + (rowRect.height + 8) + 'px)';
      else if (srcIdx > newDrop && i >= newDrop && i < srcIdx)
        r.style.transform = 'translateY(' + (rowRect.height + 8) + 'px)';
      else
        r.style.transform = '';
    });

    // خط الإسقاط
    if (newDrop !== srcIdx) {
      const tRow  = rows[newDrop];
      const tRect = tRow.getBoundingClientRect();
      const lRect = list.getBoundingClientRect();
      const lineY = (srcIdx < newDrop ? tRect.bottom : tRect.top) - lRect.top + list.scrollTop;
      indicator.style.top  = (lineY - 1.5) + 'px';
      indicator.style.display = 'block';
    } else {
      indicator.style.display = 'none';
    }
  }

  function onUp() {
    ghost.remove();
    indicator.remove();
    handle.style.cursor = 'grab';

    getRows().forEach(r => {
      r.style.transition = '';
      r.style.transform  = '';
      r.style.opacity    = '';
    });

    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup',   onUp);
    handle.removeEventListener('pointercancel', onUp);

    if (dropIdx !== srcIdx) {
      const exIds = getDayExerciseList(dayEditorDay);
      const [moved] = exIds.splice(srcIdx, 1);
      exIds.splice(dropIdx, 0, moved);
      saveState();
      renderDayEditorList();
    }
  }

  // الاستماع على handle نفسه (بعد setPointerCapture تصله كل الأحداث)
  handle.addEventListener('pointermove',   onMove, {passive:false});
  handle.addEventListener('pointerup',     onUp);
  handle.addEventListener('pointercancel', onUp);
}

function saveExEditor() {
  const id = document.getElementById('ex-editor-id').value;
  const day = parseInt(document.getElementById('ex-editor-day').value);
  const updated = {
    id, nameAr: document.getElementById('ex-ed-nameAr').value,
    nameEn: document.getElementById('ex-ed-nameEn').value,
    icon: document.getElementById('ex-ed-icon').value || '💪',
    muscles: document.getElementById('ex-ed-muscles').value,
    sets: parseInt(document.getElementById('ex-ed-sets').value)||3,
    reps: parseInt(document.getElementById('ex-ed-reps').value)||10,
    type: document.getElementById('ex-ed-type').value,
    rest: parseInt(document.getElementById('ex-ed-rest').value)||30,
    steps: document.getElementById('ex-ed-steps').value.split('\n').filter(s=>s.trim()),
    repsLabel: {reps:'تكرار',timer:'ث',distance:'م'}[document.getElementById('ex-ed-type').value]||'تكرار'
  };
  if (!S.customExercises) S.customExercises = [];
  const ci = S.customExercises.findIndex(e=>e.id===id);
  if (ci>=0) S.customExercises[ci] = updated;
  else S.customExercises.push(updated);
  // FIX: لا نُعدّل EXERCISES مباشرة — getDaySchedule يقرأ من customExercises بأولوية
  // فقط حدّث إذا كان التمرين مخصصاً (custom) وليس من المصفوفة الأصلية
  const isBuiltIn = EXERCISES.findIndex(e=>e.id===id) >= 0;
  if (!isBuiltIn) {
    const ei = EXERCISES.findIndex(e=>e.id===id);
    if (ei>=0) Object.assign(EXERCISES[ei], updated);
  }
  saveState();
  closeExEditor();
  renderWorkoutTab();
  showMiniToast('✅ تم الحفظ');
}

function deleteExFromDay() {
  const id = document.getElementById('ex-editor-id').value;
  const day = parseInt(document.getElementById('ex-editor-day').value);
  
  const proceed = () => {
    if (!S.customSchedule) S.customSchedule = {};
    const sched = S.customSchedule[day] || getDaySchedule(day).exercises.map(e=>e.id);
    S.customSchedule[day] = sched.filter(i=>i!==id);
    if (typeof customSchedule !== 'undefined') customSchedule[day] = S.customSchedule[day];
    saveState();
    closeExEditor();
    renderWorkoutTab();
    showMiniToast('🗑️ تم الحذف');
  };

  if (typeof showConfirmModal === 'function') {
    showConfirmModal('🗑️ حذف تمرين', 'هل أنت متأكد من حذف هذا التمرين من اليوم؟', proceed);
  } else {
    proceed();
  }
}

function addExToDay(exId, day) {
  if (!S.customSchedule) S.customSchedule = {};
  // FIX-I: use S.customSchedule directly
  if (!S.customSchedule[day]) S.customSchedule[day] = getDaySchedule(day).exercises.map(e=>e.id);
  if (!S.customSchedule[day].includes(exId)) {
    S.customSchedule[day].push(exId);
    customSchedule[day] = S.customSchedule[day]; // keep legacy in sync
    saveState();
  }
  closeExEditor();
  renderWorkoutTab();
  showMiniToast('✅ تمت الإضافة');
}

function showNewExForm() {
  document.getElementById('new-ex-form').style.display = 'block';
}

function createAndAddEx() {
  const nameAr = document.getElementById('new-ex-nameAr').value.trim();
  if (!nameAr) { showMiniToast('⚠️ أدخل اسم التمرين'); return; }
  const id = 'custom_' + Date.now();
  const ex = {
    id, nameAr,
    nameEn: document.getElementById('new-ex-nameEn').value || nameAr,
    icon: document.getElementById('new-ex-icon').value || '💪',
    muscles: document.getElementById('new-ex-muscles').value || 'الجسم كله',
    sets: parseInt(document.getElementById('new-ex-sets').value)||3,
    reps: parseInt(document.getElementById('new-ex-reps').value)||10,
    type: document.getElementById('new-ex-type').value,
    steps: [], color: '#D4A843',
    repsLabel: document.getElementById('new-ex-type').value==='timer'?'ث':'تكرار'
  };
  if (!S.customExercises) S.customExercises = [];
  S.customExercises.push(ex);
  EXERCISES.push(ex);
  const day = parseInt(document.getElementById('ex-editor-day').value);
  addExToDay(id, day);
}

// Load custom schedule on init
let customSchedule = {}; // legacy compat
function loadCustomSchedule() {
  if (S.customSchedule) {
    Object.assign(customSchedule, S.customSchedule);
  }
  if (S.customExercises) {
    S.customExercises.forEach(ex => {
      if (!EXERCISES.find(e=>e.id===ex.id)) EXERCISES.push(ex);
      else Object.assign(EXERCISES.find(e=>e.id===ex.id), ex);
    });
  }
}


/* ══════════════════════════════════════════════════════
   TUTORIAL — Spotlight onboarding (game style)
══════════════════════════════════════════════════════ */
const TUTORIAL_STEPS = [
  {
    targetId: 'tab-btn-home',
    title: '🏠 الصفحة الرئيسية',
    desc: 'نظرة سريعة على تقدمك — اليوم الحالي، السلسلة، السعرات، وشريط تقدم البرنامج.\n\nاضغط "ابدأ تدريب اليوم" لتبدأ مباشرة.',
    pos: 'bottom'
  },
  {
    targetId: 'tab-btn-workout',
    title: '🏋️ تبويب التدريب',
    desc: 'برنامجك اليومي هنا. اضغط على أي يوم لترى تمارينه وتعدّلها، ثم اضغط "ابدأ الجلسة" لتدريب موجّه خطوة بخطوة.',
    pos: 'bottom'
  },
  {
    targetId: 'tab-btn-timer',
    title: '⏱️ المؤقت',
    desc: 'مؤقت احترافي متعدد الأوضاع — تابيتا (HIIT)، EMOM، مؤقت عادي، أو عدّاد. مثالي للتدريب الحر.',
    pos: 'bottom'
  },
  {
    targetId: 'tab-btn-progress',
    title: '📊 التقدم',
    desc: 'تابع رحلتك كاملة — السعرات المحروقة، أيام التدريب، سلسلة الأيام المتتالية، الشارات، وسجل كل جلسة.',
    pos: 'bottom'
  },
  {
    targetId: 'tab-btn-coach',
    title: '🤖 المدرب الذكي',
    desc: 'مدربك الشخصي بالذكاء الاصطناعي. يعرف وزنك وهدفك وسجل تدريباتك. اسأله أي شيء!',
    pos: 'bottom'
  },
  {
    targetId: 'tab-btn-coach',
    title: '🤖 قدرات المدرب الذكي',
    desc: 'المدرب يتحكم في كل شيء بأمرك:\n• يعدّل تمارين أي يوم\n• يبرمج أسبوع كامل\n• يغير الثيم والوضع\n• يقيّم تقدمك ويعطيك خطة\n• يرد على أسئلة التغذية والتمارين',
    pos: 'top'
  },
  {
    targetId: 'fab-theme',
    title: '🎨 تغيير الثيم',
    desc: 'غيّر مظهر AZEM — 7 ثيمات مختلفة: داكن، ناري، بحري، طبيعي، نيون، بنفسجي، فاتح. أو قل للمدرب "غير الثيم للمحيط"!',
    pos: 'left'
  },
  {
    targetId: 'mode-hdr-btn',
    title: '🖥️ وضع العرض',
    desc: 'بدّل بين وضعين:\n📱 جوال — واجهة مدمجة\n🖥️ كمبيوتر — لوحة جانبية واسعة',
    pos: 'bottom'
  },
  {
    targetId: 'fab-theme',
    title: '✋ الأيقونات العائمة قابلة للسحب',
    desc: 'اضغط مطولاً على أيقونة الثيم 🎨 وحركها لأي مكان على الشاشة.\n\nموضعها يُحفظ تلقائياً.',
    pos: 'left'
  },
  {
    targetId: 'settings-fab',
    fallbackCenter: true,
    title: '⚙️ يمكنك العودة لهذه التعليمات!',
    desc: 'إذا أردت مراجعة هذا الشرح في أي وقت:\n⚙️ الإعدادات ← ❓ إعادة التعليمات\n\nأو من زر ❓ في تبويب المدرب.',
    pos: 'center'
  }
];

let tutStep = 0;
let tutActive = false;

function startTutorial() {
  if (tutActive) return;
  tutActive = true;
  tutStep = 0;
  renderTutStep();
}

// Expose functions to window for Vanilla JS compatibility
window.openAICoach = openAICoach;
window.closeCoachModal = closeCoachModal;
window.renderCoach = renderCoach;
window.clearCoachHistory = clearCoachHistory;
window.coachAsk = coachAsk;
window.coachImgSelected = coachImgSelected;
window.coachClearImg = coachClearImg;
window.coachPdfSelected = coachPdfSelected;
window.coachSend = coachSend;
window.coachExecCmd = coachExecCmd;
window.startTutorial = startTutorial;
window.tutNext = tutNext;
window.endTutorial = endTutorial;

function tutNext() {
  tutStep++;
  if (tutStep >= TUTORIAL_STEPS.length) {
    endTutorial();
  } else {
    renderTutStep();
  }
}

function endTutorial() {
  tutActive = false;
  S.tutorialDone = true;
  saveState();
  const overlay = document.getElementById('tut-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.4s';
    setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = '1'; }, 400);
  }
}

function renderTutStep() {
  let overlay = document.getElementById('tut-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tut-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'block';

  const step = TUTORIAL_STEPS[tutStep];
  const target = step.targetId ? document.getElementById(step.targetId) : null;
  if (!target && !step.fallbackCenter) { tutNext(); return; }

  // Center position for steps without a target
  let cx, cy, r;
  if (!target || step.pos === 'center') {
    cx = window.innerWidth / 2;
    cy = window.innerHeight / 2;
    r = 0;
  } else {
    const rect2 = target.getBoundingClientRect();
    cx = rect2.left + rect2.width / 2;
    cy = rect2.top + rect2.height / 2;
    r = Math.max(rect2.width, rect2.height) / 2 + 14;
  }

  // Box positioning
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let boxLeft = 16, boxTop = 0, arrowClass = '';

  if (step.pos === 'center' || !target) {
    boxLeft = Math.max(16, (vw - 310) / 2);
    boxTop  = Math.max(80, (vh - 220) / 2);
    arrowClass = '';
  } else if (step.pos === 'bottom') {
    boxTop = cy + r + 18;
    boxLeft = Math.max(12, Math.min(cx - 160, vw - 332));
    arrowClass = 'tut-arrow-top';
    if (boxTop + 200 > vh) { boxTop = cy - r - 200; arrowClass = 'tut-arrow-bottom'; }
  } else if (step.pos === 'left') {
    boxTop = Math.max(12, Math.min(cy - 90, vh - 220));
    boxLeft = cx + r + 14;
    if (boxLeft + 310 > vw) { boxLeft = cx - r - 320; }
    arrowClass = '';
  }

  const arrowOffset = Math.round(cx - boxLeft - 16);

  overlay.innerHTML = `
    <svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:all;" onclick="endTutorial()">
      <defs>
        <mask id="tut-mask">
          <rect width="100%" height="100%" fill="white"/>
          ${r > 0 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="black"/>` : ''}
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.82)" mask="url(#tut-mask)"/>
    </svg>
    ${r > 0 ? `<div style="position:absolute;left:${cx-r}px;top:${cy-r}px;width:${r*2}px;height:${r*2}px;border-radius:50%;
      box-shadow:0 0 0 3px #D4A843,0 0 0 7px rgba(212,168,67,0.3),0 0 30px rgba(212,168,67,0.6);
      animation:tutPulse 1.4s ease-in-out infinite;pointer-events:none;"></div>` : ''}
    <div style="position:absolute;left:${boxLeft}px;top:${boxTop}px;width:310px;
      background:#13131f;border:1.5px solid #D4A843;border-radius:18px;padding:18px 20px;
      box-shadow:0 8px 40px rgba(0,0,0,0.7);pointer-events:all;z-index:2;">
      ${arrowClass === 'tut-arrow-top' ? `<div style="position:absolute;top:-10px;left:${arrowOffset}px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:10px solid #D4A843;"></div>` : ''}
      ${arrowClass === 'tut-arrow-bottom' ? `<div style="position:absolute;bottom:-10px;left:${arrowOffset}px;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:10px solid #D4A843;"></div>` : ''}
      <div style="font-size:15px;font-weight:900;color:#D4A843;margin-bottom:7px;">${step.title}</div>
      <div style="font-size:13px;color:#aaa;line-height:1.75;white-space:pre-line;">${step.desc}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:16px;">
        <button onclick="tutNext()" style="flex:1;padding:10px;border-radius:12px;background:linear-gradient(135deg,#D4A843,#F59E0B);border:none;color:#080810;font-family:'Cairo',sans-serif;font-size:13px;font-weight:900;cursor:pointer;">
          ${tutStep < TUTORIAL_STEPS.length - 1 ? 'التالي ←' : '🚀 ابدأ!'}
        </button>
        <button onclick="endTutorial()" style="padding:10px 14px;border-radius:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:#666;font-family:'Cairo',sans-serif;font-size:12px;cursor:pointer;">تخطي</button>
      </div>
      <div style="display:flex;justify-content:center;gap:5px;margin-top:12px;">
        ${TUTORIAL_STEPS.map((_,i)=>`<div style="height:5px;border-radius:3px;background:${i===tutStep?'#D4A843':'rgba(255,255,255,0.15)'};width:${i===tutStep?18:6}px;transition:all 0.3s;"></div>`).join('')}
      </div>
    </div>`;
}


/* ══════ INIT ══════ */
document.addEventListener('DOMContentLoaded', () => {
  // Init all FABs
  const fabThemeEl = document.getElementById('fab-theme');
  if (fabThemeEl) initFab(fabThemeEl, 'fabThemePos', () => openThemeModal());

  // Init tabata values
  if (S.tabata) {
    document.getElementById('tab-work').textContent = S.tabata.work || 20;
    document.getElementById('tab-rest').textContent = S.tabata.rest || 10;
    document.getElementById('tab-rounds').textContent = S.tabata.rounds || 8;
  }

  // Sound UI
  document.getElementById('snd-toggle').classList.toggle('on', S.soundOn !== false);
  document.getElementById('tick-toggle').classList.toggle('on', S.tickOn !== false);
  document.getElementById('tts-toggle')?.classList.toggle('on', S.ttsOn !== false);
  document.getElementById('vol-range').value = S.volume || 80;

  // Timer default display
  updateTimerUI();

  // Onboarding check
  if (!S.onboardingDone) {
    setTimeout(showOnboarding, 300);
  }

  // Animated background + theme icons (single canonical init)
  const initTheme = S.theme || 'default';
  if (initTheme === 'default') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', initTheme);
  initBG();
  setBG(initTheme);
  const thBtn = document.getElementById('theme-hdr-btn');
  if (thBtn) thBtn.textContent = THEME_ICONS[initTheme] || '☀️';
  const fabThemeIconEl = document.getElementById('fab-theme');
  if (fabThemeIconEl) fabThemeIconEl.textContent = THEME_ICONS[initTheme] || '☀️';

  // Render main
  loadCustomSchedule();
  render();
  // Auto-start tutorial on first launch (not right after onboarding - obFinish handles that)
  if (!S.tutorialDone && S.onboardingDone && !window._justFinishedOnboarding) {
    setTimeout(startTutorial, 600);
  }
  renderTips();

  // Apply mode
  if (!S.mode || S.mode === 'dark' || S.mode === 'light') S.mode = 'mobile';
  applyMode();

  // Apply lang
  applyLang(S.lang || 'ar');

  // Network
  setTimeout(updateNetworkStatus, 1500);
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // Auto-advance day based on start date
  const start = new Date(S.user?.startDate || S.startDate); // FIX-F: check user.startDate first
  const now = new Date();
  const maxDay = S.user?.programDays || 30;
  const elapsed = Math.floor((now - start) / 86400000) + 1;
  if (elapsed >= 1 && elapsed <= maxDay && elapsed > S.currentDay) {
    S.currentDay = Math.min(elapsed, maxDay);
    saveState();
    render();
  }

  // Poll for GIFs loading (gifs.js may take time to parse)
  let _gifPollCount = 0;
  const _gifPoll = setInterval(() => {
    _gifPollCount++;
    if (window.EXERCISE_GIFS && Object.keys(window.EXERCISE_GIFS).length > 0) {
      clearInterval(_gifPoll);
      renderWorkoutTab();
    }
    if (_gifPollCount > 100) clearInterval(_gifPoll);
  }, 100);
});

