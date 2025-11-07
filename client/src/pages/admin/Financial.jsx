import { useState, useEffect } from 'react';
import axios from 'axios';

const Financial = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const [newInvoice, setNewInvoice] = useState({
    customerId: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    taxRate: 17,
    notes: ''
  });

  const [newReceipt, setNewReceipt] = useState({
    customerName: '',
    amount: 0,
    description: '',
    paymentMethod: 'cash'
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [invoicesRes, receiptsRes, paymentsRes, customersRes] = await Promise.all([
        axios.get('/api/invoices/list', { headers }).catch(() => ({ data: { invoices: [] } })),
        axios.get('/api/receipts', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/payments', { headers }).catch(() => ({ data: { payments: [] } })),
        axios.get('/api/customers', { headers }).catch(() => ({ data: [] }))
      ]);

      setInvoices(invoicesRes.data.invoices || []);
      setReceipts(Array.isArray(receiptsRes.data) ? receiptsRes.data : []);
      setPayments(paymentsRes.data.payments || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const items = newInvoice.items.filter((_, i) => i !== index);
    setNewInvoice({ ...newInvoice, items });
  };

  const handleItemChange = (index, field, value) => {
    const items = [...newInvoice.items];
    items[index][field] = field === 'description' ? value : Number(value);
    setNewInvoice({ ...newInvoice, items });
  };

  const calculateTotal = () => {
    const subtotal = newInvoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * (newInvoice.taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCreateInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/invoices/create', newInvoice, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ החשבונית נוצרה בהצלחה!');
      setShowInvoiceModal(false);
      setNewInvoice({
        customerId: '',
        items: [{ description: '', quantity: 1, price: 0 }],
        taxRate: 17,
        notes: ''
      });
      fetchAll();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('❌ שגיאה ביצירת החשבונית');
    }
  };

  const handleCreateManualReceipt = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/receipts/manual', newReceipt, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ הקבלה נוצרה בהצלחה!');
      setShowReceiptModal(false);
      setNewReceipt({
        customerName: '',
        amount: 0,
        description: '',
        paymentMethod: 'cash'
      });
      fetchAll();
    } catch (error) {
      console.error('Failed to create receipt:', error);
      alert('❌ שגיאה ביצירת הקבלה');
    }
  };

  const handleGenerateFromPayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/receipts/generate/${paymentId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ הקבלה נוצרה בהצלחה!');
      fetchAll();
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      alert('❌ שגיאה ביצירת הקבלה');
    }
  };

  const handleGeneratePDF = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/invoices/${invoiceId}/generate-pdf`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ PDF נוצר: ${response.data.fileName}`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('❌ שגיאה ביצירת PDF');
    }
  };

  const handleSendEmail = async (invoiceId) => {
    const email = prompt('הכנס כתובת אימייל:');
    if (!email) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/invoices/${invoiceId}/send`, 
        { to: email, subject: 'חשבונית מס' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert('✅ החשבונית נשלחה בהצלחה!');
    } catch (error) {
      console.error('Failed to send invoice:', error);
      alert('❌ שגיאה בשליחת החשבונית');
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

  const { subtotal, tax, total } = calculateTotal();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-accent-teal text-2xl">⏳ טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light p-8 rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">💰 ניהול פיננסי</h1>
          <p className="text-text-secondary">ניהול חשבוניות וקבלות</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'invoices'
                ? 'text-accent-teal border-b-2 border-accent-teal'
                : 'text-text-secondary hover:text-accent-teal'
            }`}
          >
            🧾 חשבוניות ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'receipts'
                ? 'text-accent-teal border-b-2 border-accent-teal'
                : 'text-text-secondary hover:text-accent-teal'
            }`}
          >
            📃 קבלות ({receipts.length})
          </button>
        </div>

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="bg-accent-teal hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md"
              >
                ➕ חשבונית חדשה
              </button>
            </div>

            <div className="bg-bg-card rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">מספר</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">לקוח</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">סכום</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">סטטוס</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">תאריך</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr key={invoice._id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 text-text-primary font-mono">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-text-primary">{invoice.customerName}</td>
                      <td className="px-6 py-4 text-text-primary">₪{invoice.total?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {invoice.status === 'paid' ? 'שולם' : invoice.status === 'pending' ? 'ממתין' : 'בוטל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(invoice.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGeneratePDF(invoice._id)}
                            className="text-accent-teal hover:text-accent-hover transition-colors"
                            title="הורד PDF"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => handleSendEmail(invoice._id)}
                            className="text-accent-teal hover:text-accent-hover transition-colors"
                            title="שלח באימייל"
                          >
                            📧
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-text-secondary">
                        אין חשבוניות עדיין
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === 'receipts' && (
          <div>
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowReceiptModal(true)}
                className="bg-accent-teal hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md"
              >
                ➕ קבלה חדשה
              </button>
            </div>

            <div className="bg-bg-card rounded-lg shadow-md overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-text-primary">קבלות קיימות</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">מספר קבלה</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">לקוח</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">סכום</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">אמצעי תשלום</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">תאריך</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt, index) => (
                    <tr key={receipt._id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 text-text-primary font-mono">{receipt.receiptNumber}</td>
                      <td className="px-6 py-4 text-text-primary">{receipt.customerName}</td>
                      <td className="px-6 py-4 text-text-primary">₪{receipt.amount?.toFixed(2)}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        {receipt.paymentMethod === 'cash' ? 'מזומן' : 
                         receipt.paymentMethod === 'credit' ? 'אשראי' : 
                         receipt.paymentMethod === 'bank_transfer' ? 'העברה בנקאית' : 
                         receipt.paymentMethod}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(receipt.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDownloadPDF(receipt.receiptNumber)}
                          className="text-accent-teal hover:text-accent-hover transition-colors"
                          title="הורד PDF"
                        >
                          📄 הורד
                        </button>
                      </td>
                    </tr>
                  ))}
                  {receipts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-text-secondary">
                        אין קבלות עדיין
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payments without receipts */}
            <div className="bg-bg-card rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-text-primary">תשלומים ללא קבלות</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">לקוח</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">סכום</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">תאריך</th>
                    <th className="px-6 py-4 text-right text-text-primary font-semibold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.filter(p => p.status === 'completed' && !receipts.find(r => r.paymentId === p._id)).map((payment, index) => (
                    <tr key={payment._id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 text-text-primary">
                        {payment.customerId?.firstName} {payment.customerId?.lastName}
                      </td>
                      <td className="px-6 py-4 text-text-primary">
                        {payment.currency || '₪'}{payment.amount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(payment.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleGenerateFromPayment(payment._id)}
                          className="bg-accent-teal hover:bg-accent-hover text-white px-4 py-2 rounded transition-all"
                        >
                          צור קבלה
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.filter(p => p.status === 'completed' && !receipts.find(r => r.paymentId === p._id)).length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-text-secondary">
                        אין תשלומים ללא קבלות
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-bg-card z-10">
                <h2 className="text-2xl font-bold text-text-primary">יצירת חשבונית חדשה</h2>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-text-secondary hover:text-text-primary text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-text-primary mb-2 font-medium">לקוח</label>
                  <select
                    value={newInvoice.customerId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal"
                  >
                    <option value="">בחר לקוח</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.firstName} {customer.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-text-primary font-medium">פריטים</label>
                    <button
                      onClick={handleAddItem}
                      className="text-accent-teal hover:text-accent-hover text-sm font-medium"
                    >
                      ➕ הוסף פריט
                    </button>
                  </div>
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6">
                          <input
                            type="text"
                            placeholder="תיאור"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full bg-white border border-gray-300 text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent-teal"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="כמות"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full bg-white border border-gray-300 text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent-teal"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="מחיר"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-full bg-white border border-gray-300 text-text-primary px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent-teal"
                          />
                        </div>
                        <div className="col-span-1 flex items-center">
                          {newInvoice.items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-text-primary mb-2 font-medium">מע״מ (%)</label>
                  <input
                    type="number"
                    value={newInvoice.taxRate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-300 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal"
                  />
                </div>

                <div>
                  <label className="block text-text-primary mb-2 font-medium">הערות</label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal"
                    rows="3"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-text-primary">
                    <div className="flex justify-between">
                      <span>סכום ביניים:</span>
                      <span>₪{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מע״מ ({newInvoice.taxRate}%):</span>
                      <span>₪{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-accent-teal text-lg pt-2 border-t">
                      <span>סה״כ:</span>
                      <span>₪{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-6 py-3 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 transition-all"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleCreateInvoice}
                    disabled={!newInvoice.customerId || newInvoice.items.some(i => !i.description)}
                    className="px-6 py-3 bg-accent-teal hover:bg-accent-hover text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    צור חשבונית
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-lg shadow-2xl max-w-md w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">יצירת קבלה ידנית</h2>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-text-secondary hover:text-text-primary text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-text-primary mb-2 font-medium">שם לקוח</label>
                  <input
                    type="text"
                    value={newReceipt.customerName}
                    onChange={(e) => setNewReceipt({ ...newReceipt, customerName: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal"
                  />
                </div>

                <div>
                  <label className="block text-text-primary mb-2 font-medium">סכום</label>
                  <input
                    type="number"
                    value={newReceipt.amount}
                    onChange={(e) => setNewReceipt({ ...newReceipt, amount: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-300 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal"
                  />
                </div>

                <div>
                  <label className="block text-text-primary mb-2 font-medium">אמצעי תשלום</label>
                  <select
                    value={newReceipt.paymentMethod}
                    onChange={(e) => setNewReceipt({ ...newReceipt, paymentMethod: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal"
                  >
                    <option value="cash">מזומן</option>
                    <option value="credit">אשראי</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                    <option value="check">צ׳ק</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-primary mb-2 font-medium">תיאור</label>
                  <textarea
                    value={newReceipt.description}
                    onChange={(e) => setNewReceipt({ ...newReceipt, description: e.target.value })}
                    className="w-full bg-white border border-gray-300 text-text-primary px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-teal"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="px-6 py-3 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 transition-all"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleCreateManualReceipt}
                    disabled={!newReceipt.customerName || newReceipt.amount <= 0}
                    className="px-6 py-3 bg-accent-teal hover:bg-accent-hover text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Financial;
