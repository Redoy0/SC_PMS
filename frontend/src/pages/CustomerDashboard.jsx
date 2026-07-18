import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import { Link } from 'react-router-dom';
import { createSocket } from '../socket';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

function Navbar({ onLogout, user }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);

  return (
    <header className="navbar">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-surface-900">{t.scpmsTitle}</span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full">Customer</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="text-sm">
              <div className="font-medium text-surface-900">{user?.name}</div>
              <div className="text-xs text-surface-500 capitalize">{user?.role}</div>
            </div>
          </div>
          <LanguageSwitcher />
          <button 
            onClick={onLogout} 
            className="btn-secondary btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function BookingForm({ onCreated }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [form, setForm] = useState({
    pickupAddress: '',
    deliveryAddress: '',
    parcelSize: 'Small',
    parcelType: 'Standard',
    paymentType: 'Prepaid',
    codAmount: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const p = await apiFetch('/parcels', { method: 'POST', body: JSON.stringify(form) });
      onCreated(p);
      setForm({ pickupAddress: '', deliveryAddress: '', parcelSize: 'Small', parcelType: 'Standard', paymentType: 'Prepaid', codAmount: 0, notes: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-surface-900">{t.bookParcel}</h3>
          <p className="text-sm text-surface-500">Fill in the delivery details</p>
        </div>
      </div>
      
      <form onSubmit={submit} className="space-y-5">
        <div className="form-group">
          <label className="label flex items-center gap-2">
            <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {t.pickupAddress}
          </label>
          <input 
            className="input" 
            placeholder="Enter pickup location"
            value={form.pickupAddress} 
            onChange={e => setForm({ ...form, pickupAddress: e.target.value })} 
          />
        </div>
        
        <div className="form-group">
          <label className="label flex items-center gap-2">
            <svg className="w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {t.deliveryAddress}
          </label>
          <input 
            className="input" 
            placeholder="Enter delivery location"
            value={form.deliveryAddress} 
            onChange={e => setForm({ ...form, deliveryAddress: e.target.value })} 
          />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="form-group">
            <label className="label">{t.parcelSize}</label>
            <select 
              className="select" 
              value={form.parcelSize} 
              onChange={e => setForm({ ...form, parcelSize: e.target.value })}
            >
              <option value="Small">{t.small}</option>
              <option value="Medium">{t.medium}</option>
              <option value="Large">{t.large}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">{t.parcelType}</label>
            <select 
              className="select" 
              value={form.parcelType} 
              onChange={e => setForm({ ...form, parcelType: e.target.value })}
            >
              <option value="Standard">{t.standard}</option>
              <option value="Document">{t.document}</option>
              <option value="Fragile">{t.fragile}</option>
              <option value="Perishable">{t.perishable}</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">{t.paymentType}</label>
            <select 
              className="select" 
              value={form.paymentType} 
              onChange={e => setForm({ ...form, paymentType: e.target.value })}
            >
              <option value="Prepaid">{t.prepaid}</option>
              <option value="COD">{t.cod}</option>
            </select>
          </div>
        </div>
        
        {form.paymentType === 'COD' && (
          <div className="form-group">
            <label className="label">{t.codAmount}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium">৳</span>
              <input 
                type="number" 
                className="input pl-8" 
                placeholder="0.00"
                value={form.codAmount} 
                onChange={e => setForm({ ...form, codAmount: Number(e.target.value) })} 
              />
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label className="label">{t.notes}</label>
          <input 
            className="input" 
            placeholder="Special instructions (optional)"
            value={form.notes} 
            onChange={e => setForm({ ...form, notes: e.target.value })} 
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading || !form.pickupAddress || !form.deliveryAddress} 
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              {t.booking}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.bookParcelButton}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusClasses = {
    'Pending': 'badge-pending',
    'Assigned': 'badge-assigned',
    'Picked Up': 'badge-picked-up',
    'In Transit': 'badge-in-transit',
    'Delivered': 'badge-delivered',
    'Failed': 'badge-failed'
  };

  return (
    <span className={`badge ${statusClasses[status] || 'badge-pending'}`}>
      {status}
    </span>
  );
}

function ParcelTable({ parcels }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-info-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-surface-900">{t.parcels}</h3>
          <p className="text-sm text-surface-500">Your shipment history</p>
        </div>
      </div>
      
      {parcels.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-surface-500">No parcels yet. Book your first delivery!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{t.tracking}</th>
                <th>{t.status}</th>
                <th>{t.payment}</th>
                <th>{t.created}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr key={p._id}>
                  <td>
                    <span className="font-mono font-semibold text-brand-600">{p.trackingCode}</span>
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <span className={p.paymentType === 'COD' ? 'text-warning-600 font-medium' : ''}>
                      {p.paymentType}
                      {p.paymentType === 'COD' && <span className="text-surface-500 ml-1">(৳{p.codAmount})</span>}
                    </span>
                  </td>
                  <td className="text-surface-500">
                    {new Date(p.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/customer/parcel/${p._id}`}
                        className="btn-primary btn-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {t.view}
                      </Link>
                      <Link
                        to={`/customer/parcel/qr/${p._id}`}
                        className="btn-secondary btn-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        {t.qrCode}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial parcels
  useEffect(() => {
    apiFetch('/parcels')
      .then(setParcels)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Socket.IO real-time updates
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const socket = createSocket(`customer-${userId}`);

    // Handle parcel updates
    const handleParcelUpdate = (updatedParcel) => {
      setParcels(prevParcels => {
        const exists = prevParcels.find(p => p._id === updatedParcel.id || p._id === updatedParcel._id);
        if (exists) {
          return prevParcels.map(p => 
            (p._id === updatedParcel.id || p._id === updatedParcel._id) 
              ? { ...p, ...updatedParcel } 
              : p
          );
        }
        // If it's a new parcel for this customer, add it
        return [updatedParcel, ...prevParcels];
      });
    };

    socket.on('parcel:update', handleParcelUpdate);

    return () => {
      socket.off('parcel:update', handleParcelUpdate);
      socket.disconnect();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar user={user} onLogout={logout} />
      <main className="container py-8">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-3">
            <span className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            {t.customerDashboard}
          </h1>
          <p className="page-subtitle">Book parcels and track your deliveries</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="spinner w-8 h-8 text-brand-600"></span>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3 animate-fade-in">
            <div className="lg:col-span-1">
              <BookingForm onCreated={(p) => setParcels(x => [p, ...x])} />
            </div>
            <div className="lg:col-span-2">
              <ParcelTable parcels={parcels} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
