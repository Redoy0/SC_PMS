import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch, api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import { createSocket } from '../socket';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createAgentIcon } from '../utils/mapIcons';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

// AGENT_STATUSES will be defined inside the component where translations are available

function Navbar({ onLogout, user, isConnected }) {
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
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-info-100 text-info-700 rounded-full">Agent</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${isConnected ? 'bg-success-50' : 'bg-danger-50'}`}>
            <div className={`status-dot ${isConnected ? 'status-dot-online' : 'status-dot-offline'}`}></div>
            <span className={`text-xs font-medium ${isConnected ? 'text-success-700' : 'text-danger-700'}`}>
              {isConnected ? t.connected : t.disconnected}
            </span>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-100 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-info-500 to-info-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="text-sm">
              <div className="font-medium text-surface-900">{user?.name}</div>
              <div className="text-xs text-surface-500 capitalize">{user?.role}</div>
            </div>
          </div>
          
          <LanguageSwitcher />
          
          {user?.role === 'agent' && (
            <Link 
              to="/agent/pickup-scan" 
              className="btn-success btn-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="hidden sm:inline">Pickup Scan</span>
            </Link>
          )}
          
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

function LiveMap({ agentPosition }) {
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const agentMarkerRef = useRef(null);

  const ensureMap = useCallback((center = [23.78, 90.41], zoom = 12) => {
    if (!mapRef.current && mapElRef.current) {
      mapRef.current = L.map(mapElRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }
    return mapRef.current;
  }, []);

  useEffect(() => {
    if (!agentPosition) return;
    const map = ensureMap(agentPosition, 13);
    if (!map) return;
    const icon = createAgentIcon(48);
    
    if (!agentMarkerRef.current) {
      agentMarkerRef.current = L.marker(agentPosition, { icon }).addTo(map);
      map.setView(agentPosition, 14, { animate: true });
    } else {
      agentMarkerRef.current.setLatLng(agentPosition);
      const bounds = map.getBounds();
      if (!bounds.contains(agentPosition)) map.panTo(agentPosition);
    }
  }, [agentPosition, ensureMap]);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-info-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-surface-900">{t.liveMap}</h3>
          <p className="text-sm text-surface-500">Your current location</p>
        </div>
      </div>
      <div className="relative h-80 w-full overflow-hidden rounded-xl border border-surface-200">
        <div ref={mapElRef} className="h-full w-full" />
        {!agentPosition && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-50 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info-100">
              <svg className="h-7 w-7 text-info-500 animate-pulse-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-surface-700">Waiting for location access</p>
              <p className="text-sm text-surface-500">Allow location permission in your browser to appear on the map</p>
            </div>
          </div>
        )}
      </div>
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

export default function AgentDashboard() {
  const { user, logout } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const [parcels, setParcels] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [agentPosition, setAgentPosition] = useState(null);
  const geoWatchIdRef = useRef(null);
  const lastLocationUpdateRef = useRef(null);
  const lastLocationRef = useRef(null);
  const [otpModal, setOtpModal] = useState({ open: false, parcelId: null, step: 'request', code: '', sending: false, error: '' });

  // Create user-specific socket
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      const userSocket = createSocket(userId);
      
      // Set up connection status listeners
      const handleConnect = () => {
        setIsConnected(true);
      };
      
      const handleDisconnect = () => {
        setIsConnected(false);
      };
      
      userSocket.on('connect', handleConnect);
      userSocket.on('disconnect', handleDisconnect);
      
      // Check if socket is already connected
      if (userSocket.connected) {
        setIsConnected(true);
      }
      
      setSocket(userSocket);
      
      return () => {
        userSocket.off('connect', handleConnect);
        userSocket.off('disconnect', handleDisconnect);
        userSocket.disconnect();
      };
    }
  }, [user?._id, user?.id]);

  // Start live geolocation watch for agent position
  useEffect(() => {
    if (!navigator.geolocation || !socket) {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
      }
      return;
    }
    
    const userId = user?._id || user?.id;
    
    // Helper to calculate distance between two points (in meters)
    const getDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    const onSuccess = (pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const now = Date.now();
      
      // Check if enough time has passed (throttle to 10 seconds)
      const timeSinceLastUpdate = lastLocationUpdateRef.current 
        ? now - lastLocationUpdateRef.current 
        : Infinity;
      
      // Check if location changed significantly (more than 10 meters)
      const locationChanged = !lastLocationRef.current || 
        getDistance(
          lastLocationRef.current.lat, 
          lastLocationRef.current.lng,
          location.lat, 
          location.lng
        ) > 10;
      
      // Only update if 10+ seconds passed OR location changed significantly
      if (timeSinceLastUpdate > 10000 || locationChanged) {
        setAgentPosition([location.lat, location.lng]);
        
        // Emit general live location for admin tracking
        socket?.emit('agent:location:update', { 
          agentId: userId, 
          location, 
          timestamp: new Date().toISOString() 
        });
        
        // Update location for all in-transit parcels (only if changed)
        const inTransit = parcels.filter(p => p.status === 'In Transit');
        if (inTransit.length > 0) {
          inTransit.forEach(p => {
            apiFetch(`/parcels/${p._id}/location`, { 
              method: 'POST', 
              body: JSON.stringify(location) 
            }).catch(() => {});
          });
        }
        
        // Update refs
        lastLocationUpdateRef.current = now;
        lastLocationRef.current = location;
      }
    };
    
    const onError = (error) => {
      console.error('Geolocation error:', error.message);
    };
    
    // Listen for location requests from admin
    const handleLocationRequest = (data) => {
      if (data.agentId === userId) {
        // Admin is requesting our location, send it immediately
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      }
    };
    
    socket.on('request:agent:location', handleLocationRequest);
    
    // Get initial position immediately
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    
    // Start watching position continuously
    try {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        onSuccess, 
        onError, 
        { 
          enableHighAccuracy: true, 
          maximumAge: 5000, // Increased from 2000 to 5000ms
          timeout: 10000 
        }
      );
    } catch (err) {
      console.error('Error starting geolocation watch:', err);
    }
    
    return () => {
      socket?.off('request:agent:location', handleLocationRequest);
      if (geoWatchIdRef.current != null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, [parcels, socket, user?._id, user?.id]);

  // OTP flow handlers
  const requestDeliveryOtp = useCallback(async (parcelId) => {
    setOtpModal({ open: true, parcelId, step: 'request', code: '', sending: true, error: '' });
    try {
      await apiFetch(`/parcels/${parcelId}/request-delivery-otp`, { method: 'POST' });
      setOtpModal({ open: true, parcelId, step: 'confirm', code: '', sending: false, error: '' });
    } catch (e) {
      setOtpModal({ open: true, parcelId, step: 'request', code: '', sending: false, error: e?.message || 'Failed to send OTP' });
    }
  }, []);

  const confirmDeliveryOtp = useCallback(async () => {
    const { parcelId, code } = otpModal;
    if (!parcelId || !code) return;
    setOtpModal(m => ({ ...m, sending: true, error: '' }));
    try {
      const updated = await apiFetch(`/parcels/${parcelId}/confirm-delivery-otp`, { method: 'POST', body: JSON.stringify({ code }) });
      setParcels(list => list.map(x => x._id === updated._id ? updated : x));
      setOtpModal({ open: false, parcelId: null, step: 'request', code: '', sending: false, error: '' });
    } catch (e) {
      setOtpModal(m => ({ ...m, sending: false, error: e?.message || 'Invalid OTP' }));
    }
  }, [otpModal]);

  useEffect(() => {
    apiFetch('/parcels').then(setParcels).catch(()=>{});
  }, []);

  // Socket.IO event listeners for parcel updates
  useEffect(() => {
    if (!socket) return;
    
    // Listen for parcel updates from other sources
    const handleParcelUpdate = (updatedParcel) => {
      setParcels(list => list.map(x => x._id === updatedParcel.id ? { ...x, ...updatedParcel } : x));
    };
    
    socket.on('parcel:update', handleParcelUpdate);
    
    // Listen for location updates from other sources
    const handleLocationUpdate = (data) => {
      if (data.parcelId) {
        setParcels(list => list.map(x => 
          x._id === data.parcelId ? { ...x, currentLocation: data.location } : x
        ));
      }
    };
    
    socket.on('parcel:location', handleLocationUpdate);
    
    return () => {
      socket.off('parcel:update', handleParcelUpdate);
      socket.off('parcel:location', handleLocationUpdate);
    };
  }, [socket]);

  return (
    <>
      <Navbar user={user} onLogout={logout} isConnected={isConnected} />
      <main className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-surface-900">{t.agentDashboard}</h1>
                <p className="text-surface-500">Manage your assigned deliveries and track your progress</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card">
              <div className="stat-icon bg-brand-100 text-brand-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-value">{parcels.length}</p>
                <p className="stat-label">Total Assigned</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-info-100 text-info-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-value">{parcels.filter(p => p.status === 'In Transit').length}</p>
                <p className="stat-label">In Transit</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-success-100 text-success-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-value">{parcels.filter(p => p.status === 'Delivered').length}</p>
                <p className="stat-label">Delivered</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-warning-100 text-warning-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-content">
                <p className="stat-value">{parcels.filter(p => p.status === 'Pending' || p.status === 'Picked Up').length}</p>
                <p className="stat-label">Pending</p>
              </div>
            </div>
          </div>

          {/* Assigned Parcels Table */}
          <div className="card mb-8">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900">{t.assignedParcels}</h3>
                  <p className="text-sm text-surface-500">View and manage your deliveries</p>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {parcels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
                    <svg className="h-8 w-8 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-surface-900">No parcels assigned</h4>
                  <p className="text-surface-500">You don't have any parcels assigned yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t.tracking}</th>
                        <th>{t.pickup}</th>
                        <th>{t.delivery}</th>
                        <th>{t.status}</th>
                        <th>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcels.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <span className="font-mono font-semibold text-brand-600">{p.trackingCode}</span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-surface-600">{p.pickupAddress}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                              <span className="text-surface-600">{p.deliveryAddress}</span>
                            </div>
                          </td>
                          <td>
                            <StatusBadge status={p.status} />
                          </td>
                          <td>
                            <Link 
                              to={`/parcel/${p._id}`}
                              className="btn-primary py-1.5 px-3 text-xs"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {t.view}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Live Map */}
          <LiveMap agentPosition={agentPosition} />
        </div>
      </main>

      {/* OTP Modal */}
      {otpModal.open && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-surface-900">{t.confirmDelivery}</h4>
                  <p className="text-sm text-surface-500">Verify delivery with OTP</p>
                </div>
              </div>
              <button 
                onClick={() => setOtpModal({ open: false, parcelId: null, step: 'request', code: '', sending: false, error: '' })}
                className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {otpModal.step === 'request' ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
                    <div className="flex gap-3">
                      <svg className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-brand-700">{t.sendOtpMessage}</p>
                    </div>
                  </div>
                  {otpModal.error && (
                    <div className="alert-danger">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {otpModal.error}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-success-50 border border-success-100 p-4">
                    <div className="flex gap-3">
                      <svg className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-success-700">{t.enterOtpMessage}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">Enter OTP Code</label>
                    <input 
                      maxLength={6} 
                      value={otpModal.code} 
                      onChange={e => setOtpModal(m => ({ ...m, code: e.target.value }))} 
                      className="input text-center text-2xl tracking-[0.5em] font-mono" 
                      placeholder="000000" 
                    />
                  </div>
                  {otpModal.error && (
                    <div className="alert-danger">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {otpModal.error}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setOtpModal({ open: false, parcelId: null, step: 'request', code: '', sending: false, error: '' })}
              >
                {t.cancel}
              </button>
              {otpModal.step === 'request' ? (
                <button 
                  disabled={otpModal.sending} 
                  className="btn-primary" 
                  onClick={() => requestDeliveryOtp(otpModal.parcelId)}
                >
                  {otpModal.sending ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t.sendOtp}
                    </>
                  )}
                </button>
              ) : (
                <button 
                  disabled={otpModal.sending || !otpModal.code} 
                  className="btn-success" 
                  onClick={confirmDeliveryOtp}
                >
                  {otpModal.sending ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.confirm}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
