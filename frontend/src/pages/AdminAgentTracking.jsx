import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';
import { createSocket } from '../socket';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createAgentIcon } from '../utils/mapIcons';

// Fix default marker icons in bundlers like Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function AdminAgentTracking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);
  
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agentLocation, setAgentLocation] = useState(null);
  const [agentSpeed, setAgentSpeed] = useState(null);
  const [previousAgentLocation, setPreviousAgentLocation] = useState(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState(null);
  const [agentParcels, setAgentParcels] = useState([]);
  const [parcelsLoading, setParcelsLoading] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapError, setMapError] = useState('');
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  
  // Filtered parcels based on filters
  const filteredParcels = agentParcels.filter(parcel => {
    // Status filter
    if (filterStatus !== 'all' && parcel.status !== filterStatus) {
      return false;
    }
    
    // Search filter (tracking code, pickup address, delivery address)
    if (filterSearch.trim()) {
      const searchLower = filterSearch.toLowerCase();
      const matchesTracking = parcel.trackingCode?.toLowerCase().includes(searchLower);
      const matchesPickup = parcel.pickupAddress?.toLowerCase().includes(searchLower);
      const matchesDelivery = parcel.deliveryAddress?.toLowerCase().includes(searchLower);
      const matchesType = parcel.parcelType?.toLowerCase().includes(searchLower);
      
      if (!matchesTracking && !matchesPickup && !matchesDelivery && !matchesType) {
        return false;
      }
    }
    
    return true;
  });

  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const mapElRef = useRef(null);
  const agentMarkerRef = useRef(null);

  // Calculate distance between two points using Haversine formula
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

  // Calculate agent speed based on location changes
  const calculateAgentSpeed = useCallback((currentLoc, previousLoc, timeDiff) => {
    if (!previousLoc || !currentLoc || timeDiff <= 0) return null;
    
    const distance = calculateDistance(
      [previousLoc.lat, previousLoc.lng],
      [currentLoc.lat, currentLoc.lng]
    );
    
    const timeInHours = timeDiff / (1000 * 60 * 60);
    const speed = distance / timeInHours;
    
    return speed > 0 && speed <= 120 ? speed : null;
  }, [calculateDistance]);

  // Function to update agent marker on map
  const updateAgentMarkerOnMap = useCallback((location) => {
    if (!mapRef.current || !mapInitialized) {
      return;
    }

    if (!location || !location.lat || !location.lng) {
      return;
    }

    const map = mapRef.current;
    const locationArray = [location.lat, location.lng];

    try {
      const bikeIcon = createAgentIcon(36);

      if (!agentMarkerRef.current) {
        agentMarkerRef.current = L.marker(locationArray, { icon: bikeIcon }).addTo(map);
        if (selectedAgent) {
          agentMarkerRef.current.bindPopup(`
            <div class="text-center">
              <div class="font-semibold">🚚 ${selectedAgent.name}</div>
              <div class="text-sm text-gray-600">Delivery Agent</div>
              <div class="text-xs text-gray-500">Last updated: ${new Date(location.updatedAt).toLocaleTimeString()}</div>
              <div class="text-xs text-gray-500">Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</div>
            </div>
          `);
        }
      } else {
        agentMarkerRef.current.setLatLng(locationArray);
        
        // Update popup content with new timestamp
        if (selectedAgent) {
          agentMarkerRef.current.bindPopup(`
            <div class="text-center">
              <div class="font-semibold">🚚 ${selectedAgent.name}</div>
              <div class="text-sm text-gray-600">Delivery Agent</div>
              <div class="text-xs text-gray-500">Last updated: ${new Date(location.updatedAt).toLocaleTimeString()}</div>
              <div class="text-xs text-gray-500">Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</div>
            </div>
          `);
        }
      }

      // Ensure the agent location is visible on the map
      const bounds = map.getBounds();
      if (!bounds.contains(locationArray)) {
        map.panTo(locationArray, { animate: true });
      }
    } catch (err) {
      console.error('Error updating agent marker:', err);
    }
  }, [selectedAgent, mapInitialized]);

  // Initialize map with proper error handling
  const initializeMap = useCallback(() => {
    if (!mapElRef.current || mapRef.current) {
      return;
    }

    // Check if the container is properly rendered and has dimensions
    const container = mapElRef.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      setTimeout(() => initializeMap(), 200);
      return;
    }

    try {
      const defaultCenter = [23.78, 90.41]; // Default to Dhaka, Bangladesh
      const map = L.map(container).setView(defaultCenter, 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      setMapInitialized(true);
      setMapError('');
      
      // If we have agent location data, add it to the map immediately
      if (agentLocation && agentLocation.lat && agentLocation.lng) {
        updateAgentMarkerOnMap(agentLocation);
      }
      
    } catch (err) {
      console.error('Map initialization failed:', err);
      setMapError('Failed to initialize map: ' + err.message);
      
      // Try to recover by attempting again after a delay
      setTimeout(() => {
        if (!mapRef.current && mapElRef.current) {
          initializeMap();
        }
      }, 1000);
    }
  }, [agentLocation, updateAgentMarkerOnMap]);

  // Load agents
  useEffect(() => {
    setLoading(true);
    api.get('/users?role=agent')
      .then(res => {
        setAgents(res.data);
        if (res.data.length > 0) {
          setSelectedAgent(res.data[0]);
        }
      })
      .catch(() => setError('Failed to load agents'))
      .finally(() => setLoading(false));
  }, []);

  // Load agent parcels when agent changes
  useEffect(() => {
    if (!selectedAgent) return;
    
    setParcelsLoading(true);
    setAgentLocation(null);
    setAgentSpeed(null);
    setPreviousAgentLocation(null);
    setLastLocationUpdate(null);
    setFilterStatus('all');
    setFilterSearch('');
    
    api.get(`/parcels?agent=${selectedAgent._id}`)
      .then(res => {
        setAgentParcels(res.data);
      })
      .catch(() => setError('Failed to load agent parcels'))
      .finally(() => setParcelsLoading(false));
  }, [selectedAgent]);

  // Initialize socket for real-time tracking
  useEffect(() => {
    if (!selectedAgent) return;
    
    const socketUserId = `admin:${user?._id || user?.id}:${Date.now()}`;
    const s = createSocket(socketUserId);
    socketRef.current = s;

    // Request agent's current location immediately
    s.emit('request:agent:location', { agentId: selectedAgent._id });

    const handleAgentLocationUpdate = (data) => {
      if (data.agentId === selectedAgent._id) {
        const newLocation = {
          lat: data.location.lat,
          lng: data.location.lng,
          updatedAt: data.timestamp
        };
        
        // Calculate speed if we have previous location
        if (agentLocation && lastLocationUpdate) {
          const timeDiff = new Date(data.timestamp).getTime() - lastLocationUpdate.getTime();
          const speed = calculateAgentSpeed(newLocation, agentLocation, timeDiff);
          if (speed !== null) {
            setAgentSpeed(speed);
          }
        }
        
        setPreviousAgentLocation(agentLocation);
        setAgentLocation(newLocation);
        setLastLocationUpdate(new Date(data.timestamp));
        
        // Update map marker if map is ready
        if (mapRef.current && mapInitialized) {
          updateAgentMarkerOnMap(newLocation);
        }
      }
    };

    s.on('agent:location:update', handleAgentLocationUpdate);

    return () => {
      s.off('agent:location:update', handleAgentLocationUpdate);
      s.disconnect();
    };
  }, [selectedAgent, user, agentLocation, lastLocationUpdate, calculateAgentSpeed, mapInitialized, updateAgentMarkerOnMap]);

  // Initialize map when component mounts
  useEffect(() => {
    // Wait for the component to be fully rendered
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);
    
    // Also try with requestAnimationFrame for better timing
    const rafId = requestAnimationFrame(() => {
      if (!mapRef.current && mapElRef.current) {
        initializeMap();
      }
    });
    
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [initializeMap]);

  // Monitor map container element and retry initialization if needed
  useEffect(() => {
    const checkAndInitialize = () => {
      if (mapElRef.current && !mapRef.current) {
        initializeMap();
      }
    };

    // Check immediately
    checkAndInitialize();
    
    // Check again after a short delay
    const timer = setTimeout(checkAndInitialize, 100);
    
    // Use ResizeObserver to detect when container is properly sized
    let resizeObserver = null;
    if (mapElRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0 && !mapRef.current) {
            initializeMap();
          }
        }
      });
      resizeObserver.observe(mapElRef.current);
    }
    
    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [initializeMap]);

  // Update agent marker when location changes (fallback for initial load)
  useEffect(() => {
    if (!agentLocation?.lat || !agentLocation?.lng || !mapRef.current || !mapInitialized) return;
    
    // Use the dedicated function to update the marker
    updateAgentMarkerOnMap(agentLocation);
  }, [agentLocation, mapInitialized, updateAgentMarkerOnMap]);

  // Fallback map initialization with multiple attempts
  useEffect(() => {
    const timers = [];
    
    // Multiple fallback attempts at different intervals
    [500, 1000, 2000].forEach(delay => {
      const timer = setTimeout(() => {
        if (mapElRef.current && !mapRef.current) {
          console.log(`Fallback map initialization attempt at ${delay}ms`);
          initializeMap();
        }
      }, delay);
      timers.push(timer);
    });
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [initializeMap]);

  // Cleanup function
  useEffect(() => {
    return () => {
      try {
        if (agentMarkerRef.current && mapRef.current) {
          mapRef.current.removeLayer(agentMarkerRef.current);
        }
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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
          <p className="text-surface-600 font-medium">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30">
      {/* Professional Navbar */}
      <header className="navbar sticky top-0 z-[9999]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-surface-900">{t.agentTracking}</h1>
                  <p className="text-xs text-surface-500">{t.realTimeTrackingOfDeliveryAgents}</p>
                </div>
              </div>
            </div>
            {/* Connection Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                socketRef.current?.connected 
                  ? 'bg-success-50 text-success-700 border border-success-200' 
                  : 'bg-surface-100 text-surface-600 border border-surface-200'
              }`}>
                <span className={`status-dot ${socketRef.current?.connected ? 'status-dot-success' : 'status-dot-offline'}`}></span>
                {socketRef.current?.connected ? 'Live Updates' : 'Connecting...'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="alert-danger mb-6">
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Agent Selection and Details */}
          <div className="space-y-6">
            {/* Agent Selection Card */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-surface-900">{t.selectAgent}</h3>
                    <p className="text-sm text-surface-500">{t.chooseAgentToTrack}</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <select 
                  value={selectedAgent?._id || ''} 
                  onChange={(e) => {
                    const agent = agents.find(a => a._id === e.target.value);
                    setSelectedAgent(agent);
                  }}
                  className="select"
                >
                  {agents.map(agent => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Agent Information Card */}
            {selectedAgent && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-surface-900">{t.agentInfo}</h3>
                </div>
                <div className="card-body">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
                        <span className="text-3xl">🚚</span>
                      </div>
                      {agentLocation && (
                        <span className="absolute bottom-3 right-0 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-success-500 border-2 border-white"></span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-surface-900 text-lg">{selectedAgent.name}</h4>
                    <p className="text-sm text-surface-500">{selectedAgent.email}</p>
                    {agentLocation ? (
                      <div className="mt-4 p-3 bg-success-50 rounded-xl border border-success-200">
                        <div className="flex items-center justify-center gap-2">
                          <span className="status-dot status-dot-success"></span>
                          <span className="text-sm font-medium text-success-700">{t.online}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-surface-100 rounded-xl border border-surface-200">
                        <div className="flex items-center justify-center gap-2">
                          <span className="status-dot status-dot-offline"></span>
                          <span className="text-sm font-medium text-surface-600">Offline</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Agent Live Metrics Card */}
            {selectedAgent && agentLocation && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-100 text-info-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900">{t.liveMetrics}</h3>
                  </div>
                </div>
                <div className="card-body space-y-4">
                  {agentSpeed !== null && (
                    <div className="p-4 bg-gradient-to-br from-warning-50 to-warning-100 rounded-xl border border-warning-200">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-500 text-white shadow-lg shadow-warning-500/25">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-warning-600 uppercase tracking-wide">{t.currentSpeed}</p>
                          <p className="text-2xl font-bold text-warning-900">{agentSpeed.toFixed(1)} <span className="text-sm font-normal">km/h</span></p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4 bg-gradient-to-br from-info-50 to-info-100 rounded-xl border border-info-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info-500 text-white shadow-lg shadow-info-500/25">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-info-600 uppercase tracking-wide">{t.lastUpdate}</p>
                        <p className="text-lg font-bold text-info-900">
                          {agentLocation.updatedAt ? new Date(agentLocation.updatedAt).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-500 text-white shadow-lg shadow-success-500/25">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-success-600 uppercase tracking-wide">{t.coordinates}</p>
                        <p className="text-sm font-bold text-success-900 font-mono">
                          {agentLocation.lat.toFixed(6)}, {agentLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Agent Parcels List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parcels Assigned to Agent */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-surface-900">Parcels Assigned to Agent</h2>
                      <p className="text-sm text-surface-500">
                        {selectedAgent ? `Showing parcels for ${selectedAgent.name}` : 'Select an agent to view parcels'}
                      </p>
                    </div>
                  </div>
                  <span className="badge-info text-sm">
                    {filteredParcels.length} of {agentParcels.length}
                  </span>
                </div>
              </div>
              
              {/* Filter Section */}
              {agentParcels.length > 0 && (
                <div className="px-6 py-4 bg-surface-50 border-b border-surface-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-2 uppercase tracking-wide">Filter by Status</label>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="select text-sm"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Picked Up">Picked Up</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                    
                    {/* Search Filter */}
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-2 uppercase tracking-wide">Search Parcels</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          placeholder="Tracking code, address, type..."
                          className="input text-sm pl-9"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clear Filters */}
                  {(filterStatus !== 'all' || filterSearch.trim()) && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-surface-600">
                        {filteredParcels.length === 0 ? (
                          <span className="text-warning-600">No parcels match the current filters</span>
                        ) : (
                          <span>Showing {filteredParcels.length} of {agentParcels.length} parcels</span>
                        )}
                      </p>
                      <button
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterSearch('');
                        }}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="card-body p-0">
                {!selectedAgent ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
                      <span className="text-3xl">📦</span>
                    </div>
                    <p className="text-surface-600 font-medium">Please select an agent to view their assigned parcels</p>
                  </div>
                ) : parcelsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
                      <svg className="h-6 w-6 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <p className="text-surface-600 font-medium">Loading parcels...</p>
                  </div>
                ) : agentParcels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
                      <span className="text-3xl">📭</span>
                    </div>
                    <h4 className="text-lg font-medium text-surface-900">No parcels assigned</h4>
                    <p className="text-surface-500">This agent doesn't have any parcels yet.</p>
                  </div>
                ) : filteredParcels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h4 className="text-lg font-medium text-surface-900">No matching parcels</h4>
                    <p className="text-surface-500">Try adjusting your filters to see more results.</p>
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterSearch('');
                      }}
                      className="mt-4 btn-primary text-sm"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-100">
                    {filteredParcels.map(parcel => (
                      <div key={parcel._id} className="p-5 hover:bg-surface-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-mono font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg text-sm">#{parcel.trackingCode}</span>
                              <span className={`badge-${
                                parcel.status === 'Delivered' ? 'success' :
                                parcel.status === 'In Transit' ? 'info' :
                                parcel.status === 'Failed' ? 'danger' :
                                parcel.status === 'Picked Up' ? 'warning' :
                                'default'
                              }`}>
                                {parcel.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-start gap-2">
                                <svg className="h-4 w-4 text-surface-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <div>
                                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">Pickup</span>
                                  <p className="text-surface-700">{parcel.pickupAddress}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <svg className="h-4 w-4 text-surface-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <div>
                                  <span className="text-xs font-medium text-surface-500 uppercase tracking-wide">Delivery</span>
                                  <p className="text-surface-700">{parcel.deliveryAddress}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-surface-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                <span className="text-surface-600"><span className="font-medium">Size:</span> {parcel.parcelSize}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-surface-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-surface-600"><span className="font-medium">Type:</span> {parcel.parcelType}</span>
                              </div>
                            </div>
                            {parcel.notes && (
                              <div className="mt-3 p-2 bg-surface-50 rounded-lg border border-surface-200">
                                <p className="text-sm text-surface-600">
                                  <span className="font-medium">Notes:</span> {parcel.notes}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="text-right text-xs text-surface-500 flex-shrink-0">
                            <div className="space-y-1">
                              <div>Created: {new Date(parcel.createdAt).toLocaleDateString()}</div>
                              <div>Updated: {new Date(parcel.updatedAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Tracking Status */}
            {selectedAgent && (
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-100 text-info-600">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-surface-900">Live Tracking Status</h2>
                      <p className="text-sm text-surface-500">{selectedAgent.name}'s real-time location updates</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {agentLocation ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-info-50 to-info-100 rounded-xl border border-info-200">
                        <div className="flex items-center gap-3">
                          <span className="status-dot status-dot-info"></span>
                          <div>
                            <span className="text-sm font-semibold text-info-800">{t.liveTrackingActive}</span>
                            <p className="text-xs text-info-600 mt-0.5">
                              {t.agentLocationUpdated}: {new Date(agentLocation.updatedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200">
                          <label className="text-xs font-semibold text-success-600 uppercase tracking-wide">Latitude</label>
                          <p className="text-xl font-bold text-success-900 font-mono mt-1">{agentLocation.lat.toFixed(6)}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200">
                          <label className="text-xs font-semibold text-success-600 uppercase tracking-wide">Longitude</label>
                          <p className="text-xl font-bold text-success-900 font-mono mt-1">{agentLocation.lng.toFixed(6)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
                        <span className="text-3xl">📍</span>
                      </div>
                      <h4 className="text-lg font-medium text-surface-900">Waiting for location updates</h4>
                      <p className="text-surface-500 mt-1">Location will appear here when agent shares their position</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Agent Tracking Map */}
        {selectedAgent && (
          <div className="mt-8">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900">Live Agent Tracking Map</h2>
                    <p className="text-sm text-surface-500">Real-time location tracking of {selectedAgent.name} on the map</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="relative">
                  <div
                    ref={mapElRef}
                    className="h-96 w-full rounded-xl overflow-hidden border-2 border-surface-200 bg-surface-100"
                    style={{ minHeight: '384px' }}
                  />
                  {!mapInitialized && !mapError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-100 rounded-xl">
                      <div className="text-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 mb-3">
                          <svg className="h-6 w-6 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-surface-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                  {mapError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-100 rounded-xl">
                      <div className="text-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 mb-3">
                          <svg className="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-danger-600">{mapError}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {agentLocation && (
                  <div className="mt-6 space-y-4">
                    {/* Live Tracking Status */}
                    <div className="p-4 bg-gradient-to-r from-info-50 to-info-100 rounded-xl border border-info-200">
                      <div className="flex items-center gap-3">
                        <span className="status-dot status-dot-info"></span>
                        <div>
                          <span className="text-sm font-semibold text-info-800">Live Tracking Active</span>
                          <p className="text-xs text-info-600 mt-0.5">
                            Agent location updated: {new Date(agentLocation.updatedAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Agent Location Coordinates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200">
                        <label className="text-xs font-semibold text-success-600 uppercase tracking-wide">Latitude</label>
                        <p className="text-xl font-bold text-success-900 font-mono mt-1">{agentLocation.lat.toFixed(6)}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-xl border border-success-200">
                        <label className="text-xs font-semibold text-success-600 uppercase tracking-wide">Longitude</label>
                        <p className="text-xl font-bold text-success-900 font-mono mt-1">{agentLocation.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    
                    {/* Real-time Updates Info */}
                    <div className="p-4 bg-gradient-to-r from-brand-50 to-brand-100 rounded-xl border border-brand-200">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-brand-800">Real-time Updates Active</span>
                          <p className="text-xs text-brand-600 mt-0.5">
                            Agent location updates automatically via WebSocket connection
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* No Location Status */}
                {!agentLocation && (
                  <div className="mt-6">
                    <div className="p-6 bg-gradient-to-r from-warning-50 to-warning-100 rounded-xl border border-warning-200">
                      <div className="flex flex-col items-center text-center">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-warning-200 mb-3">
                          <span className="text-2xl">📍</span>
                        </div>
                        <h4 className="text-base font-semibold text-warning-800">Waiting for Agent Location</h4>
                        <p className="text-sm text-warning-600 mt-1">
                          Agent location will appear here when they share their position
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Debug Information for Development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-6 p-4 bg-surface-50 rounded-xl border border-surface-200">
                    <details className="text-xs">
                      <summary className="cursor-pointer font-semibold text-surface-700 hover:text-surface-900">🔧 Debug Info</summary>
                      <div className="mt-3 space-y-2 text-surface-600">
                        <div className="flex items-center gap-2">
                          <span className={mapInitialized ? 'text-success-600' : 'text-danger-600'}>{mapInitialized ? '✅' : '❌'}</span>
                          <span>Map Initialized</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={mapElRef.current ? 'text-success-600' : 'text-danger-600'}>{mapElRef.current ? '✅' : '❌'}</span>
                          <span>Map Element</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={mapRef.current ? 'text-success-600' : 'text-danger-600'}>{mapRef.current ? '✅' : '❌'}</span>
                          <span>Map Instance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={agentLocation ? 'text-success-600' : 'text-danger-600'}>{agentLocation ? '✅' : '❌'}</span>
                          <span>Agent Location</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={socketRef.current?.connected ? 'text-success-600' : 'text-danger-600'}>{socketRef.current?.connected ? '✅' : '❌'}</span>
                          <span>Socket Connected</span>
                        </div>
                        {mapError && <div className="text-danger-600">Error: {mapError}</div>}
                        {agentLocation && (
                          <div className="text-info-600">
                            Last Update: {new Date(agentLocation.updatedAt).toLocaleTimeString()}
                          </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-surface-200 flex flex-wrap gap-2">
                          <button 
                            onClick={() => {
                              console.log('Manual map initialization triggered');
                              if (mapElRef.current && !mapRef.current) {
                                initializeMap();
                              } else {
                                console.log('Map already exists or container not ready');
                              }
                            }}
                            className="btn-primary py-1.5 px-3 text-xs"
                          >
                            Init Map
                          </button>
                          <button 
                            onClick={() => {
                              console.log('Force map re-initialization');
                              if (mapRef.current) {
                                try {
                                  mapRef.current.remove();
                                  mapRef.current = null;
                                  setMapInitialized(false);
                                } catch (_) { }
                              }
                              setTimeout(() => initializeMap(), 100);
                            }}
                            className="btn-danger py-1.5 px-3 text-xs"
                          >
                            Reset Map
                          </button>
                          <button 
                            onClick={() => {
                              console.log('Test agent location update');
                              if (agentLocation) {
                                const testLocation = {
                                  ...agentLocation,
                                  updatedAt: new Date().toISOString()
                                };
                                setAgentLocation(testLocation);
                                updateAgentMarkerOnMap(testLocation);
                              }
                            }}
                            className="btn-success py-1.5 px-3 text-xs"
                            disabled={!agentLocation}
                          >
                            Test Update
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
