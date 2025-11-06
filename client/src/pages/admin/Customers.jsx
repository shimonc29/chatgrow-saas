import { useState } from 'react';
import MainLayout from '../../components/Layout/MainLayout';

const Customers = () => {
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCustomer = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toLocaleDateString('he-IL'),
      eventsAttended: 0,
    };
    setCustomers([...customers, newCustomer]);
    setFormData({ fullName: '', email: '', phone: '', notes: '' });
    setShowModal(false);
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ניהול לקוחות</h1>
            <p className="text-gray-600 mt-2">נהל את רשימת הלקוחות שלך</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-reverse space-x-2 transition-colors"
          >
            <span>➕</span>
            <span>לקוח חדש</span>
          </button>
        </div>

        {/* Customers Table */}
        {customers.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם מלא</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אימייל</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">טלפון</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אירועים</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך הצטרפות</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                            <span className="text-brand-600 font-semibold">
                              {customer.fullName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.eventsAttended}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-brand-600 hover:text-brand-900 ml-3">עריכה</button>
                      <button className="text-red-600 hover:text-red-900">מחיקה</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">אין לקוחות עדיין</h3>
            <p className="text-gray-600 mb-6">הוסף את הלקוח הראשון שלך!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              ➕ הוסף לקוח חדש
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">לקוח חדש</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="שם פרטי ומשפחה"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">אימייל</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="example@mail.com"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">טלפון</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="05X-XXX-XXXX"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">הערות (אופציונלי)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="הערות על הלקוח..."
                    />
                  </div>
                </div>
                <div className="flex space-x-reverse space-x-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    הוסף לקוח
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
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
