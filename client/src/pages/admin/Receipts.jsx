import { useState, useEffect } from 'react';
import axios from 'axios';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReceipt, setNewReceipt] = useState({
    customerName: '',
    amount: 0,
    description: '',
    paymentMethod: 'cash'
  });

  useEffect(() => {
    fetchReceipts();
    fetchPayments();
  }, []);

  const fetchReceipts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/receipts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReceipts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const handleGenerateFromPayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/receipts/generate/${paymentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ הקבלה נוצרה בהצלחה!');
      fetchReceipts();
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      alert('❌ שגיאה ביצירת הקבלה');
    }
  };

  const handleCreateManualReceipt = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/receipts/manual', newReceipt, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ הקבלה נוצרה בהצלחה!');
      setShowCreateModal(false);
      setNewReceipt({
        customerName: '',
        amount: 0,
        description: '',
        paymentMethod: 'cash'
      });
      fetchReceipts();
    } catch (error) {
      console.error('Failed to create receipt:', error);
      alert('❌ שגיאה ביצירת הקבלה');
    }
  };

  const handleDownloadPDF = async (receiptNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/receipts/download/${receiptNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download receipt:', error);
      alert('❌ שגיאה בהורדת הקבלה');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-app-navy via-card-navy to-app-navy flex items-center justify-center">
        <div className="text-accent-copper text-2xl">⏳ טוען קבלות...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-app-navy via-card-navy to-app-navy p-8 rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-accent-copper mb-2">📃 קבלות</h1>
            <p className="text-text-subtle">ניהול קבלות ומסמכים</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-action-blue to-accent-copper text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-action-blue/50 transition-all"
          >
            ➕ קבלה חדשה
          </button>
        </div>

        {/* Receipts List */}
        <div className="bg-card-navy border border-accent-copper/30 rounded-lg shadow-lg shadow-accent-copper/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-app-navy border-b border-accent-copper/30">
              <tr>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">מספר קבלה</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">שם לקוח</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">סכום</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">אמצעי תשלום</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">תאריך</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt, index) => (
                <tr key={receipt._id} className={`border-b border-accent-copper/10 ${index % 2 === 0 ? 'bg-card-navy' : 'bg-app-navy'}`}>
                  <td className="px-6 py-4 text-text-light font-mono">{receipt.receiptNumber}</td>
                  <td className="px-6 py-4 text-text-light">{receipt.customerName}</td>
                  <td className="px-6 py-4 text-text-light">₪{receipt.amount?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-text-subtle">
                    {receipt.paymentMethod === 'cash' ? 'מזומן' : 
                     receipt.paymentMethod === 'credit' ? 'אשראי' : 
                     receipt.paymentMethod === 'bank_transfer' ? 'העברה בנקאית' : 
                     receipt.paymentMethod}
                  </td>
                  <td className="px-6 py-4 text-text-subtle">
                    {new Date(receipt.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDownloadPDF(receipt.receiptNumber)}
                      className="text-action-blue hover:text-accent-copper transition-colors"
                      title="הורד PDF"
                    >
                      📄 הורד
                    </button>
                  </td>
                </tr>
              ))}
              {receipts.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-text-subtle">
                    אין קבלות עדיין
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Payments without receipts */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-accent-copper mb-4">תשלומים ללא קבלות</h2>
          <div className="bg-card-navy border border-accent-copper/30 rounded-lg shadow-lg shadow-accent-copper/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-app-navy border-b border-accent-copper/30">
                <tr>
                  <th className="px-6 py-4 text-right text-accent-copper font-semibold">לקוח</th>
                  <th className="px-6 py-4 text-right text-accent-copper font-semibold">סכום</th>
                  <th className="px-6 py-4 text-right text-accent-copper font-semibold">תאריך</th>
                  <th className="px-6 py-4 text-right text-accent-copper font-semibold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {payments.filter(p => p.status === 'completed' && !receipts.find(r => r.paymentId === p._id)).map((payment, index) => (
                  <tr key={payment._id} className={`border-b border-accent-copper/10 ${index % 2 === 0 ? 'bg-card-navy' : 'bg-app-navy'}`}>
                    <td className="px-6 py-4 text-text-light">
                      {payment.customerId?.firstName} {payment.customerId?.lastName}
                    </td>
                    <td className="px-6 py-4 text-text-light">
                      {payment.currency || '₪'}{payment.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-text-subtle">
                      {new Date(payment.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleGenerateFromPayment(payment._id)}
                        className="bg-action-blue hover:bg-accent-copper text-white px-4 py-2 rounded transition-all"
                      >
                        צור קבלה
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.filter(p => p.status === 'completed' && !receipts.find(r => r.paymentId === p._id)).length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-text-subtle">
                      אין תשלומים ללא קבלות
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Manual Receipt Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-card-navy border border-accent-copper/30 rounded-lg shadow-2xl shadow-accent-copper/20 max-w-md w-full">
              <div className="p-6 border-b border-accent-copper/30 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-accent-copper">יצירת קבלה ידנית</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-text-subtle hover:text-accent-copper text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-text-light mb-2 font-medium">שם לקוח</label>
                  <input
                    type="text"
                    value={newReceipt.customerName}
                    onChange={(e) => setNewReceipt({ ...newReceipt, customerName: e.target.value })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                </div>

                <div>
                  <label className="block text-text-light mb-2 font-medium">סכום</label>
                  <input
                    type="number"
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, amount: Number(e.target.value) })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                </div>

                <div>
                  <label className="block text-text-light mb-2 font-medium">אמצעי תשלום</label>
                  <select
                    value={newReceipt.paymentMethod}
                    onChange={(e) => setNewReceipt({ ...newReceipt, paymentMethod: e.target.value })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue"
                  >
                    <option value="cash">מזומן</option>
                    <option value="credit">אשראי</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="check">צ׳ק</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-light mb-2 font-medium">תיאור</label>
                  <textarea
                    value={newReceipt.description}
                    onChange={(e) => setNewReceipt({ ...newReceipt, description: e.target.value })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-app-navy border border-accent-copper/30 text-text-light rounded-lg hover:bg-card-navy transition-all"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleCreateManualReceipt}
                    disabled={!newReceipt.customerName || newReceipt.amount <= 0}
                    className="px-6 py-3 bg-gradient-to-r from-action-blue to-accent-copper text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-action-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    צור קבלה
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Receipts;
