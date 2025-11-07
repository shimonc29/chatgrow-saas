import { useState, useEffect } from 'react';
import MainLayout from '../../components/Layout/MainLayout';
import { customersAPI } from '../../services/api';

const Customers = () => {
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      setCustomers(response.data.customers || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('שגיאה בטעינת לקוחות');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && editCustomerId) {
        const response = await customersAPI.update(editCustomerId, formData);
        setCustomers(customers.map(c => c._id === editCustomerId ? response.data.customer : c));
        alert('לקוח עודכן בהצלחה!');
      } else {
        const response = await customersAPI.create(formData);
        setCustomers([response.data.customer, ...customers]);
      }
      
      setFormData({ fullName: '', email: '', phone: '', notes: '' });
      setShowModal(false);
      setEditMode(false);
      setEditCustomerId(null);
    } catch (err) {
      console.error('Error saving customer:', err);
      alert('שגיאה בשמירת לקוח: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (customer) => {
    setFormData({
      fullName: `${customer.firstName} ${customer.lastName}`,
      email: customer.email || '',
      phone: customer.phone,
      notes: customer.notes || '',
    });
    setEditCustomerId(customer._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleOpenModal = () => {
    setFormData({ fullName: '', email: '', phone: '', notes: '' });
    setEditMode(false);
    setEditCustomerId(null);
    setShowModal(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return;
    
    try {
      await customersAPI.delete(customerId);
      setCustomers(customers.filter(c => c._id !== customerId));
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('שגיאה במחיקת לקוח');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8 flex justify-center items-center min-h-screen bg-bg-light">
          <div className="text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-text-secondary">טוען לקוחות...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 bg-bg-light min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent-teal">ניהול לקוחות</h1>
            <p className="text-text-primary mt-2">נהל את רשימת הלקוחות שלך</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
          >
            <span>➕</span>
            <span>לקוח חדש</span>
          </button>
        </div>

        {error && (
          <div className="bg-bg-light border border-red-600/30 text-red-400 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Customers Table */}
        {customers.length > 0 ? (
          <div className="bg-bg-light border border-accent-teal/30 rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-yellow-600/20">
              <thead className="bg-black/50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-accent-teal uppercase">שם מלא</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-accent-teal uppercase">אימייל</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-accent-teal uppercase">טלפון</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-accent-teal uppercase">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-accent-teal uppercase">תאריך הצטרפות</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-accent-teal uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-600/10">
                {customers.map((customer) => {
                  const fullName = `${customer.firstName} ${customer.lastName}`;
                  return (
                    <tr key={customer._id} className="hover:bg-bg-light/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-teal to-accent-hover flex items-center justify-center">
                              <span className="text-black font-semibold">
                                {customer.firstName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-text-primary">{fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{customer.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{customer.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          customer.status === 'active' ? 'bg-green-900/50 text-green-400 border border-green-600/30' : 'bg-bg-light text-text-secondary border border-gray-600/30'
                        }`}>
                          {customer.status === 'active' ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(customer.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-reverse space-x-3">
                          <button 
                            onClick={() => handleEdit(customer)}
                            className="text-accent-teal hover:text-accent-teal/80"
                          >
                            ✏️ ערוך
                          </button>
                          <button 
                            onClick={() => handleDelete(customer._id)}
                            className="text-red-400 hover:text-red-500"
                          >
                            🗑️ מחיקה
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-bg-light border border-accent-teal/30 rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-accent-teal mb-2">אין לקוחות עדיין</h3>
            <p className="text-text-primary mb-6">הוסף את הלקוח הראשון שלך!</p>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-accent-teal to-accent-hover text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
            >
              ➕ הוסף לקוח חדש
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-light border border-accent-teal/30 rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-accent-teal/30">
                <h2 className="text-2xl font-bold text-accent-teal">
                  {editMode ? 'ערוך לקוח' : 'לקוח חדש'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">שם מלא</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="שם פרטי ומשפחה"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">אימייל</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="example@mail.com"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">טלפון</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="05X-XXX-XXXX"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-accent-teal mb-2">הערות (אופציונלי)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 bg-bg-light border border-accent-teal/30 text-white rounded-lg focus:ring-2 focus:ring-accent-teal focus:border-transparent outline-none"
                      placeholder="הערות על הלקוח..."
                    />
                  </div>
                </div>
                <div className="flex space-x-reverse space-x-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-accent-teal to-accent-hover text-black py-3 rounded-lg font-semibold transition-all shadow-lg shadow-accent-teal/50 hover:shadow-accent-teal/70"
                  >
                    {editMode ? 'שמור שינויים' : 'הוסף לקוח'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-bg-light text-text-primary border border-accent-teal/20 py-3 rounded-lg font-semibold transition-all hover:border-accent-teal/50"
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

export default Customers;
