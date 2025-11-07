import { useState, useEffect } from 'react';
import axios from 'axios';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    customerId: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    taxRate: 17,
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/invoices/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
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
      setShowCreateModal(false);
      setNewInvoice({
        customerId: '',
        items: [{ description: '', quantity: 1, price: 0 }],
        taxRate: 17,
        notes: ''
      });
      fetchInvoices();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('❌ שגיאה ביצירת החשבונית');
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

  const { subtotal, tax, total } = calculateTotal();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-app-navy via-card-navy to-app-navy flex items-center justify-center">
        <div className="text-accent-copper text-2xl">⏳ טוען חשבוניות...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-app-navy via-card-navy to-app-navy p-8 rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-accent-copper mb-2">🧾 חשבוניות</h1>
            <p className="text-text-subtle">ניהול חשבוניות ומסמכים</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-action-blue to-accent-copper text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-action-blue/50 transition-all"
          >
            ➕ חשבונית חדשה
          </button>
        </div>

        {/* Invoices List */}
        <div className="bg-card-navy border border-accent-copper/30 rounded-lg shadow-lg shadow-accent-copper/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-app-navy border-b border-accent-copper/30">
              <tr>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">מספר</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">לקוח</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">סכום</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">סטטוס</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">תאריך</th>
                <th className="px-6 py-4 text-right text-accent-copper font-semibold">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, index) => (
                <tr key={invoice._id} className={`border-b border-accent-copper/10 ${index % 2 === 0 ? 'bg-card-navy' : 'bg-app-navy'}`}>
                  <td className="px-6 py-4 text-text-light font-mono">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 text-text-light">{invoice.customerName}</td>
                  <td className="px-6 py-4 text-text-light">₪{invoice.total?.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {invoice.status === 'paid' ? 'שולם' : invoice.status === 'pending' ? 'ממתין' : 'בוטל'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-subtle">
                    {new Date(invoice.createdAt).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGeneratePDF(invoice._id)}
                        className="text-action-blue hover:text-accent-copper transition-colors"
                        title="הורד PDF"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => handleSendEmail(invoice._id)}
                        className="text-action-blue hover:text-accent-copper transition-colors"
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
                  <td colSpan="6" className="px-6 py-8 text-center text-text-subtle">
                    אין חשבוניות עדיין
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-card-navy border border-accent-copper/30 rounded-lg shadow-2xl shadow-accent-copper/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-accent-copper/30 flex justify-between items-center sticky top-0 bg-card-navy z-10">
                <h2 className="text-2xl font-bold text-accent-copper">יצירת חשבונית חדשה</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-text-subtle hover:text-accent-copper text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Selection */}
                <div>
                  <label className="block text-text-light mb-2 font-medium">לקוח</label>
                  <select
                    value={newInvoice.customerId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue"
                  >
                    <option value="">בחר לקוח</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.firstName} {customer.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-text-light font-medium">פריטים</label>
                    <button
                      onClick={handleAddItem}
                      className="text-action-blue hover:text-accent-copper text-sm font-medium"
                    >
                      ➕ הוסף פריט
                    </button>
                  </div>
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="bg-app-navy border border-accent-copper/30 rounded-lg p-4 mb-3">
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-6">
                          <input
                            type="text"
                            placeholder="תיאור"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full bg-card-navy border border-accent-copper/30 text-text-light px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="כמות"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full bg-card-navy border border-accent-copper/30 text-text-light px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="מחיר"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            className="w-full bg-card-navy border border-accent-copper/30 text-text-light px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-action-blue"
                          />
                        </div>
                        <div className="col-span-1 flex items-center">
                          {newInvoice.items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-text-light mb-2 font-medium">מע״מ (%)</label>
                  <input
                    type="number"
                    value={newInvoice.taxRate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: Number(e.target.value) })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-text-light mb-2 font-medium">הערות</label>
                  <textarea
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    className="w-full bg-app-navy border border-accent-copper/50 text-text-light px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue"
                    rows="3"
                  />
                </div>

                {/* Summary */}
                <div className="bg-app-navy border border-accent-copper/30 rounded-lg p-4">
                  <div className="space-y-2 text-text-light">
                    <div className="flex justify-between">
                      <span>סכום ביניים:</span>
                      <span>₪{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>מע״מ ({newInvoice.taxRate}%):</span>
                      <span>₪{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-accent-copper text-lg pt-2 border-t border-accent-copper/30">
                      <span>סה״כ:</span>
                      <span>₪{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-app-navy border border-accent-copper/30 text-text-light rounded-lg hover:bg-card-navy transition-all"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleCreateInvoice}
                    disabled={!newInvoice.customerId || newInvoice.items.some(i => !i.description)}
                    className="px-6 py-3 bg-gradient-to-r from-action-blue to-accent-copper text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-action-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    צור חשבונית
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

export default Invoices;
