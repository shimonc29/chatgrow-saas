import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [type, setType] = useState('');
    const [id, setId] = useState('');

    useEffect(() => {
        const typeParam = searchParams.get('type');
        const idParam = searchParams.get('id');
        
        setType(typeParam || 'payment');
        setId(idParam || '');
    }, [searchParams]);

    const getMessage = () => {
        switch(type) {
            case 'event':
                return {
                    title: 'נרשמת בהצלחה!',
                    subtitle: 'ההרשמה לאירוע התקבלה',
                    message: 'אישור נשלח למייל שלך עם כל הפרטים. נתראה באירוע! 🎉'
                };
            case 'appointment':
                return {
                    title: 'התור נקבע בהצלחה!',
                    subtitle: 'הזמנת התור התקבלה',
                    message: 'אישור נשלח למייל שלך עם כל הפרטים. נתראה בתור! 📅'
                };
            default:
                return {
                    title: 'התשלום בוצע בהצלחה!',
                    subtitle: 'העסקה הושלמה',
                    message: 'אישור נשלח למייל שלך עם כל הפרטים.'
                };
        }
    };

    const { title, subtitle, message } = getMessage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4 relative overflow-hidden" dir="rtl">
            <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
            
            <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 shadow-lg shadow-yellow-500/10 rounded-lg p-8 max-w-md w-full text-center relative z-10">
                <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg shadow-yellow-500/50">
                        <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">{title}</h1>
                    <p className="text-gray-300 text-lg">{subtitle}</p>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-600/30 rounded-lg p-6 mb-6">
                    <p className="text-gray-300 leading-relaxed">{message}</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-3 px-6 rounded-lg font-bold shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70 transition"
                    >
                        חזרה לדף הבית
                    </button>
                    
                    {type === 'event' && id && (
                        <button
                            onClick={() => navigate(`/events/${id}`)}
                            className="w-full bg-black/50 text-yellow-400 py-3 px-6 rounded-lg font-bold border-2 border-yellow-600/50 hover:border-yellow-500/70 hover:bg-black/70 transition"
                        >
                            צפייה בפרטי האירוע
                        </button>
                    )}
                </div>

                <div className="mt-8 text-sm text-gray-400">
                    <p>שאלות? צור קשר עם התמיכה</p>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;
