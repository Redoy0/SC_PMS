import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { createSocket } from '../socket';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';

const STATUS_STEPS = ["Pending", "Assigned", "Picked Up", "In Transit", "Delivered", "Failed"];

export default function TrackParcel() {
  const { id } = useParams();
  const [parcel, setParcel] = useState(null);
  const [liveLoc, setLiveLoc] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  const tokenUserId = useMemo(() => {
    try { return JSON.parse(atob((localStorage.getItem('token')||'.').split('.')[1])).id; } catch { return undefined; }
  }, []);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '' });
  const socketRef = useRef(null);

  useEffect(() => {
    apiFetch(`/parcels/${id}`).then(setParcel).catch(()=>{});
  }, [id]);

  useEffect(() => {
    socketRef.current = createSocket(tokenUserId);
    socketRef.current.emit('subscribe:parcel', id);
    socketRef.current.on('parcel:location', (payload) => {
      if (payload.id === id) setLiveLoc(payload.currentLocation);
    });
    socketRef.current.on('parcel:update', (payload) => {
      if (payload.id === id) setParcel(prev => prev ? { ...prev, status: payload.status, agent: payload.agent ?? prev.agent } : prev);
    });
    return () => {
      socketRef.current.emit('unsubscribe:parcel', id);
      socketRef.current.disconnect();
    };
  }, [id, tokenUserId]);

  useEffect(() => {
    if (!isLoaded || !window.google || !parcel) return;
    const svc = new window.google.maps.DirectionsService();
    const origin = parcel.pickupAddress;
    const destination = parcel.deliveryAddress;

    if (liveLoc?.lat && liveLoc?.lng) {
      // live origin is agent
      svc.route({
        origin: { lat: liveLoc.lat, lng: liveLoc.lng },
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
  }, [isLoaded, parcel, liveLoc]);

  if (!parcel) return null;

  const currentIdx = STATUS_STEPS.indexOf(parcel.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900">Tracking #{parcel.trackingCode}</h1>
              <p className="text-surface-500">Real-time parcel tracking</p>
            </div>
          </div>
        </div>

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
                <h3 className="text-lg font-semibold text-surface-900">Delivery Progress</h3>
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
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={{ lat: liveLoc?.lat || 23.78, lng: liveLoc?.lng || 90.41 }} zoom={11}>
                    {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
                    {liveLoc && <Marker position={{ lat: liveLoc.lat, lng: liveLoc.lng }} title="Courier Location" />}
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
                  <span className="text-sm font-semibold text-surface-900">
                    {parcel.paymentType}{parcel.paymentType === 'COD' ? ` (BDT ${parcel.codAmount})` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
