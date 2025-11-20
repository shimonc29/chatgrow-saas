import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getSourceTracking, buildSourceKey, storeSourceTracking } from '../../utils/sourceTracking';

function AppointmentBooking() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const businessId = searchParams.get('businessId');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [services, setServices] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [paymentOptions, setPaymentOptions] = useState(null);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        serviceId: '',
        date: '',
        time: '',
        notes: '',
        paymentMethod: 'credit_card',
        provider: 'manual',
        price: 0
    });

    useEffect(() => {
        if (!businessId) {
            setError('לא נמצא מזהה עסק. אנא השתמש בקישור המלא שקיבלת.');
            setLoading(false);
        } else {
            fetchServices();
            fetchPaymentOptions();
            
            // Capture and store source tracking
            const tracking = getSourceTracking();
            // Add sourceKey for appointment booking if not already set
            if (!tracking.sourceKey) {
                tracking.sourceKey = buildSourceKey('appointment', businessId);
            }
            storeSourceTracking(tracking);
        }
    }, [businessId]);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/public/services?providerId=${businessId}`);
            if (response.data.success) {
                setServices(response.data.services);
            }
        } catch (err) {
            console.error('Error fetching services:', err);
            setError('שגיאה בטעינת רשימת השירותים');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentOptions = async () => {
        try {
            const response = await axios.get(`/api/public/appointments/payment-options?businessId=${businessId}`);
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

    const fetchAvailableSlots = async (date, serviceId) => {
        if (!date || !serviceId) return;

        try {
            setLoadingSlots(true);
            const response = await axios.get('/api/public/availability/slots', {
                params: {
                    providerId: businessId,
                    date,
                    serviceId
                }
            });
            if (response.data.success) {
                setAvailableSlots(response.data.slots);
            }
        } catch (err) {
            console.error('Error fetching available slots:', err);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'serviceId') {
            const selectedService = services.find(s => s._id === value);
            setFormData(prev => ({
                ...prev,
                [name]: value,
                price: selectedService ? selectedService.price : 0,
                time: ''
            }));
            
            if (formData.date && value) {
                fetchAvailableSlots(formData.date, value);
            }
        } else if (name === 'date') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                time: ''
            }));
            
            if (formData.serviceId && value) {
                fetchAvailableSlots(value, formData.serviceId);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!businessId) {
            setError('לא נמצא מזהה עסק');
            return;
        }

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || 
            !formData.serviceId || !formData.date || !formData.time) {
            setError('נא למלא את כל השדות החובה');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            // Combine date and time
            const dateTime = new Date(`${formData.date}T${formData.time}`);
            
            // Get source tracking for analytics
            const sourceTracking = getSourceTracking();
            
            // SECURITY: Do NOT send price or duration - server validates from catalog
            const selectedService = services.find(s => s._id === formData.serviceId);
            const response = await axios.post('/api/public/appointments/book', {
                businessId,
                customer: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone
                },
                serviceType: selectedService?.name || 'appointment',
                serviceId: formData.serviceId,
                dateTime: dateTime.toISOString(),
                notes: formData.notes,
                paymentMethod: formData.paymentMethod,
                provider: formData.provider,
                // Include source tracking
                ...sourceTracking
            });

            if (response.data.success) {
                // If payment gateway is used, redirect to payment page
                if (response.data.requiresRedirect && response.data.paymentUrl) {
                    window.location.href = response.data.paymentUrl;
                } else {
                    // For manual payments or free appointments, show success
                    navigate(`/payment/success?type=appointment&id=${response.data.booking.appointment._id}`);
                }
            }
        } catch (err) {
            console.error('Error booking appointment:', err);
            setError(err.response?.data?.message || 'שגיאה בקביעת התור');
        } finally {
            setSubmitting(false);
        }
    };

    // Get minimum date (today)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Get maximum date (3 months from now)
    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        return maxDate.toISOString().split('T')[0];
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
                <div className="text-xl text-yellow-400 relative z-10">טוען...</div>
            </div>
        );
    }

    if (error && (!businessId || services.length === 0)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4 relative overflow-hidden" dir="rtl">
                <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
                <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 shadow-lg shadow-yellow-500/10 p-8 rounded-lg max-w-md w-full text-center relative z-10">
                    <div className="text-yellow-500 text-xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4">{error}</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-6 py-2 rounded-lg shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70 transition font-bold"
                    >
                        חזרה לדף הבית
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-4 relative overflow-hidden" dir="rtl">
            <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl"></div>
            
            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 shadow-lg shadow-yellow-500/10 rounded-lg p-8 mb-6 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">📅 קביעת תור</h1>
                    <p className="text-gray-300 text-lg">בחר את השירות המבוקש ותאריך נוח עבורך</p>
                </div>

                {/* Booking Form */}
                <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 shadow-lg shadow-yellow-500/10 rounded-lg p-8">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-6">פרטי התור</h2>

                    {error && (
                        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div className="border-b border-yellow-600/20 pb-6">
                            <h3 className="text-lg font-bold text-yellow-400 mb-4">פרטים אישיים</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className="block text-gray-300 font-medium mb-2">
                                        שם פרטי *
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
                                        placeholder="הזן שם פרטי"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-medium mb-2">
                                        שם משפחה *
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
                                        placeholder="הזן שם משפחה"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-300 font-medium mb-2">
                                        דוא״ל *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
                                        placeholder="example@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-medium mb-2">
                                        טלפון *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
                                        placeholder="05X-XXXXXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Service Selection */}
                        <div className="border-b border-yellow-600/20 pb-6">
                            <h3 className="text-lg font-bold text-yellow-400 mb-4">בחירת שירות</h3>
                            
                            <div>
                                <label className="block text-gray-300 font-medium mb-2">
                                    סוג שירות *
                                </label>
                                <select
                                    name="serviceId"
                                    value={formData.serviceId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                >
                                    <option value="">בחר שירות</option>
                                    {services.map(service => (
                                        <option key={service._id} value={service._id}>
                                            {service.name} - {service.duration} דקות (₪{service.price})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.serviceId && (
                                <div className="mt-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-600/30 p-4 rounded-lg">
                                    <div className="text-sm text-gray-300 mb-1">משך: {services.find(s => s._id === formData.serviceId)?.duration} דקות</div>
                                    <div className="text-2xl font-bold text-yellow-400">
                                        ₪{formData.price}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date & Time Selection */}
                        <div className="border-b border-yellow-600/20 pb-6">
                            <h3 className="text-lg font-bold text-yellow-400 mb-4">תאריך ושעה</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-300 font-medium mb-2">
                                        תאריך *
                                    </label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        required
                                        min={getMinDate()}
                                        max={getMaxDate()}
                                        className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-300 font-medium mb-2">
                                        שעה *
                                    </label>
                                    {loadingSlots ? (
                                        <div className="w-full px-4 py-2 bg-black border border-yellow-600/30 rounded-lg text-gray-400">
                                            טוען שעות זמינות...
                                        </div>
                                    ) : (
                                        <select
                                            name="time"
                                            value={formData.time}
                                            onChange={handleChange}
                                            required
                                            disabled={!formData.date || !formData.serviceId}
                                            className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50"
                                        >
                                            <option value="">
                                                {!formData.serviceId ? 'בחר שירות תחילה' : !formData.date ? 'בחר תאריך תחילה' : 'בחר שעה'}
                                            </option>
                                            {availableSlots.map(slot => (
                                                <option key={slot.time} value={slot.time}>
                                                    {slot.time}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {formData.date && formData.serviceId && availableSlots.length === 0 && !loadingSlots && (
                                        <div className="mt-2 text-sm text-yellow-400">
                                            אין שעות זמינות בתאריך זה
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-gray-300 font-medium mb-2">
                                    הערות (אופציונלי)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
                                    placeholder="פרטים נוספים או בקשות מיוחדות..."
                                />
                            </div>
                        </div>

                        {/* Payment Information */}
                        {formData.price > 0 && (
                            <div className="border-t border-yellow-600/20 pt-6">
                                <h3 className="text-lg font-bold text-yellow-400 mb-4">פרטי תשלום</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-300 font-medium mb-2">
                                            אמצעי תשלום
                                        </label>
                                        <select
                                            name="paymentMethod"
                                            value={formData.paymentMethod}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                        >
                                            <option value="credit_card">כרטיס אשראי</option>
                                            <option value="bit">Bit</option>
                                            <option value="bank_transfer">העברה בנקאית</option>
                                            <option value="cash">מזומן</option>
                                        </select>
                                    </div>

                                    {paymentOptions && (
                                        <div>
                                            <label className="block text-gray-300 font-medium mb-2">
                                                ספק תשלום
                                            </label>
                                            <select
                                                name="provider"
                                                value={formData.provider}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                                </div>

                                <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-600/30 p-6 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <div className="text-gray-300">סכום לתשלום:</div>
                                        <div className="text-3xl font-bold text-yellow-400">
                                            ₪{formData.price}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-4 px-6 rounded-lg font-bold text-lg shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'מעבד...' : formData.price > 0 ? 'המשך לתשלום וקבע תור' : 'קבע תור'}
                        </button>
                    </form>
                </div>

                {/* Information Notice */}
                <div className="mt-6 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-600/30 rounded-lg p-6">
                    <h4 className="font-bold text-yellow-400 mb-2">ℹ️ מידע חשוב</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• תקבל אישור למייל ולטלפון לאחר קביעת התור</li>
                        <li>• ניתן לבטל/לשנות תור עד 24 שעות מראש</li>
                        <li>• במידה ותאחר, נא ליצור קשר מראש</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AppointmentBooking;
