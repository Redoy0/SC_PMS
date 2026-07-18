import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';
import { socket } from '../socket';
import { api } from '../api';

const STATUS_STEPS = ["Pending", "Assigned", "Picked Up", "In Transit", "Delivered", "Failed"];

export default function PublicTrack() {
  const { trackingCode } = useParams();
  const [parcel, setParcel] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '' });

  useEffect(() => {
    api.get(`/parcels/track/${trackingCode}`)
      .then(res => {
        const data = res.data;
        if (data.message) setError(data.message); else setParcel(data);
      })
      .catch(() => setError('Failed to load parcel'))
      .finally(() => setLoading(false));
  }, [trackingCode]);
 
  useEffect(() => {
    if (!parcel) return; 
    socket.emit('subscribe:parcel', parcel._id); 
    const handleParcelUpdate = (updatedParcel) => {
      if (updatedParcel.id === parcel._id) {
        setParcel(prev => ({ ...prev, ...updatedParcel }));
      }
    };
 
    const handleLocationUpdate = (data) => {
      if (data.id === parcel._id) {
        setParcel(prev => ({ 
          ...prev, 
          currentLocation: data.currentLocation, 
          etaMinutes: data.etaMinutes 
        }));
      }
    };
 
    const handleAgentLocationUpdate = (data) => {
      if (parcel.agent && data.agentId === parcel.agent._id) {
        setParcel(prev => ({ 
          ...prev, 
          currentLocation: { ...data.location, updatedAt: data.timestamp } 
        }));
      }
    };

    socket.on('parcel:update', handleParcelUpdate);
    socket.on('parcel:location', handleLocationUpdate);
    socket.on('agent:location:update', handleAgentLocationUpdate);

    return () => {
      socket.emit('unsubscribe:parcel', parcel._id);
      socket.off('parcel:update', handleParcelUpdate);
      socket.off('parcel:location', handleLocationUpdate);
      socket.off('agent:location:update', handleAgentLocationUpdate);
    };
  }, [parcel]);

  useEffect(() => {
    if (!isLoaded || !window.google || !parcel) return;
    const svc = new window.google.maps.DirectionsService();
    const origin = parcel.pickupAddress;
    const destination = parcel.deliveryAddress;

    if (parcel.currentLocation?.lat && parcel.currentLocation?.lng) {
      // live origin is agent
      svc.route({
        origin: { lat: parcel.currentLocation.lat, lng: parcel.currentLocation.lng },
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (res, status) => {
        if (status === 'OK') {
          setDirections(res);
          const leg = res.routes[0].legs[0];
          setDistance(leg.distance?.text || null);
          setDuration(leg.duration?.text || null);
        }
      });
    } else {
      svc.route({ origin, destination, travelMode: window.google.maps.TravelMode.DRIVING }, (res, status) => {
        if (status === 'OK') {
          setDirections(res);
          const leg = res.routes[0].legs[0];
          setDistance(leg.distance?.text || null);
          setDuration(leg.duration?.text || null);
        }
      });
    }
  }, [isLoaded, parcel]);

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
          <p className="text-surface-600 font-medium">Loading parcel information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-danger-100 mb-4">
            <svg className="h-10 w-10 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 mb-2">Parcel Not Found</h1>
          <p className="text-surface-600 mb-4">{error}</p>
          <p className="text-sm text-surface-400 font-mono bg-surface-100 px-3 py-1.5 rounded-lg inline-block">Tracking Code: {trackingCode}</p>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(parcel.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30">
      {/* Navbar */}
      <header className="navbar">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-surface-900">Smart Courier Management System</span>
                <p className="text-xs text-surface-500">Public Parcel Tracking Portal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Status Progress Card */}
        <div className="card mb-8">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900">Tracking #{parcel.trackingCode}</h3>
                  <p className="text-sm text-surface-500">Lifecycle Progress and Status Trace</p>
                </div>
              </div>
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
          </div>
          <div className="card-body">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-surface-200">
                <div 
                  className="absolute h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500"
                  style={{ width: `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {/* Steps */}
              <ol className="relative flex items-center justify-between">
                {STATUS_STEPS.map((s, i) => (
                  <li key={s} className="flex flex-col items-center">
                    <div className={`relative z-10 grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-all duration-300 ${
                      i <= currentIdx 
                        ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30' 
                        : 'bg-surface-200 text-surface-500'
                    }`}>
                      {i < currentIdx ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${i <= currentIdx ? 'text-brand-600' : 'text-surface-500'}`}>
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map Card */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-surface-900">Live Location</h4>
                  <p className="text-sm text-surface-500">Track your parcel in real-time</p>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="h-[500px] w-full overflow-hidden rounded-b-2xl">
                {isLoaded && (
                  <GoogleMap 
                    mapContainerStyle={{ width: '100%', height: '100%' }} 
                    center={{ lat: parcel.currentLocation?.lat || 23.78, lng: parcel.currentLocation?.lng || 90.41 }} 
                    zoom={11}
                  >
                    {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
                    {parcel.currentLocation && (
                      <Marker 
                        position={{ lat: parcel.currentLocation.lat, lng: parcel.currentLocation.lng }} 
                        title="Courier Location" 
                      />
                    )}
                  </GoogleMap>
                )}
              </div>
            </div>
          </div>

          {/* Trip Details Card */}
          <div className="card h-fit">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-100 text-info-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-surface-900">Trip Details</h4>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-100 text-success-600 flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">Pickup</p>
                  <p className="text-surface-900 font-medium">{parcel.pickupAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-100 text-danger-600 flex-shrink-0">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">Delivery</p>
                  <p className="text-surface-900 font-medium">{parcel.deliveryAddress}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500">Distance</span>
                  <span className="text-sm font-semibold text-surface-900">{distance ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500">ETA</span>
                  <span className="text-sm font-semibold text-surface-900">{parcel.etaMinutes ? `${parcel.etaMinutes} min` : (duration ?? '—')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-500">Payment</span>
                  <span className="text-sm font-semibold text-surface-900">{parcel.paymentType}{parcel.paymentType === 'COD' ? ` (BDT ${parcel.codAmount})` : ''}</span>
                </div>
                {parcel.agent && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500">Agent</span>
                    <span className="text-sm font-semibold text-surface-900">{parcel.agent.name}</span>
                  </div>
                )}
                {parcel.currentLocation && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-500">Last Update</span>
                    <span className="text-sm font-semibold text-surface-900">{new Date(parcel.currentLocation.updatedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Live Location Information */}
              {parcel.currentLocation && (
                <div className="mt-4 p-4 bg-gradient-to-r from-success-50 to-success-100 rounded-xl border border-success-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="status-dot status-dot-success"></span>
                    <span className="text-sm font-semibold text-success-800">Live Tracking Active</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-success-700">
                    <div className="flex justify-between">
                      <span>Latitude:</span>
                      <span className="font-mono font-medium">{parcel.currentLocation.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Longitude:</span>
                      <span className="font-mono font-medium">{parcel.currentLocation.lng.toFixed(6)}</span>
                    </div>
                    <div className="pt-2 text-success-600 font-medium text-center">
                      Real-time updates enabled ✓
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
