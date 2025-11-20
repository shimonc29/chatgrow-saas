import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getSourceTracking, buildSourceKey, storeSourceTracking } from '../../utils/sourceTracking';

function EventRegistration() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [paymentOptions, setPaymentOptions] = useState(null);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        paymentMethod: 'credit_card',
        provider: 'manual'
    });

    useEffect(() => {
        fetchEvent();
        fetchPaymentOptions();
        
        // Capture and store source tracking
        const tracking = getSourceTracking();
        // Add sourceKey for this event if not already set from landing page
        if (!tracking.sourceKey) {
            tracking.sourceKey = buildSourceKey('event', id);
        }
        storeSourceTracking(tracking);
    }, [id]);

    const fetchEvent = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/public/events/${id}`);
            if (response.data.success) {
                setEvent(response.data.event);
            } else {
                setError('אירוע לא נמצא');
            }
        } catch (err) {
            console.error('Error fetching event:', err);
            setError(err.response?.data?.message || 'שגיאה בטעינת האירוע');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentOptions = async () => {
        try {
            const response = await axios.get(`/api/public/events/${id}/payment-options`);
            if (response.data.success) {
                setPaymentOptions(response.data.paymentOptions);
                
                // Set default provider based on available options (priority order)
                if (response.data.paymentOptions.tranzila) {
                    setFormData(prev => ({ ...prev, provider: 'tranzila' }));
                } else if (response.data.paymentOptions.cardcom) {
                    setFormData(prev => ({ ...prev, provider: 'cardcom' }));
                } else if (response.data.paymentOptions.meshulam) {
                    setFormData(prev => ({ ...prev, provider: 'meshulam' }));
                } else if (response.data.paymentOptions.external) {
                    setFormData(prev => ({ ...prev, provider: 'external' }));
                } else {
                    setFormData(prev => ({ ...prev, provider: 'manual' }));
                }
            }
        } catch (err) {
            console.error('Error fetching payment options:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            setError('נא למלא את כל השדות');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            // Get source tracking for analytics
            const sourceTracking = getSourceTracking();

            const response = await axios.post(`/api/public/events/${id}/register`, {
                customer: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone
                },
                paymentMethod: formData.paymentMethod,
                provider: formData.provider,
                // Include source tracking
                ...sourceTracking
            });

            if (response.data.success) {
                if (response.data.requiresRedirect && response.data.paymentUrl) {
                    window.location.href = response.data.paymentUrl;
                } else {
                    navigate(`/payment/success?type=event&id=${id}`);
                }
            }
        } catch (err) {
            console.error('Error registering:', err);
            setError(err.response?.data?.message || 'שגיאה בהרשמה לאירוע');
        } finally {
            setSubmitting(false);
        }
    };

    const getLocation = (location) => {
        if (!location) return 'לא צוין';
        if (typeof location === 'string') return location;
        if (location.address?.street) return location.address.street;
        if (location.address) return 'כתובת זמינה';
        return 'לא צוין';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-light flex items-center justify-center">
                <div className="text-xl text-accent-teal font-medium">טוען...</div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
                <div className="bg-white border border-gray-200 shadow-lg p-8 rounded-lg max-w-md w-full text-center">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-text-primary mb-4">{error}</h2>
                    <p className="text-text-secondary mb-6">
                        {error === 'אירוע זה אינו פעיל כרגע' 
                            ? 'האירוע אינו פעיל או טרם פורסם. אנא צור קשר עם מנהל האירוע.'
                            : 'האירוע לא נמצא במערכת.'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-accent-teal text-white px-6 py-3 rounded-lg hover:bg-accent-hover transition font-medium"
                    >
                        חזרה לדף הבית
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-light py-12 px-4" dir="rtl">
            <div className="max-w-4xl mx-auto">
                {/* Event Header */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-8 mb-6">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold text-accent-teal mb-2">{event.title}</h1>
                        <p className="text-text-secondary text-lg">{event.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-bg-light border border-gray-200 p-4 rounded-lg hover:border-accent-teal transition">
                            <div className="text-3xl mb-2">📅</div>
                            <div className="text-sm text-text-secondary">תאריך</div>
                            <div className="font-bold text-accent-teal">
                                {new Date(event.date).toLocaleDateString('he-IL')}
                            </div>
                        </div>

                        <div className="bg-bg-light border border-gray-200 p-4 rounded-lg hover:border-accent-teal transition">
                            <div className="text-3xl mb-2">⏰</div>
                            <div className="text-sm text-text-secondary">שעה</div>
                            <div className="font-bold text-accent-teal">{event.time}</div>
                        </div>

                        <div className="bg-bg-light border border-gray-200 p-4 rounded-lg hover:border-accent-teal transition">
                            <div className="text-3xl mb-2">📍</div>
                            <div className="text-sm text-text-secondary">מיקום</div>
                            <div className="font-bold text-accent-teal">{getLocation(event.location)}</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-accent-teal/10 to-accent-teal/5 border border-accent-teal/30 rounded-lg text-center">
                        <div className="text-2xl font-bold text-accent-teal mb-1">
                            {event.currency === 'ILS' ? '₪' : event.currency === 'USD' ? '$' : '€'}
                            {event.price || 0}
                        </div>
                        <div className="text-sm text-text-secondary">
                            {event.availableSpots > 0 ? (
                                <span className="text-accent-teal font-medium">
                                    {event.availableSpots} מקומות פנויים מתוך {event.maxParticipants}
                                </span>
                            ) : (
                                <span className="text-red-500 font-medium">האירוע מלא</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                {event.availableSpots > 0 ? (
                    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-8">
                        <h2 className="text-2xl font-bold text-accent-teal mb-6 text-center">
                            הרשמה לאירוע
                        </h2>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-text-primary font-medium mb-2">
                                        שם פרטי *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-text-secondary"
                                        placeholder="הזן שם פרטי"
                                    />
                                </div>

                                <div>
                                    <label className="block text-text-primary font-medium mb-2">
                                        שם משפחה *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-text-secondary"
                                        placeholder="הזן שם משפחה"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-text-primary font-medium mb-2">
                                    דוא״ל *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-text-secondary"
                                    placeholder="example@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-text-primary font-medium mb-2">
                                    טלפון *
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent placeholder-text-secondary"
                                    placeholder="05X-XXXXXXX"
                                />
                            </div>

                            {event.price > 0 && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-bold text-accent-teal mb-4">פרטי תשלום</h3>
                                    
                                    <div className="mb-4">
                                        <label className="block text-text-primary font-medium mb-2">
                                            אמצעי תשלום
                                        </label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                                        >
                                            <option value="credit_card">כרטיס אשראי</option>
                                            <option value="bit">Bit</option>
                                            <option value="bank_transfer">העברה בנקאית</option>
                                            <option value="cash">מזומן</option>
                                        </select>
                                    </div>

                                    {paymentOptions && (
                                        <div className="mb-4">
                                            <label className="block text-text-primary font-medium mb-2">
                                                ספק תשלום
                                            </label>
                                            <select
                                                name="provider"
                                                value={formData.provider}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-white border border-gray-300 text-text-primary rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent"
                                            >
                                                {paymentOptions.manual && (
                                                    <option value="manual">תשלום ידני</option>
                                                )}
                                                {paymentOptions.tranzila && (
                                                    <option value="tranzila">Tranzila</option>
                                                )}
                                                {paymentOptions.cardcom && (
                                                    <option value="cardcom">Cardcom</option>
                                                )}
                                                {paymentOptions.meshulam && (
                                                    <option value="meshulam">Meshulam (GROW)</option>
                                                )}
                                                {paymentOptions.external && (
                                                    <option value="external">{paymentOptions.externalLabel}</option>
                                                )}
                                            </select>
                                        </div>
                                    )}

                                    <div className="bg-gradient-to-r from-accent-teal/10 to-accent-teal/5 border border-accent-teal/30 p-4 rounded-lg">
                                        <div className="text-sm text-text-secondary mb-2">סכום לתשלום:</div>
                                        <div className="text-3xl font-bold text-accent-teal">
                                            {event.currency === 'ILS' ? '₪' : event.currency === 'USD' ? '$' : '€'}
                                            {event.price}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-accent-teal text-white py-3 px-6 rounded-lg font-bold text-lg hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {submitting ? 'מעבד...' : event.price > 0 ? 'המשך לתשלום' : 'הירשם עכשיו'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-8 text-center">
                        <div className="text-6xl mb-4">😔</div>
                        <h2 className="text-2xl font-bold text-accent-teal mb-2">האירוע מלא</h2>
                        <p className="text-text-secondary">אין מקומות פנויים באירוע זה</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventRegistration;
