import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getTranslations } from '../translations';

export default function AgentPickupConfirmPage() {
  const { id } = useParams();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = getTranslations(currentLanguage);

  useEffect(() => {
    loadParcel();
  }, [id]);

  const loadParcel = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch(`/parcels/${id}`);
      setParcel(data);
    } catch (err) {
      setError(err.message || 'Failed to load parcel details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!parcel) return;
    
    setProcessing(true);
    setError('');
    
    try {
      await apiFetch(`/parcels/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: 'Picked Up' })
      });
      
      // Navigate to parcel details page after successful update
      navigate(`/parcel/${id}`);
    } catch (err) {
      const message = err.message || 'Failed to update status to Picked Up';
      if (message.includes('Forbidden')) {
        setError('You cannot pick up this parcel. It may not be assigned to you yet. Please contact your admin to assign this parcel to you first.');
      } else {
        setError(message);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading parcel details...</p>
        </div>
      </div>
    );
  }

  if (error && !parcel) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Pickup Confirmation</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Parcel</h3>
            <p className="text-red-700">{error}</p>
            <button onClick={() => navigate('/agent')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!parcel) return null;

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Assigned': 'bg-blue-100 text-blue-800 border-blue-200',
    'Picked Up': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'In Transit': 'bg-purple-100 text-purple-800 border-purple-200',
    'Delivered': 'bg-green-100 text-green-800 border-green-200',
    'Failed': 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Confirm Pickup</h1>
                <p className="text-gray-600">Review and confirm parcel pickup</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Success Check Icon */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parcel Scanned Successfully</h2>
          <p className="text-gray-600">Please review the details and confirm pickup</p>
        </div>

        {/* Parcel Details Card */}
        <div className="bg-white rounded-xl border shadow-sm mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Parcel Details</h3>
                <p className="text-sm text-gray-600">Tracking Code: <span className="font-mono font-semibold text-blue-600">{parcel.trackingCode}</span></p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[parcel.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {parcel.status}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{parcel.customer?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{parcel.customer?.email || ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Agent Info */}
            {parcel.agent && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Assigned Agent</h4>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{parcel.agent?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{parcel.agent?.email || ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!parcel.agent && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 mb-1">No Agent Assigned</p>
                    <p className="text-sm text-yellow-700">This parcel has not been assigned to any agent yet. You won't be able to confirm pickup until an admin assigns it to you.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Addresses */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Pickup Address</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <p className="text-sm text-gray-700">{parcel.pickupAddress}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery Address</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <p className="text-sm text-gray-700">{parcel.deliveryAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parcel Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Size</p>
                <p className="font-semibold text-gray-900">{parcel.parcelSize}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Type</p>
                <p className="font-semibold text-gray-900">{parcel.parcelType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Payment</p>
                <p className="font-semibold text-gray-900">{parcel.paymentType}</p>
              </div>
              {parcel.paymentType === 'COD' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-yellow-700 mb-1">COD Amount</p>
                  <p className="font-semibold text-yellow-900">৳{parcel.codAmount || 0}</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {parcel.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{parcel.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/agent')}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPickup}
            disabled={processing || parcel.status === 'Picked Up' || !parcel.agent}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Confirming...</span>
              </>
            ) : parcel.status === 'Picked Up' ? (
              'Already Picked Up'
            ) : !parcel.agent ? (
              'Not Assigned'
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirm Pickup</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
