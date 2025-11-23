import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getSourceTracking, buildSourceKey, storeSourceTracking } from '../../utils/sourceTracking';
import ServiceCard from '../../components/booking/ServiceCard';
import CalendarPicker from '../../components/booking/CalendarPicker';
import TimeSlotPicker from '../../components/booking/TimeSlotPicker';
import SuccessMessage from '../../components/booking/SuccessMessage';

function AppointmentBooking() {
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('businessId');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: ''
  });
  
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!businessId) {
      setError('לא נמצא מזהה עסק. אנא השתמש בקישור המלא שקיבלת.');
      setLoading(false);
    } else {
      fetchServices();
      
      const tracking = getSourceTracking();
      if (!tracking.sourceKey) {
        tracking.sourceKey = buildSourceKey('appointment', businessId);
      }
      storeSourceTracking(tracking);
    }
  }, [businessId]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/public/services?providerId=${businessId}`);
      if (response.data.success) {
        setServices(response.data.services);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('שגיאה בטעינת רשימת השירותים');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await axios.get('/api/public/availability/slots', {
        params: {
          providerId: businessId,
          date: selectedDate,
          serviceId: selectedService._id
        }
      });
      if (response.data.success) {
        setTimeSlots(response.data.slots || []);
      } else {
        setTimeSlots([]);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectService = (service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeSlots([]);
    setStep(2);
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep(3);
  };

  const handleSelectTime = (time) => {
    setSelectedTime(time);
    setStep(4);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customer.firstName || !customer.lastName || !customer.phone) {
      setError('נא למלא את כל השדות הנדרשים: שם פרטי, שם משפחה וטלפון');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const tracking = getSourceTracking();
      
      const response = await axios.post('/api/public/appointments', {
        businessId,
        serviceId: selectedService._id,
        date: selectedDate,
        time: selectedTime,
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email || '',
        },
        notes: customer.notes,
        paymentMethod: 'credit_card',
        provider: 'manual',
        sourceKey: tracking.sourceKey,
        utmSource: tracking.utmSource,
        utmMedium: tracking.utmMedium,
        utmCampaign: tracking.utmCampaign,
        utmTerm: tracking.utmTerm,
        utmContent: tracking.utmContent,
        referralCode: tracking.referralCode
      });
      
      if (response.data.success) {
        setSuccessData({
          serviceName: selectedService.name,
          date: selectedDate,
          time: selectedTime,
          duration: selectedService.duration,
          price: selectedService.price
        });
      } else {
        setError(response.data.message || 'שגיאה בקביעת התור');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setError(err.response?.data?.message || 'שגיאה בקביעת התור. אנא נסה שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSuccessData(null);
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomer({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      notes: ''
    });
  };

  const goBackToStep = (targetStep) => {
    setStep(targetStep);
    if (targetStep < 3) {
      setSelectedDate(null);
      setSelectedTime(null);
      setTimeSlots([]);
    }
    if (targetStep < 2) {
      setSelectedService(null);
    }
  };

  if (successData) {
    return <SuccessMessage appointment={successData} onClose={resetBooking} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">טוען...</p>
        </div>
      </div>
    );
  }

  if (error && !services.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center" dir="rtl">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">שגיאה</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-8 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">📅 קביעת תור</h1>
          <p className="text-gray-600 text-center mb-6">בחר שירות, תאריך ושעה נוחים עבורך</p>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-sky-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="mr-2 text-sm font-medium">בחירת שירות</span>
            </div>
            <div className="h-px w-12 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-sky-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="mr-2 text-sm font-medium">בחירת תאריך</span>
            </div>
            <div className="h-px w-12 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-sky-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="mr-2 text-sm font-medium">בחירת שעה</span>
            </div>
            <div className="h-px w-12 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 4 ? 'text-sky-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 4 ? 'bg-sky-600 text-white' : 'bg-gray-200'}`}>
                4
              </div>
              <span className="mr-2 text-sm font-medium">פרטים ואישור</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">בחר שירות</h2>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(service => (
                    <ServiceCard
                      key={service._id}
                      service={service}
                      isSelected={selectedService?._id === service._id}
                      onClick={handleSelectService}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🛠️</div>
                  <p>אין שירותים זמינים כרגע</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedService && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => goBackToStep(1)}
                  className="text-sky-600 hover:text-sky-700 flex items-center gap-2 mb-4"
                >
                  <span>→</span>
                  <span>חזרה לבחירת שירות</span>
                </button>
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-sky-700">שירות נבחר:</div>
                      <div className="text-lg font-bold text-sky-900">{selectedService.name}</div>
                    </div>
                    <div className="text-sm text-sky-700">
                      ⏱️ {selectedService.duration} דקות • 💰 ₪{selectedService.price}
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">בחר תאריך</h2>
              <CalendarPicker
                onSelectDate={handleSelectDate}
                maxDaysAhead={30}
              />
            </div>
          )}

          {step === 3 && selectedService && selectedDate && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => goBackToStep(2)}
                  className="text-sky-600 hover:text-sky-700 flex items-center gap-2 mb-4"
                >
                  <span>→</span>
                  <span>חזרה לבחירת תאריך</span>
                </button>
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-sm text-sky-700">שירות: </span>
                    <span className="font-bold text-sky-900">{selectedService.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-sky-700">תאריך: </span>
                    <span className="font-bold text-sky-900">
                      {new Date(selectedDate).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">בחר שעה</h2>
              <TimeSlotPicker
                slots={timeSlots}
                selectedTime={selectedTime}
                onSelectTime={handleSelectTime}
                loading={loadingSlots}
              />
            </div>
          )}

          {step === 4 && selectedService && selectedDate && selectedTime && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => goBackToStep(3)}
                  className="text-sky-600 hover:text-sky-700 flex items-center gap-2 mb-4"
                >
                  <span>→</span>
                  <span>חזרה לבחירת שעה</span>
                </button>
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 space-y-2">
                  <div>
                    <span className="text-sm text-sky-700">שירות: </span>
                    <span className="font-bold text-sky-900">{selectedService.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-sky-700">תאריך: </span>
                    <span className="font-bold text-sky-900">
                      {new Date(selectedDate).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-sky-700">שעה: </span>
                    <span className="font-bold text-sky-900">{selectedTime}</span>
                  </div>
                  <div>
                    <span className="text-sm text-sky-700">מחיר: </span>
                    <span className="font-bold text-sky-900">₪{selectedService.price}</span>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">פרטים אישיים</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם פרטי <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customer.firstName}
                      onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="שם פרטי"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם משפחה <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customer.lastName}
                      onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="שם משפחה"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    טלפון <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="050-1234567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אימייל (אופציונלי)
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    הערות (אופציונלי)
                  </label>
                  <textarea
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="הערות נוספות..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-sky-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-sky-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
                >
                  {submitting ? 'מבצע הזמנה...' : '✓ אישור הזמנה'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>© 2025 ChatGrow. כל הזכויות שמורות.</p>
        </div>
      </div>
    </div>
  );
}

export default AppointmentBooking;
