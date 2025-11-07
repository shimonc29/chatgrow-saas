import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { paymentsAPI, customersAPI } from '../../services/api';

const Payments = () => {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [providers, setProviders] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    currency: 'ILS',
    paymentMethod: 'credit_card',
    provider: 'manual',
    notes: '',
    relatedToType: 'other',
  });

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchProviders();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsAPI.getAll();
      setPayments(response.data.payments || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('שגיאה בטעינת תשלומים');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await paymentsAPI.getProviders();
      setProviders(response.data.providers || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.amount) {
      alert('נא למלא את כל השדות הנדרשים');
      return;
    }

    try {
      const customer = customers.find(c => c._id === formData.customerId);
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        customer: {
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone
        },
        relatedTo: {
          type: formData.relatedToType || 'other'
        }
      };

      if (editMode && editPaymentId) {
        await paymentsAPI.update(editPaymentId, paymentData);
        alert('תשלום עודכן בהצלחה!');
      } else {
        await paymentsAPI.create(paymentData);
      }
      
      await fetchPayments();
      setFormData({
        customerId: '',
        amount: '',
        currency: 'ILS',
        paymentMethod: 'credit_card',
        provider: 'manual',
        notes: '',
        relatedToType: 'other',
      });
      setShowModal(false);
      setEditMode(false);
      setEditPaymentId(null);
    } catch (err) {
      console.error('Error saving payment:', err);
      alert('שגיאה בשמירת תשלום: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (payment) => {
    setFormData({
      customerId: payment.customerId?._id || payment.customerId,
      amount: payment.amount.toString(),
      currency: payment.currency || 'ILS',
      paymentMethod: payment.paymentMethod,
      provider: payment.provider?.id || payment.provider || 'manual',
      notes: payment.notes || '',
      relatedToType: payment.relatedTo?.type || 'other',
    });
    setEditPaymentId(payment._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setFormData({
      customerId: '',
      amount: '',
      currency: 'ILS',
      paymentMethod: 'credit_card',
      relatedToType: 'other',
      provider: 'manual',
      notes: '',
    });
    setEditMode(false);
    setEditPaymentId(null);
    setShowModal(true);
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תשלום זה?')) return;
    
    try {
      await paymentsAPI.delete(paymentId);
      setPayments(payments.filter(p => p._id !== paymentId));
    } catch (err) {
      console.error('Error deleting payment:', err);
      alert('שגיאה במחיקת תשלום');
    }
  };

  const handleCompletePayment = async (paymentId) => {
    try {
      await paymentsAPI.complete(paymentId);
      await fetchPayments();
    } catch (err) {
      console.error('Error completing payment:', err);
      alert('שגיאה בסימון תשלום כהושלם');
    }
  };

  const formatCurrency = (amount, currency = 'ILS') => {
    const symbol = currency === 'ILS' ? '₪' : currency === 'USD' ? '$' : '€';
    return `${symbol}${amount.toLocaleString('he-IL')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'ממתין',
      processing: 'בעיבוד',
      completed: 'הושלם',
      failed: 'נכשל',
      refunded: 'זוכה',
      cancelled: 'בוטל',
    };
    return texts[status] || status;
  };

  const getMethodText = (method) => {
    const texts = {
      credit_card: 'כרטיס אשראי',
      bit: 'ביט',
      paypal: 'PayPal',
      bank_transfer: 'העברה בנקאית',
      cash: 'מזומן',
      other: 'אחר',
    };
    return texts[method] || method;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 to-black">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-400">טוען תשלומים...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 bg-gradient-to-br from-gray-900 to-black min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">ניהול תשלומים</h1>
            <p className="text-gray-300 mt-2">נהל את התשלומים והחשבוניות שלך</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-all shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70"
          >
            <span>💳</span>
            <span>תשלום חדש</span>
          </button>
        </div>

        {error && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-red-600/30 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Payments Table */}
        {payments.length > 0 ? (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-yellow-600/20">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-400 uppercase">לקוח</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-400 uppercase">סכום</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-400 uppercase">אמצעי תשלום</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-400 uppercase">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-400 uppercase">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-400 uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-600/10">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-300">
                        {payment.customer?.name || payment.customerId?.firstName + ' ' + payment.customerId?.lastName || '-'}
                      </div>
                      <div className="text-sm text-gray-400">{payment.customer?.phone || payment.customerId?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-yellow-400">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{getMethodText(payment.paymentMethod)}</div>
                      <div className="text-xs text-gray-400">{payment.provider?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-600/30' :
                        payment.status === 'processing' ? 'bg-blue-900/50 text-blue-400 border border-blue-600/30' :
                        payment.status === 'completed' ? 'bg-green-900/50 text-green-400 border border-green-600/30' :
                        payment.status === 'failed' ? 'bg-red-900/50 text-red-400 border border-red-600/30' :
                        payment.status === 'refunded' ? 'bg-gray-800 text-gray-400 border border-gray-600/30' :
                        payment.status === 'cancelled' ? 'bg-gray-800 text-gray-400 border border-gray-600/30' :
                        'bg-gray-800 text-gray-400 border border-gray-600/30'
                      }`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-reverse space-x-3">
                        <button
                          onClick={() => handleEdit(payment)}
                          className="text-yellow-400 hover:text-yellow-500"
                          title="ערוך"
                        >
                          ✏️
                        </button>
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => handleCompletePayment(payment._id)}
                            className="text-green-400 hover:text-green-500"
                            title="סמן כהושלם"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(payment._id)}
                          className="text-red-400 hover:text-red-500"
                          title="מחק"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-xl shadow-lg">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">אין תשלומים עדיין</h3>
            <p className="text-gray-300 mb-6">התחל לעקוב אחר התשלומים שלך</p>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70"
            >
              יצירת תשלום ראשון
            </button>
          </div>
        )}

        {/* Create Payment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-900 to-black border border-yellow-600/30 rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">
                {editMode ? 'ערוך תשלום' : 'תשלום חדש'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">לקוח *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  >
                    <option value="">בחר לקוח</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.firstName} {customer.lastName} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">סכום *</label>
                  <div className="flex space-x-reverse space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="flex-1 px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-24 px-2 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="ILS">₪ ILS</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">אמצעי תשלום</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="credit_card">כרטיס אשראי</option>
                    <option value="bit">ביט</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="cash">מזומן</option>
                    <option value="other">אחר</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">ספק תשלום</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="manual">ידני</option>
                    {providers.map(provider => (
                      <option key={provider.name} value={provider.name}>
                        {provider.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">הערות</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 bg-black border border-yellow-600/30 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="הערות נוספות..."
                  />
                </div>

                <div className="flex space-x-reverse space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black py-3 rounded-lg font-semibold transition-all shadow-lg shadow-yellow-500/50 hover:shadow-yellow-500/70"
                  >
                    יצירת תשלום
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({
                        customerId: '',
                        amount: '',
                        currency: 'ILS',
                        paymentMethod: 'credit_card',
                        provider: 'manual',
                        notes: '',
                      });
                    }}
                    className="flex-1 bg-gray-800 text-gray-300 border border-yellow-600/20 py-3 rounded-lg font-semibold transition-all hover:border-yellow-500/50"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Payments;
