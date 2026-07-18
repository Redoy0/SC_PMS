import { useEffect, useMemo, useState } from 'react';
import { apiFetch, apiFetchBlob } from '../api';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import { Link } from 'react-router-dom';
import { createSocket } from '../socket';

function Stat({ label, value, icon, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-surface-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          colorClass === 'stat-card-primary' ? 'bg-brand-100 text-brand-600' :
          colorClass === 'stat-card-danger' ? 'bg-danger-100 text-danger-600' :
          'bg-success-100 text-success-600'
        }`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ExportButtons() {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [exporting, setExporting] = useState(null);

  const download = async (path, filename, type) => {
    setExporting(type);
    try {
      const blob = await apiFetchBlob(path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => download('/analytics/export/csv', 'parcels.csv', 'csv')} 
        disabled={exporting === 'csv'}
        className="btn-secondary btn-sm"
      >
        {exporting === 'csv' ? <span className="spinner"></span> : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        CSV
      </button>
      <button 
        onClick={() => download('/analytics/export/pdf', 'parcels.pdf', 'pdf')} 
        disabled={exporting === 'pdf'}
        className="btn-secondary btn-sm"
      >
        {exporting === 'pdf' ? <span className="spinner"></span> : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        PDF
      </button>
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

function RoleBadge({ role }) {
  const roleClasses = {
    'admin': 'bg-brand-100 text-brand-700 border-brand-200',
    'agent': 'bg-info-100 text-info-700 border-info-200',
    'customer': 'bg-surface-100 text-surface-700 border-surface-200'
  };

  return (
    <span className={`badge ${roleClasses[role] || roleClasses.customer}`}>
      {role}
    </span>
  );
}

function AssignmentCell({ parcel, agents, onAssigned, onSuccess }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [agentId, setAgentId] = useState(parcel.agent?._id || parcel.agent || '');
  const [saving, setSaving] = useState(false);

  const isAssigned = Boolean(parcel.agent);
  const lockAssignment = !['Pending', 'Assigned'].includes(parcel.status);
  
  const save = async () => {
    if (!agentId || lockAssignment) return;
    setSaving(true);
    try {
      const updated = await apiFetch(`/parcels/${parcel._id}/assign`, { method: 'POST', body: JSON.stringify({ agentId }) });
      onAssigned(updated);
      // Get agent name for success message
      const assignedAgent = agents.find(a => a._id === agentId);
      if (onSuccess && assignedAgent) {
        onSuccess(`Agent "${assignedAgent.name}" has been assigned to parcel #${parcel.trackingCode}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select 
        className="select text-xs py-1.5 min-w-[120px]" 
        disabled={lockAssignment} 
        value={agentId} 
        onChange={e => setAgentId(e.target.value)}
      >
        <option value="">{t.selectAgent}</option>
        {agents.map(a => (
          <option key={a._id} value={a._id}>{a.name}</option>
        ))}
      </select>
      <button 
        onClick={save} 
        disabled={lockAssignment || saving} 
        className="btn-primary btn-sm"
      >
        {saving ? <span className="spinner"></span> : (isAssigned ? t.reassign : t.assign)}
      </button>
      <Link 
        to={`/admin/parcel/${parcel._id}`} 
        className="btn-secondary btn-sm"
      >
        {t.view}
      </Link>
    </div>
  );
}

export default function AdminPanel() {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    Promise.all([
      apiFetch('/analytics/dashboard').then(setMetrics).catch(() => {}),
      apiFetch('/users').then(setUsers).catch(() => {}),
      apiFetch('/parcels').then(setParcels).catch(() => {}),
      apiFetch('/assignments/agents').then(setAgents).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  // Socket.IO real-time updates
  useEffect(() => {
    const socket = createSocket('admin-dashboard');
    
    console.log('Admin dashboard socket setup');
    
    // Listen for new parcels being created
    const handleParcelCreated = (newParcel) => {
      console.log('Admin received new parcel:', newParcel);
      setParcels(prevParcels => [newParcel, ...prevParcels]);
      
      // Refresh metrics when new parcel is created
      apiFetch('/analytics/dashboard').then(setMetrics).catch(() => {});
    };
    
    socket.on('parcel:created', handleParcelCreated);
    
    // Listen for parcel updates
    const handleParcelUpdate = (data) => {
      console.log('Admin received parcel update:', data);
      setParcels(prevParcels => 
        prevParcels.map(p => 
          p._id === data.id ? { ...p, status: data.status, agent: data.agent || p.agent } : p
        )
      );
      
      // Refresh metrics when parcel status changes
      apiFetch('/analytics/dashboard').then(setMetrics).catch(() => {});
    };
    
    socket.on('parcel:update', handleParcelUpdate);
    
    // Listen for location updates
    const handleLocationUpdate = (data) => {
      console.log('Admin received location update:', data);
      setParcels(prevParcels =>
        prevParcels.map(p =>
          p._id === data.id || p._id === data.parcelId
            ? { ...p, currentLocation: data.location, etaMinutes: data.etaMinutes }
            : p
        )
      );
    };
    
    socket.on('parcel:location', handleLocationUpdate);
    
    return () => {
      socket.off('parcel:created', handleParcelCreated);
      socket.off('parcel:update', handleParcelUpdate);
      socket.off('parcel:location', handleLocationUpdate);
      socket.disconnect();
    };
  }, []);

  const filteredParcels = useMemo(() => {
    if (!search) return parcels;
    const q = search.toLowerCase();
    return parcels.filter(p => (p.trackingCode || '').toLowerCase().includes(q) || (p.status || '').toLowerCase().includes(q));
  }, [parcels, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="spinner w-8 h-8 text-brand-600"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg shadow-emerald-500/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-2 text-emerald-500 hover:text-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Stat 
          label={t.dailyBookings} 
          value={metrics?.dailyBookings ?? '—'} 
          colorClass="stat-card-primary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <Stat 
          label={t.failedDeliveries} 
          value={metrics?.failedDeliveries ?? '—'} 
          colorClass="stat-card-danger"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Stat 
          label={t.codCollected} 
          value={metrics?.codAmount != null ? `৳${metrics.codAmount.toLocaleString()}` : '—'} 
          colorClass="stat-card-success"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Users Panel */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t.users}
            </h3>
            <span className="badge bg-surface-100 text-surface-600 border-surface-200">
              {users.length} total
            </span>
          </div>
          <div className="max-h-96 overflow-auto no-scrollbar">
            <div className="space-y-3">
              {users.map(u => (
                <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-semibold">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-surface-900 truncate">{u.name}</p>
                    <p className="text-sm text-surface-500 truncate">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parcels Panel */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {t.bookings}
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  placeholder={t.searchByTrackingOrStatus} 
                  className="input pl-10 w-64" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              <ExportButtons />
            </div>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.tracking}</th>
                  <th>{t.customer}</th>
                  <th>{t.status}</th>
                  <th>{t.payment}</th>
                  <th>{t.agent}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredParcels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-surface-500">
                      No parcels found
                    </td>
                  </tr>
                ) : (
                  filteredParcels.map(p => (
                    <tr key={p._id}>
                      <td>
                        <span className="font-mono font-semibold text-brand-600">{p.trackingCode}</span>
                      </td>
                      <td>{p.customer?.name || '—'}</td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <span className={p.paymentType === 'COD' ? 'text-warning-600 font-medium' : ''}>
                          {p.paymentType}
                          {p.paymentType === 'COD' && <span className="text-surface-500 ml-1">(৳{p.codAmount})</span>}
                        </span>
                      </td>
                      <td>{agents.find(a => a._id === (p.agent?._id || p.agent))?.name || '—'}</td>
                      <td>
                        <AssignmentCell 
                          parcel={p} 
                          agents={agents} 
                          onAssigned={(updated) => {
                            setParcels(list => list.map(x => x._id === updated._id ? updated : x));
                          }}
                          onSuccess={(message) => setSuccessMessage(message)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
