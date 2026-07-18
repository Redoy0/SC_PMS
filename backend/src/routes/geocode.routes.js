import express from 'express';

const router = express.Router();

// Helper function to geocode using Photon API (OpenStreetMap based, no rate limits)
async function geocodeWithPhoton(query, limit) {
	const url = new URL('https://photon.komoot.io/api/');
	url.searchParams.set('q', query);
	url.searchParams.set('limit', String(limit));
	url.searchParams.set('lang', 'en');
	// Bias results towards Bangladesh (center of BD)
	url.searchParams.set('lat', '23.8');
	url.searchParams.set('lon', '90.4');

	const response = await fetch(url.toString(), {
		headers: { 'Accept': 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`Photon API error: ${response.status}`);
	}

	const data = await response.json();
	// Convert Photon format to Nominatim format
	return (data.features || []).map(f => ({
		lat: String(f.geometry?.coordinates?.[1] || 0),
		lon: String(f.geometry?.coordinates?.[0] || 0),
		display_name: f.properties?.name || query,
		name: f.properties?.name || query
	}));
}

// Helper function to geocode using Nominatim
async function geocodeWithNominatim(query, limit) {
	const url = new URL('https://nominatim.openstreetmap.org/search');
	url.searchParams.set('format', 'json');
	url.searchParams.set('q', query);
	url.searchParams.set('limit', String(limit));
	url.searchParams.set('countrycodes', 'bd');

	const response = await fetch(url.toString(), {
		headers: {
			'User-Agent': 'CourierParcelManagementSystem/1.0 (https://github.com/courier-app; courier-app@example.com)',
			'Accept': 'application/json',
			'Accept-Language': 'en'
		}
	});

	if (!response.ok) {
		throw new Error(`Nominatim error: ${response.status}`);
	}

	return await response.json();
}

router.get('/search', async (req, res) => {
	try {
		const query = (req.query.q || '').toString().trim();
		const limit = Number(req.query.limit || 1);
		if (!query) {
			return res.status(400).json({ message: 'Missing q parameter' });
		}

		// Append Bangladesh to improve geocoding results for local addresses
		const enhancedQuery = query.toLowerCase().includes('bangladesh') 
			? query 
			: `${query}, Bangladesh`;

		let data = [];

		// Try Photon first (more reliable, no strict rate limits)
		try {
			data = await geocodeWithPhoton(enhancedQuery, limit);
		} catch (photonErr) {
			console.log('Photon failed, trying Nominatim:', photonErr.message);
		}

		// Fallback to Nominatim if Photon fails or returns no results
		if (data.length === 0) {
			try {
				data = await geocodeWithNominatim(enhancedQuery, limit);
			} catch (nominatimErr) {
				console.log('Nominatim also failed:', nominatimErr.message);
			}
		}

		return res.json(data);
	} catch (err) {
		console.error('Geocoding error:', err);
		return res.status(500).json({ message: 'Geocoding failed' });
	}
});

export default router;


