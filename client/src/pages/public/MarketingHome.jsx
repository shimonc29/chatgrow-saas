import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MarketingHome = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const problemPoints = [
    '📅 הלקוחות קובעים תור בוואטסאפ, אבל לא מגיעים (No-Show)',
    '💬 שיחות אינסופיות בוואטסאפ - "נדבר מחר", "תזכיר לי", "נקבע בשבוע הבא"',
    '💸 לרדוף אחרי תשלומים ומקדמות - "אני אעביר מחר", "שכחתי את הארנק"',
    '📋 לידים נעלמים - התעניינו, לא חזרו, ושכחת מי זה בכלל',
    '🕐 לנהל יומן, אקסל ותשלומים בנפרד - והכל מתפזר בין אפליקציות'
  ];

  const whatChatGrowDoes = [
    {
      icon: '🎯',
      title: 'יותר לקוחות איכותיים, פחות לידים מבוזבזים',
      description: 'דף נחיתה מקצועי שמסביר מה את/ה עושה, כמה זה עולה, ואיך קובעים. הלידים שמגיעים כבר מחוברים ומוכנים.'
    },
    {
      icon: '📅',
      title: 'יומן נקי + תזכורות ומקדמות אוטומטיות',
      description: 'הלקוחות קובעים דרך הקישור שלך, משלמים מקדמה, ומקבלים תזכורת אוטומטית. פחות No-Show, יותר מחויבות.'
    },
    {
      icon: '📈',
      title: 'הכנסות גדלות מהלקוחות הקיימים',
      description: 'חבילות, מעקב, LTV, דוחות AI שמראים מי צריך המשך טיפול ואיפה יש הזדמנות להרוויח יותר.'
    }
  ];

  const howItWorks = [
    {
      number: '1',
      title: 'הגדר את הקליניקה/עסק',
      description: 'מה את/ה מציע (שירותים, סדנאות), ימי עבודה ושעות, אמצעי תשלום, חיבור ליומן גוגל (אופציונלי).'
    },
    {
      number: '2',
      title: 'תן למערכת לעבוד',
      description: 'קישור אחד לקביעת תורים - CRM אוטומטי, תזכורות, תשלומים וחשבוניות. הכל קורה מעצמו.'
    },
    {
      number: '3',
      title: 'תסתכל על הדוחות ותקבל החלטות יותר טובות',
      description: 'לידים → הזמנות → הכנסות. דוח AI שבועי שמזהה לך הזדמנויות צמיחה.'
    }
  ];

  const mainFeatures = [
    { icon: '👥', title: 'CRM ללקוחות', description: 'כל הלידים, הפגישות וההיסטוריה במקום אחד' },
    { icon: '📋', title: 'ניהול פגישות ותורים', description: 'יומן חכם, קביעה עצמאית, סנכרון Google Calendar' },
    { icon: '💳', title: 'גביית תשלומים ומקדמות', description: 'Tranzila, Cardcom, Meshulam - תשלום מיידי בקביעה' },
    { icon: '🧾', title: 'חשבוניות וקבלות', description: 'אוטומטיות, בעברית, PDF לפי חוק' },
    { icon: '📊', title: 'דוחות וניתוח ביצועים', description: 'מי הלקוחות הכי טובים, מה מכניס כסף, איפה יש בעיה' },
    { icon: '🤖', title: 'AI Coach לעסק', description: 'תובנות שבועיות - מחירים, ביקושים, המלצות אישיות' },
    { icon: '🎨', title: 'דפי נחיתה חכמים', description: 'דפי הרשמה מעוצבים שממירים לידים ללקוחות משלמים' },
    { icon: '🔔', title: 'התראות ותזכורות', description: 'מייל ו-SMS אוטומטיים - פחות ביטולים, יותר מחויבות' }
  ];

  const whyDifferent = [
    'מנהלת את כל המסע מלקוח פוטנציאלי ועד תשלום - לא רק את היומן',
    'נבנתה במיוחד למאמנים, מטפלים ויועצים - לא לכל סוגי העסקים',
    'מנוע צמיחה (לידים, שימור, הגדלת הכנסות) - לא רק "כלי נוסף"',
    'בעברית מלאה, תמיכה בעברית, מותאמת לשוק הישראלי'
  ];

  const faqs = [
    {
      q: 'צריך ידע טכני כדי להתחיל?',
      a: 'בכלל לא. אם את/ה יודע לשלוח הודסאפ, את/ה יודע להפעיל את ChatGrow. הכל אינטואיטיבי ובעברית.'
    },
    {
      q: 'איך זה עובד עם מקדמות ותשלומים?',
      a: 'הלקוח קובע תור דרך הקישור שלך ומשלם מקדמה (או מלוא הסכום) באותו רגע. התשלום עובר אליך ישירות דרך Tranzila/Cardcom/Meshulam.'
    },
    {
      q: 'אני רוצה רק דף נחיתה, בלי כל המערכת. אפשר?',
      a: 'כן! אבל למה? אם כבר בונים דף נחיתה, למה לא לתת ללקוחות גם לקבוע ולשלם באותו מקום? זה חוסך לך זמן ומגדיל המרות.'
    },
    {
      q: 'יש לי כבר מערכת תורים אחרת. קשה לעבור?',
      a: 'ממש לא. רוב המשתמשים שלנו התחילו מאפס או עברו ממערכת ישנה תוך פחות מיום אחד. אנחנו כאן לעזור.'
    },
    {
      q: 'מה ההבדל בין FREE ל-PREMIUM?',
      a: 'ב-FREE יש לך את כל הבסיס (עד 200 לקוחות, תורים, CRM, דפי נחיתה). ב-PREMIUM אין הגבלה + תקבל AI Coach, דוחות מתקדמים, SMS, אוטומציות וסנכרון ליומן גוגל.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-white via-bg-card to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-accent-teal/30 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-3">
              <span className="text-3xl">👑</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-accent-teal via-accent-teal to-accent-teal bg-clip-text text-transparent">
                ChatGrow
              </span>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:text-accent-teal px-4 py-2 rounded-lg font-medium transition-colors"
              >
                התחבר
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-accent-teal to-accent-hover hover:from-accent-teal hover:to-accent-teal text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-accent-teal/50 hover:shadow-xl hover:shadow-accent-teal/60 transition-all transform hover:scale-105"
              >
                הירשם חינם
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-teal/10 via-gray-100 to-accent-teal/5"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent-teal/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8">
              <span className="block text-primary">ChatGrow</span>
              <span className="block bg-gradient-to-r from-accent-teal via-accent-teal to-accent-teal bg-clip-text text-transparent">
                המערכת שממלאת לך את היומן
              </span>
              <span className="block bg-gradient-to-r from-accent-teal via-accent-teal to-accent-teal bg-clip-text text-transparent">
                ומפסיקה את ה-No-Show
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-primary mb-8 max-w-4xl mx-auto leading-relaxed">
              מערכת חכמה למאמנים, מטפלים ויועצים שמנהלת לידים, תורים, תשלומים ותזכורות – הכל במקום אחד, בעברית מלאה, בלי לרדוף אחרי לקוחות.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-6">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-gradient-to-r from-accent-teal to-accent-hover hover:from-accent-teal hover:to-accent-teal text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold shadow-2xl shadow-accent-teal/50 hover:shadow-accent-teal/60 transition-all transform hover:scale-105"
              >
                התחל בחינם
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto border-2 border-accent-teal text-accent-teal hover:bg-accent-teal hover:text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold transition-all transform hover:scale-105"
              >
                צפה איך זה עובד
              </button>
            </div>

            <p className="text-sm text-secondary mb-12">
              לא צריך ידע טכני. מתחילים לעבוד תוך פחות מ-10 דקות.
            </p>

            {/* Trust Strip */}
            <div className="bg-white/70 border border-accent-teal/30 rounded-2xl p-6 max-w-5xl mx-auto mb-12">
              <p className="text-lg font-semibold text-accent-teal">
                נבנה במיוחד עבור: <span className="text-primary">מאמנים אישיים</span> • <span className="text-primary">מטפלים רגשיים</span> • <span className="text-primary">מאמני הורים</span> • <span className="text-primary">יועצים עסקיים</span> • <span className="text-primary">מנחי סדנאות</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-6">
              אם העסק שלך מבוסס על פגישות – אתה בטח מכיר את זה
            </h2>
          </div>

          <div className="space-y-4 mb-12">
            {problemPoints.map((point, index) => (
              <div
                key={index}
                className="bg-red-50 border-r-4 border-red-500 rounded-lg p-6 shadow-md"
              >
                <p className="text-lg text-primary font-medium text-right">{point}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-accent-teal/10 to-accent-hover/10 border-2 border-accent-teal rounded-2xl p-8">
            <p className="text-xl sm:text-2xl font-bold text-primary text-center leading-relaxed">
              ChatGrow הופכת את הכאוס הזה למערכת אחת שמנהלת לך את הלידים, הפגישות, התזכורות והתשלומים – <span className="text-accent-teal">ואתה יכול להתרכז במה שאתה עושה הכי טוב: לטפל, לאמן, לייעץ.</span>
            </p>
          </div>
        </div>
      </section>

      {/* What ChatGrow Does */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-bg-light via-bg-card to-bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              מה ChatGrow עושה בפועל בשביל מאמן, מטפל או יועץ כמוך?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whatChatGrowDoes.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-accent-teal/30 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-bold text-accent-teal mb-4">{item.title}</h3>
                <p className="text-secondary leading-relaxed text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              איך ChatGrow עובדת עבורך?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {howItWorks.map((step, index) => (
              <div
                key={index}
                className="relative bg-gradient-to-br from-bg-card to-gray-50 border-2 border-accent-teal/30 rounded-2xl p-8 shadow-lg"
              >
                <div className="absolute -top-6 right-6 w-14 h-14 bg-gradient-to-r from-accent-teal to-accent-hover text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-accent-teal mb-4 mt-4">{step.title}</h3>
                <p className="text-secondary leading-relaxed text-lg">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center bg-green-50 border-2 border-green-500 rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-2xl font-bold text-green-700">
              ✅ לידים → הזמנות → הכנסות. דוח AI שבועי שמזהה לך הזדמנויות צמיחה.
            </p>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-bg-light via-bg-card to-bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              כל מה שמאמן, מטפל או יועץ צריך – במערכת אחת
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-accent-teal/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-bold text-accent-teal mb-2">{feature.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-8">
              למה ChatGrow שונה ממערכת תורים רגילה?
            </h2>
          </div>

          <div className="space-y-4 mb-12">
            {whyDifferent.map((item, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-bg-card to-gray-50 border-r-4 border-accent-teal rounded-lg p-6 shadow-lg"
              >
                <p className="text-lg text-primary font-medium text-right">✅ {item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-bg-light via-bg-card to-bg-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              כמה זה עולה לי?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* FREE Plan */}
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-primary mb-2">FREE – להתחלה</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-accent-teal">₪0</span>
                <span className="text-xl text-secondary"> / לחודש</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-accent-teal text-xl">✔</span>
                  <span className="text-primary">עד 200 לקוחות</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-accent-teal text-xl">✔</span>
                  <span className="text-primary">CRM בסיסי</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-accent-teal text-xl">✔</span>
                  <span className="text-primary">תורים ופגישות</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-accent-teal text-xl">✔</span>
                  <span className="text-primary">דפי נחיתה בסיסיים</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-accent-teal text-xl">✔</span>
                  <span className="text-primary">תזכורות במייל</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-primary px-6 py-4 rounded-lg font-bold transition-all"
              >
                התחל בחינם
              </button>
            </div>

            {/* PREMIUM Plan */}
            <div className="bg-gradient-to-br from-accent-teal to-accent-hover border-2 border-accent-teal rounded-2xl p-8 shadow-2xl transform scale-105">
              <div className="bg-yellow-400 text-primary px-4 py-1 rounded-full inline-block mb-4 font-bold text-sm">
                מומלץ ⭐
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">PREMIUM – לקליניקה שרוצה לצמוח</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">₪99</span>
                <span className="text-xl text-white/80"> / לחודש</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-white text-xl">✔</span>
                  <span className="text-white">ללא הגבלת לקוחות</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-white text-xl">✔</span>
                  <span className="text-white">AI Performance Coach</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-white text-xl">✔</span>
                  <span className="text-white">סנכרון Google Calendar</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-white text-xl">✔</span>
                  <span className="text-white">תזכורות SMS</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-white text-xl">✔</span>
                  <span className="text-white">דוחות מתקדמים</span>
                </li>
                <li className="flex items-start space-x-reverse space-x-3">
                  <span className="text-white text-xl">✔</span>
                  <span className="text-white">אוטומציות</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white hover:bg-gray-100 text-accent-teal px-6 py-4 rounded-lg font-bold transition-all"
              >
                שדרג לפרימיום
              </button>
            </div>
          </div>

          <p className="text-center text-secondary text-lg">
            אפשר להתחיל ב-FREE ולשדרג בכל רגע. אין התחייבות.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              שאלות נפוצות
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-bg-card to-gray-50 border border-accent-teal/30 rounded-xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center p-6 text-right hover:bg-accent-teal/5 transition-colors"
                >
                  <h3 className="text-lg font-bold text-primary flex-1">{faq.q}</h3>
                  <span className="text-2xl text-accent-teal mr-4">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-secondary leading-relaxed text-lg">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-accent-teal/10 via-gray-100 to-accent-teal/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-6">
            התחל חינם עכשיו – ותוך 10 דקות הקליניקה שלך באוויר 👑
          </h2>
          <p className="text-xl text-secondary mb-8">
            המערכת שמסדרת לקליניקה את החיים
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-accent-teal to-accent-hover hover:from-accent-teal hover:to-accent-teal text-white px-12 py-5 rounded-full text-2xl font-bold shadow-2xl shadow-accent-teal/50 hover:shadow-accent-teal/60 transition-all transform hover:scale-105"
          >
            🚀 בואו נתחיל!
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-reverse space-x-3 mb-4">
                <span className="text-3xl">👑</span>
                <span className="text-2xl font-bold">ChatGrow</span>
              </div>
              <p className="text-gray-300">
                המערכת שמסדרת לקליניקה את החיים
              </p>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">קישורים</h4>
              <ul className="space-y-2 text-gray-300">
                <li>ניהול תורים · תשלומים</li>
                <li>לקוחות · דפי נחיתה</li>
                <li>אוטומציות</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">תמיכה</h4>
              <ul className="space-y-2 text-gray-300">
                <li>📩 support@chatgrow.com</li>
                <li>📲 052-XXX-XXXX</li>
                <li>🌍 chatgrow.co.il</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>© 2025 ChatGrow — כל הזכויות שמורות</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingHome;
