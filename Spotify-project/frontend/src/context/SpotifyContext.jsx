// frontend/src/context/SpotifyContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { getSpotifyProfile } from '../services/spotify';

const SpotifyContext = createContext();

export const SpotifyProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL for tokens on callback
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshTokenParam = urlParams.get('refresh_token');
    
    if (accessToken) {
      setToken(accessToken);
      setRefreshToken(refreshTokenParam);
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshTokenParam);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      fetchUserData(accessToken);
    } else {
      // Check localStorage
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedRefreshToken = localStorage.getItem('spotify_refresh_token');
      
      if (storedToken) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        fetchUserData(storedToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchUserData = async (accessToken) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token might be expired, try to refresh
        await refreshAccessToken();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken) {
        logout();
        return;
      }
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        localStorage.setItem('spotify_access_token', data.access_token);
        
        // Fetch user data with new token
        fetchUserData(data.access_token);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
    }
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  };

  return (
    <SpotifyContext.Provider value={{ 
      token, 
      user, 
      loading, 
      logout,
      isAuthenticated: !!token,
      refreshAccessToken
    }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => useContext(SpotifyContext);