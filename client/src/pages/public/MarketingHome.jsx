import { useNavigate } from 'react-router-dom';

const MarketingHome = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: '⏳',
      title: 'העסק מתנהל לבד',
      description: 'תזכורות, גבייה, תורים, חשבוניות והתכתבויות — עובדים על אוטומט.'
    },
    {
      icon: '💸',
      title: 'פחות דיבורים, יותר תכל\'ס',
      description: 'הלקוחות משלמים וקובעים לבד — בלי "נדבר מחר" ובלי תזכורות מביכות.'
    },
    {
      icon: '🤝',
      title: 'חוויה שגורמת ללקוחות להגיד וואו',
      description: 'שירות מסודר, חכם, מהיר — שנראה מיליון דולר.'
    },
    {
      icon: '📱',
      title: 'מכל מקום, בכל זמן',
      description: 'מהנייד, מהמחשב, מהמילואים, מהחופשה — העסק אצלך בכיס.'
    }
  ];

  const features = [
    'תורים חכמים וקביעת פגישות עצמאית',
    'תשלום מיידי (Cardcom / Tranzila / Grow)',
    'חשבוניות אוטומטיות בעברית (PDF לפי חוק)',
    'תזכורות SMS/מייל שמצמצמות ביטולים',
    'ניהול לקוחות מסודר — בלי אקסל ובלי בלגן',
    'דפי נחיתה שממירים לידים ללקוחות',
    'דוחות שמראים מה באמת מכניס כסף',
    'מערכת שעוזרת לעסק — לא מסבכת אותו'
  ];

  const steps = [
    {
      number: '1',
      title: 'פותחים חשבון חינם',
      description: 'לוקח דקה אחת. בלי כרטיס אשראי.'
    },
    {
      number: '2',
      title: 'מגדירים שירות/סדנה',
      description: 'לוקח 2-3 דקות. פשוט ואינטואיטיבי.'
    },
    {
      number: '3',
      title: 'מקבלים דף הרשמה מוכן',
      description: 'קישור אישי לשיתוף מיידי.'
    },
    {
      number: '4',
      title: 'שולחים ללקוחות',
      description: 'הם כבר קובעים, משלמים ומקבלים תזכורת.'
    }
  ];

  const testimonials = [
    {
      quote: 'חסכתי שעות עבודה והלקוחות פשוט קובעים לבד. גיים צ\'יינג\'ר!',
      author: 'שרה',
      role: 'מעצבת אירועים'
    },
    {
      quote: 'הביטולים ירדו משמעותית. סוף סוף סדר!',
      author: 'דוד',
      role: 'מאמן כושר'
    },
    {
      quote: 'הכל נראה מקצועי, מסודר, ובלי מאמץ מצידי.',
      author: 'מיכל',
      role: 'יועצת עסקית'
    }
  ];

  const targetAudience = [
    'מאמנים, יועצים ומדריכים',
    'מטפלים, מאפרות, קוסמטיקאיות',
    'צלמים, מפיקים, אולמות אירועים',
    'חוגים, סדנאות, שיעורים והרצאות',
    'כל בעל/ת עסק שנמאס לו לתפעל בצד במקום לצמוח'
  ];

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
              <span className="block text-primary">העסק שלך לא צריך עוד כלי</span>
              <span className="block bg-gradient-to-r from-accent-teal via-accent-teal to-accent-teal bg-clip-text text-transparent">
                הוא צריך מערכת שמנהלת אותו במקומך
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-primary mb-4 max-w-4xl mx-auto leading-relaxed font-semibold">
              הכירו את ChatGrow — תורים, תשלומים, לקוחות, דפי נחיתה ואוטומציות.
            </p>
            <p className="text-xl sm:text-2xl text-accent-teal mb-8 max-w-3xl mx-auto font-bold">
              מערכת אחת. שפויה אחת. בעברית.
            </p>

            <div className="max-w-3xl mx-auto mb-8 text-right space-y-2">
              <p className="text-lg text-primary">🔹 בלי לרדוף אחרי לקוחות</p>
              <p className="text-lg text-primary">🔹 בלי ביטולים של הרגע האחרון</p>
              <p className="text-lg text-primary">🔹 בלי לעבור בין יומן, וואטסאפ, אקסל ותשלומים</p>
              <p className="text-lg text-primary">🔹 הכל קורה אוטומטית — גם כשאתה עסוק, וגם כשאתה ישן</p>
            </div>

            <div className="max-w-3xl mx-auto mb-8 bg-white/70 border-2 border-accent-teal/30 rounded-2xl p-6 shadow-lg">
              <p className="text-lg font-semibold text-accent-teal">✅ חוסך 5–15 שעות ניהול בשבוע</p>
              <p className="text-lg font-semibold text-accent-teal">✅ מפחית משמעותית ביטולי תורים</p>
              <p className="text-lg font-semibold text-accent-teal">✅ מגדיל הכנסות בלי להוסיף עובדים</p>
            </div>

            <div className="mb-8">
              <p className="text-2xl sm:text-3xl font-bold text-primary mb-2">⏱️ 10 דקות — וזה עובד</p>
              <p className="text-lg text-secondary max-w-3xl mx-auto">
                בלי הגדרות מסובכות. בלי פיתוח. בלי ללמוד מערכת חודש.
                <br />
                בעוד 10 דקות תוכל לשלוח ללקוחות שלך קישור להרשמה, לקביעת תור ולתשלום — והם כבר יכנסו לבד.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-8">
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-gradient-to-r from-accent-teal to-accent-hover hover:from-accent-teal hover:to-accent-teal text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full text-lg sm:text-xl font-bold shadow-2xl shadow-accent-teal/50 hover:shadow-accent-teal/60 transition-all transform hover:scale-105"
              >
                התחל ללא עלות – העסק שלך עולה לאוויר ב-10 דקות 🚀
              </button>
            </div>

            <p className="text-sm text-secondary mb-8">
              🔥 ללא כרטיס אשראי | ביטול בכל שלב | תמיכה אנושית בעברית
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-bg-card to-gray-50 border border-accent-teal/30 rounded-2xl p-4 sm:p-6 shadow-lg shadow-accent-teal/10">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent-teal to-accent-hover bg-clip-text text-transparent mb-2">
                  24/7
                </div>
                <div className="text-sm sm:text-base text-secondary font-medium">אוטומציות עובדות</div>
              </div>
              <div className="bg-gradient-to-br from-bg-card to-gray-50 border border-accent-teal/30 rounded-2xl p-4 sm:p-6 shadow-lg shadow-accent-teal/10">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent-teal to-accent-hover bg-clip-text text-transparent mb-2">
                  99.5%
                </div>
                <div className="text-sm sm:text-base text-secondary font-medium">זמינות מערכת</div>
              </div>
              <div className="bg-gradient-to-br from-bg-card to-gray-50 border border-accent-teal/30 rounded-2xl p-4 sm:p-6 shadow-lg shadow-accent-teal/10">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent-teal to-accent-hover bg-clip-text text-transparent mb-2">
                  5-15
                </div>
                <div className="text-sm sm:text-base text-secondary font-medium">שעות חיסכון בשבוע</div>
              </div>
              <div className="bg-gradient-to-br from-bg-card to-gray-50 border border-accent-teal/30 rounded-2xl p-4 sm:p-6 shadow-lg shadow-accent-teal/10">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-accent-teal to-accent-hover bg-clip-text text-transparent mb-2">
                  &lt;10
                </div>
                <div className="text-sm sm:text-base text-secondary font-medium">דקות הקמה</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              💡 למה עסקים עוברים ל-ChatGrow?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-bg-card to-gray-50 border border-accent-teal/30 rounded-2xl p-6 sm:p-8 shadow-lg shadow-accent-teal/10 hover:shadow-xl hover:shadow-accent-teal/20 transition-all hover:scale-105"
              >
                <div className="text-4xl sm:text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl sm:text-2xl font-bold text-accent-teal mb-3">{benefit.title}</h3>
                <p className="text-secondary leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-bg-light via-bg-card to-bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              💼 מה ChatGrow עושה בפועל?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-reverse space-x-4 bg-white border border-accent-teal/30 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="text-2xl text-accent-teal">✔</div>
                <p className="text-lg text-primary font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              ⚡ כמה מהר זה עובד באמת?
            </h2>
            <p className="text-xl text-secondary max-w-3xl mx-auto">
              4 צעדים פשוטים ואתה בעסקים
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative bg-gradient-to-br from-bg-card to-gray-50 border-2 border-accent-teal/30 rounded-2xl p-6 sm:p-8 shadow-lg shadow-accent-teal/10 hover:shadow-xl hover:shadow-accent-teal/20 transition-all"
              >
                <div className="absolute -top-6 right-6 w-12 h-12 bg-gradient-to-r from-accent-teal to-accent-hover text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-accent-teal mb-3 mt-4">{step.title}</h3>
                <p className="text-secondary leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 bg-green-50 border-2 border-green-500 rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-xl font-bold text-green-700 mb-2">✅ פחות מ-10 דקות</p>
            <p className="text-xl font-bold text-green-700 mb-2">✅ בלי תמיכה טכנית</p>
            <p className="text-xl font-bold text-green-700">✅ בלי התעסקות מיותרת</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-bg-light via-bg-card to-bg-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">
              💬 זה מה שעסקים אומרים על ChatGrow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white border border-accent-teal/30 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="text-yellow-500 text-2xl mb-4">⭐️⭐️⭐️⭐️⭐️</div>
                <p className="text-lg text-primary mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="border-t border-accent-teal/30 pt-4">
                  <p className="font-bold text-accent-teal">{testimonial.author}</p>
                  <p className="text-sm text-secondary">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-8">
              🎯 למי זה מושלם?
            </h2>

            <div className="space-y-4 mb-8">
              {targetAudience.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-bg-card to-gray-50 border border-accent-teal/30 rounded-xl p-4 shadow-lg text-right"
                >
                  <p className="text-lg text-primary font-medium">✅ {item}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-accent-teal/10 to-accent-hover/10 border-2 border-accent-teal rounded-2xl p-8 mb-8">
              <p className="text-2xl font-bold text-primary mb-2">
                מספיק לנהל את העסק. הגיע הזמן שהוא ינהל את עצמו.
              </p>
              <p className="text-xl text-accent-teal font-semibold">
                ChatGrow — כי לעסק קטן מגיע לעבוד כמו גדול.
              </p>
            </div>

            <div className="space-y-2 mb-8">
              <p className="text-lg text-primary">🔹 ללא התחייבות</p>
              <p className="text-lg text-primary">🔹 ללא כרטיס אשראי</p>
              <p className="text-lg text-primary">🔹 תמיכה אמיתית מבני אדם</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-accent-teal/10 via-gray-100 to-accent-teal/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-6">
            התחל חינם עכשיו — ותוך 10 דקות העסק שלך באוויר 👑
          </h2>
          <p className="text-xl text-secondary mb-8">
            המערכת שמסדרת לעסק את החיים
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
                המערכת שמסדרת לעסק את החיים
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
