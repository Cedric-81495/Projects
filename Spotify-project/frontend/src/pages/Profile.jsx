// src/pages/Profile.jsx
import { useSpotify } from '../context/SpotifyContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTopArtists, getTopTracks, getPlaylists } from '../services/spotify';

const Profile = () => {
  const { isAuthenticated, user } = useSpotify();
  const [isLoaded, setIsLoaded] = useState(false);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const fetchData = async () => {
      try {
        const [artists, tracks, playlistsData] = await Promise.all([
          getTopArtists(token),
          getTopTracks(token),
          getPlaylists(token),
        ]);
        setTopArtists(artists.items);
        setTopTracks(tracks.items);
        setPlaylists(playlistsData.items);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to fetch Spotify data:', err.message);
      }
    };

    fetchData();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 text-spotify-green mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-gray-400 mb-8">Please connect your Spotify account to view your profile.</p>
          <a 
            href={`${import.meta.env.VITE_API_URL || '/api'}/auth/login`}
            className="spotify-btn spotify-btn-primary"
          >
            Connect with Spotify
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-black to-spotify-gray">
      {/* Profile Header */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-spotify-green/30 to-transparent opacity-50"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {user && (
              <>
                <div className="w-40 h-40 rounded-full border-4 border-spotify-black overflow-hidden shadow-xl">
                  {user.images && user.images[0] ? (
                    <img 
                      src={user.images[0].url} 
                      alt={user.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-spotify-light flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">
                        {user.display_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300 uppercase tracking-wider">Profile</p>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mt-1">{user.display_name}</h1>
                  <div className="mt-4 flex items-center text-gray-400">
                    <span className="font-medium">{user.followers?.total || 0} Followers</span>
                    {user.country && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{user.country}</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Top Artists Section */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`mb-6 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Top Artists</h2>
              <Link to="/top-artists" className="text-gray-400 hover:text-white text-sm font-medium">
                See all
              </Link>
            </div>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {topArtists.map((artist) => (
              <div key={artist.id} className="bg-spotify-light p-4 rounded-lg hover:bg-gray-700 transition-all duration-200 group cursor-pointer">
                <div className="aspect-square rounded-full overflow-hidden shadow-lg mb-4">
                  <img src={artist.images?.[0]?.url} alt={artist.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white font-medium truncate">{artist.name}</h3>
                <p className="text-gray-400 text-sm">Artist</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Tracks Section */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`mb-6 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Top Tracks</h2>
              <Link to="/top-tracks" className="text-gray-400 hover:text-white text-sm font-medium">
                See all
              </Link>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="bg-spotify-light bg-opacity-30 rounded-md overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 px-4 py-2 border-b border-gray-700 text-gray-400 text-sm">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Title</div>
                <div className="col-span-4">Album</div>
                <div className="col-span-2 text-right">Duration</div>
              </div>

              {/* Track items */}
              {topTracks.map((track, index) => (
                <div key={track.id} className="grid grid-cols-12 px-4 py-3 hover:bg-white hover:bg-opacity-10 group transition-colors items-center text-gray-400 text-sm">
                  <div className="col-span-1 flex items-center">
                    <span className="group-hover:hidden">{index + 1}</span>
                    <svg className="w-4 h-4 text-white hidden group-hover:block" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="col-span-5 flex items-center">
                    <img src={track.album.images?.[0]?.url} alt={track.name} className="w-10 h-10 mr-3" />
                    <div>
                      <div className="text-white font-medium">{track.name}</div>
                      <div className="text-xs">{track.artists.map((a) => a.name).join(', ')}</div>
                    </div>
                  </div>
                  <div className="col-span-4">{track.album.name}</div>
                  <div className="col-span-2 text-right">
                    {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Playlists Section */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`mb-6 transition-all duration-1000 delay-900 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
              <Link to="/playlists" className="text-gray-400 hover:text-white text-sm font-medium">
                See all
              </Link>
            </div>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {playlists.map((playlist) => (
              <div key={playlist.id} className="bg-spotify-light p-4 rounded-lg hover:bg-gray-700 transition-all duration-200 group cursor-pointer">
                <div className="aspect-square mb-4 relative overflow-hidden shadow-lg">
                  <img src={playlist.images?.[0]?.url} alt={playlist.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <svg className="w-12 h-12 text-spotify-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <h3 className="text-white font-medium truncate">{playlist.name}</h3>
                <p className="text-gray-400 text-sm truncate">By {playlist.owner?.display_name} • {playlist.tracks.total} songs</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
