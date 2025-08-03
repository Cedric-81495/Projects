// frontend/src/services/spotify.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Utility function to call API with token
const fetchWithToken = async (endpoint, token, params = {}) => {
  const url = new URL(`${API_BASE_URL}/${endpoint}`);

  // Append query params if any
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch data');
  }

  return res.json();
};

export const getSpotifyProfile = (token) => {
  return fetchWithToken('profile', token);
};

export const getTopArtists = (token, timeRange = 'medium_term', limit = 10) => {
  return fetchWithToken('top-artists', token, { time_range: timeRange, limit });
};

export const getTopTracks = (token, timeRange = 'medium_term', limit = 10) => {
  return fetchWithToken('top-tracks', token, { time_range: timeRange, limit });
};

export const getPlaylists = (token, limit = 20) => {
  return fetchWithToken('playlists', token, { limit });
};
