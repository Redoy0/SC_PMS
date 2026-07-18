import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import { createSocket } from '../socket';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createAgentIcon } from '../utils/mapIcons';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

const PARCEL_STATUSES = ["Pending", "Assigned", "Picked Up", "In Transit", "Delivered", "Failed"];

const StatusIcon = ({ status }) => {
  const icons = {
    'Pending': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'Assigned': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    'Picked Up': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    'In Transit': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    'Delivered': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    'Failed': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };
  return icons[status] || icons['Pending'];
};

const getStatusColor = (status) => {
  const colors = {
    'Pending': 'from-amber-500 to-orange-500',
    'Assigned': 'from-blue-500 to-indigo-500',
    'Picked Up': 'from-purple-500 to-violet-500',
    'In Transit': 'from-cyan-500 to-blue-500',
    'Delivered': 'from-emerald-500 to-green-500',
    'Failed': 'from-red-500 to-rose-500',
  };
  return colors[status] || 'from-gray-500 to-slate-500';
};

const getStatusBgColor = (status) => {
  const colors = {
    'Pending': 'bg-amber-50 border-amber-200 text-amber-700',
    'Assigned': 'bg-blue-50 border-blue-200 text-blue-700',
    'Picked Up': 'bg-purple-50 border-purple-200 text-purple-700',
    'In Transit': 'bg-cyan-50 border-cyan-200 text-cyan-700',
    'Delivered': 'bg-emerald-50 border-emerald-200 text-emerald-700',
    'Failed': 'bg-red-50 border-red-200 text-red-700',
  };
  return colors[status] || 'bg-gray-50 border-gray-200 text-gray-700';
};

export default function ParcelDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  const agentId = user?.id ?? user?._id;
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [sendingLocation, setSendingLocation] = useState(false);
  const [agentLocation, setAgentLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [distanceToPickup, setDistanceToPickup] = useState(null);
  const [etaToDelivery, setEtaToDelivery] = useState(null);

  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const routingRef = useRef(null);
  const agentMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const socketRef = useRef(null);

  const ensureMap = useCallback((center = [23.78, 90.41], zoom = 12) => {
    if (!mapRef.current && mapElRef.current) {
      mapRef.current = L.map(mapElRef.current).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }
    return mapRef.current;
  }, []);

  const geocodeAddress = useCallback(async (query) => {
    try {
      // Add Bangladesh context to improve results
      const searchQuery = query.toLowerCase().includes('bangladesh') ? query : `${query}, Bangladesh`;
      const { data } = await api.get('/geocode/search', { 
        params: { 
          q: searchQuery, 
          limit: 1,
          countrycodes: 'bd'
        } 
      });
      if (!Array.isArray(data) || data.length === 0) throw new Error('Address not found');
      const { lat, lon } = data[0];
      return [parseFloat(lat), parseFloat(lon)];
    } catch (err) {
      throw new Error('Failed to geocode address');
    }
  }, []);

  // Load parcel data
  useEffect(() => {
    setLoading(true);
    api.get(`/parcels/${id}`).then(res => {
      setParcel(res.data);
      setStatus(res.data.status);
    }).catch(() => setError(t.failedToLoadParcel)).finally(() => setLoading(false));
  }, [id, t.failedToLoadParcel]);

  // Initialize socket
  useEffect(() => {
    if (agentId) {
      socketRef.current = createSocket(agentId);
      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [agentId]);

  // Create route and calculate distances
  useEffect(() => {
    if (!parcel) return;
    
    const createRoute = async () => {
      try {
        const pickup = await geocodeAddress(parcel.pickupAddress);
        const delivery = await geocodeAddress(parcel.deliveryAddress);
        setRouteData({ pickup, delivery });
        
        // Calculate distance from agent to pickup if agent location available
        if (agentLocation) {
          const distance = calculateDistance(agentLocation, pickup);
          setDistanceToPickup(distance);
        }
        
        // Calculate ETA to delivery
        const totalDistance = calculateDistance(pickup, delivery);
        const avgSpeed = 30; // km/h average delivery speed
        const etaHours = totalDistance / avgSpeed;
        setEtaToDelivery(Math.round(etaHours * 60)); // Convert to minutes
      } catch (err) {
        console.error('Route creation failed:', err);
      }
    };
    
    createRoute();
  }, [parcel, agentLocation, geocodeAddress]);

  // Initialize map and create route
  useEffect(() => {
    if (!routeData || !mapElRef.current) return;
    
    const map = ensureMap(routeData.pickup, 12);
    if (!map) return;

    // Add pickup and delivery markers
    const pickupIcon = L.divIcon({ html: '📍', className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
    const deliveryIcon = L.divIcon({ html: '🎯', className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
    
    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = L.marker(routeData.pickup, { icon: pickupIcon }).addTo(map);
    }
    if (!deliveryMarkerRef.current) {
      deliveryMarkerRef.current = L.marker(routeData.delivery, { icon: deliveryIcon }).addTo(map);
    }

    // Create routing
    if (!routingRef.current) {
      routingRef.current = L.Routing.control({
        waypoints: [L.latLng(routeData.pickup[0], routeData.pickup[1]), L.latLng(routeData.delivery[0], routeData.delivery[1])],
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
      }).addTo(map);
    }
  }, [routeData, ensureMap]);

  // Update agent marker when location changes
  useEffect(() => {
    if (!agentLocation || !mapRef.current) return;
    const map = mapRef.current;

    const bikeIcon = createAgentIcon(32);
    if (!agentMarkerRef.current) {
      agentMarkerRef.current = L.marker(agentLocation, { icon: bikeIcon }).addTo(map);
    } else {
      agentMarkerRef.current.setLatLng(agentLocation);
    }
  }, [agentLocation]);

  const calculateDistance = useCallback((point1, point2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const updateStatus = useCallback(async () => {
    if (!status || status === parcel?.status) return;
    setUpdatingStatus(true);
    try {
      const updated = await apiFetch(`/parcels/${parcel._id}/status`, { 
        method: 'POST', 
        body: JSON.stringify({ status }) 
      });
      setParcel(updated);
    } catch (err) {
      setError(t.failedToUpdateStatus);
    } finally {
      setUpdatingStatus(false);
    }
  }, [status, parcel, t.failedToUpdateStatus]);

  const sendCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation || !parcel?._id || sendingLocation) return;
    setSendingLocation(true);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setAgentLocation([location.lat, location.lng]);
      
      try {
        // Update parcel location
        await apiFetch(`/parcels/${parcel._id}/location`, { 
          method: 'POST', 
          body: JSON.stringify(location) 
        });
        
        // Emit socket event (guard if no agentId)
        if (agentId) {
          socketRef.current?.emit('agent:location:update', {
            agentId,
            location,
            timestamp: new Date().toISOString()
          });
        }
        
        // Recalculate distance to pickup
        if (routeData?.pickup) {
          const distance = calculateDistance([location.lat, location.lng], routeData.pickup);
          setDistanceToPickup(distance);
        }
        setSendingLocation(false);
      } catch (err) {
        setError(t.failedToSendLocation);
        setSendingLocation(false);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      setError(t.failedToGetCurrentLocation);
      setSendingLocation(false);
    });
  }, [parcel?._id, agentId, routeData?.pickup, calculateDistance, t.failedToSendLocation, t.failedToGetCurrentLocation, sendingLocation]);

  // Set up interval to send location every 20 seconds
  useEffect(() => {
    if (!parcel?._id) return;
    
    // Send initial location
    sendCurrentLocation();
    
    // Set up interval for subsequent updates
    const intervalId = setInterval(() => {
      sendCurrentLocation();
    }, 20000); // 20 seconds
    
    return () => clearInterval(intervalId);
  }, [parcel?._id]); // Remove sendCurrentLocation from dependencies to prevent restart loop

  const sendCustomLocation = useCallback(async () => {
    if (!locationInput.trim() || !parcel?._id) return;
    setSendingLocation(true);
    
    try {
      const coords = await geocodeAddress(locationInput.trim());
      setAgentLocation(coords);
      
      // Update parcel location
      await apiFetch(`/parcels/${parcel._id}/location`, { 
        method: 'POST', 
        body: JSON.stringify({ lat: coords[0], lng: coords[1] }) 
      });
      
      // Emit socket event (guard if no agentId)
      if (agentId) {
        socketRef.current?.emit('agent:location:update', {
          agentId,
          location: { lat: coords[0], lng: coords[1] },
          timestamp: new Date().toISOString()
        });
      }
      
      // Recalculate distance to pickup
      if (routeData?.pickup) {
        const distance = calculateDistance(coords, routeData.pickup);
        setDistanceToPickup(distance);
      }
      
      setLocationInput('');
    } catch (err) {
      setError(t.invalidLocationAddress);
    } finally {
      setSendingLocation(false);
    }
  }, [locationInput, parcel?._id, agentId, routeData, geocodeAddress, calculateDistance, t.invalidLocationAddress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 mb-4">
            <svg className="h-8 w-8 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-surface-600 font-medium">{t.loadingParcelDetails}</p>
        </div>
      </div>
    );
  }

  if (error && !parcel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-danger-100 mb-4">
            <svg className="h-10 w-10 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-surface-900 mb-2">Error Loading Parcel</h2>
          <p className="text-danger-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/agent')}
            className="btn-primary"
          >
            {t.backToAgent}
          </button>
        </div>
      </div>
    );
  }

  if (!parcel) return null;

  const currentStatusIndex = PARCEL_STATUSES.indexOf(parcel.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Professional Header with Glass Effect */}
      <header className="sticky top-0 z-[9999] backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/agent')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${getStatusColor(parcel.status)} text-white shadow-lg`}>
                  <StatusIcon status={parcel.status} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">{t.parcelDetails}</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">#{parcel.trackingCode}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getStatusColor(parcel.status)} animate-pulse`}></div>
                <span className="text-sm font-medium text-slate-700">{parcel.status}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Status Timeline Progress Bar */}
        <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Delivery Progress</h3>
            <span className="text-xs text-slate-500">{Math.round((currentStatusIndex / (PARCEL_STATUSES.length - 1)) * 100)}% Complete</span>
          </div>
          <div className="relative">
            {/* Progress Bar Background */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getStatusColor(parcel.status)} transition-all duration-700 ease-out rounded-full`}
                style={{ width: `${(currentStatusIndex / (PARCEL_STATUSES.length - 1)) * 100}%` }}
              ></div>
            </div>
            {/* Status Steps */}
            <div className="flex justify-between mt-4">
              {PARCEL_STATUSES.filter(s => s !== 'Failed').map((s, idx) => {
                const isActive = idx <= currentStatusIndex && parcel.status !== 'Failed';
                const isCurrent = s === parcel.status;
                return (
                  <div key={s} className="flex flex-col items-center" style={{ width: '20%' }}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCurrent 
                        ? `bg-gradient-to-br ${getStatusColor(s)} text-white shadow-lg ring-4 ring-offset-2 ring-${s === 'Delivered' ? 'emerald' : 'blue'}-100`
                        : isActive 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isActive && !isCurrent ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium text-center ${isCurrent ? 'text-slate-900' : isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Update Section */}
        <div className="mb-8 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Update Parcel Status</h3>
                <p className="text-slate-400 text-sm">Change the current delivery status</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm appearance-none cursor-pointer"
                style={{ minWidth: '160px' }}
              >
                {PARCEL_STATUSES.map(s => (
                  <option key={s} value={s} className="text-slate-900">{s}</option>
                ))}
              </select>
              <button 
                onClick={updateStatus}
                disabled={updatingStatus || status === parcel.status}
                className="px-6 py-2.5 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {updatingStatus ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t.updating}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parcel Information Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{t.parcelInformation}</h2>
                    <p className="text-sm text-slate-500">Complete shipment details</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* Tracking & Status Row */}
                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t.trackingCode}</label>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 font-mono tracking-wide">{parcel.trackingCode}</p>
                  </div>
                  <div className={`p-5 rounded-2xl border ${getStatusBgColor(parcel.status)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <StatusIcon status={parcel.status} />
                      <label className="text-xs font-bold uppercase tracking-wider">{t.status}</label>
                    </div>
                    <p className="text-2xl font-bold">{parcel.status}</p>
                  </div>
                </div>

                {/* Addresses */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:border-emerald-200 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white flex-shrink-0 shadow-lg shadow-emerald-500/25">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">📍 {t.pickupAddress}</span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Origin</span>
                      </div>
                      <p className="text-slate-900 font-semibold text-lg">{parcel.pickupAddress}</p>
                    </div>
                  </div>
                  
                  {/* Arrow Connector */}
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Delivering to</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-100 hover:border-rose-200 transition-colors">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500 text-white flex-shrink-0 shadow-lg shadow-rose-500/25">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">🎯 {t.deliveryAddress}</span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">Destination</span>
                      </div>
                      <p className="text-slate-900 font-semibold text-lg">{parcel.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Parcel Details Grid */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.parcelSize}</label>
                    </div>
                    <p className="text-slate-900 font-bold text-lg">{parcel.parcelSize}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.parcelType}</label>
                    </div>
                    <p className="text-slate-900 font-bold text-lg">{parcel.parcelType}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.paymentType}</label>
                    </div>
                    <p className="text-slate-900 font-bold text-lg">{parcel.paymentType}</p>
                  </div>
                </div>

                {/* COD Amount if applicable */}
                {parcel.paymentType === 'COD' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Cash on Delivery</p>
                          <p className="text-sm text-amber-700">Collect from recipient</p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-amber-900">৳{parcel.codAmount}</p>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {parcel.notes && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.notes}</label>
                    </div>
                    <p className="text-slate-700">{parcel.notes}</p>
                  </div>
                )}

                {/* Created Date */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Created</span>
                  <span className="font-medium text-slate-700">{new Date(parcel.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Route Map Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{t.deliveryRoute}</h2>
                      <p className="text-sm text-slate-500">{t.interactiveMapPickupDelivery}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600">Pickup</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                      <span className="text-slate-600">Delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏍️</span>
                      <span className="text-slate-600">Agent</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div
                  ref={mapElRef}
                  className="h-[420px] w-full bg-slate-100"
                  style={{ minHeight: '420px' }}
                />
                {/* Map Overlay Gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Location Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t.agentLocation}</h3>
                    <p className="text-xs text-slate-500">{t.updateCurrentLocation}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* GPS Location Button */}
                <button 
                  onClick={sendCurrentLocation}
                  disabled={sendingLocation}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                >
                  {sendingLocation ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t.sending}</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{t.useMyCurrentLocation}</span>
                    </>
                  )}
                </button>
                
                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                {/* Custom Location Input */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t.searchLocation}
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-slate-700 placeholder-slate-400"
                    />
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <button 
                    onClick={sendCustomLocation}
                    disabled={sendingLocation || !locationInput.trim()}
                    className="w-full py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {t.sendCustomLocation}
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Metrics Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t.deliveryMetrics}</h3>
                    <p className="text-xs text-slate-500">{t.realTimeDeliveryCalculations}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {distanceToPickup !== null && (
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1">{t.distanceToPickup}</p>
                        <p className="text-3xl font-bold text-cyan-900">{distanceToPickup.toFixed(1)}<span className="text-lg font-normal ml-1">km</span></p>
                      </div>
                      <div className="p-3 bg-cyan-100 rounded-xl">
                        <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                {etaToDelivery !== null && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">{t.etaToDelivery}</p>
                        <p className="text-3xl font-bold text-emerald-900">{etaToDelivery}<span className="text-lg font-normal ml-1">min</span></p>
                      </div>
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <p className="text-2xl mb-1">📦</p>
                    <p className="text-xs text-slate-500">{t.parcelSize}</p>
                    <p className="text-sm font-bold text-slate-900">{parcel.parcelSize}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-center">
                    <p className="text-2xl mb-1">🏷️</p>
                    <p className="text-xs text-slate-500">{t.parcelType}</p>
                    <p className="text-sm font-bold text-slate-900">{parcel.parcelType}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info Card */}
            {parcel.customer && (
              <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{t.customerInformation}</h3>
                      <p className="text-xs text-slate-500">{t.contactDetailsForRecipient}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-center mb-4">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-violet-500/30">
                        <span className="text-4xl">👤</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-slate-900">{parcel.customer.name}</h4>
                    <p className="text-sm text-slate-500 mb-4">{parcel.customer.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={`mailto:${parcel.customer.email}`}
                      className="flex-1 py-2.5 px-4 bg-violet-100 text-violet-700 font-medium rounded-xl hover:bg-violet-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm shadow-slate-200/50 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{t.quickActions}</h3>
                    <p className="text-xs text-slate-500">{t.commonTasksAndShortcuts}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full py-3 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {t.printDetails}
                </button>
                <button
                  onClick={() => navigate('/agent')}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {t.backToAgent}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
