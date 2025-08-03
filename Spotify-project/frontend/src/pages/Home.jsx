// src/pages/Home.jsx
import { useSpotify } from '../context/SpotifyContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Home = () => {
  const { isAuthenticated } = useSpotify();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-spotify-black to-spotify-gray">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-spotify-green/20 to-transparent opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Welcome to My <span className="text-spotify-green">Spotify</span> Project
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300 leading-relaxed">
              Explore my music taste, discover analytics about my listening habits, and see how I've integrated the Spotify API with modern web technologies.
            </p>
            
            <div className="mt-10">
              {!isAuthenticated ? (
                <a 
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`}
                  className="spotify-btn spotify-btn-primary flex items-center justify-center mx-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 496 512">
                    <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5z"/>
                  </svg>
                  Connect with Spotify
                </a>
              ) : (
                <Link 
                  to="/profile"
                  className="spotify-btn spotify-btn-primary flex items-center justify-center mx-auto"
                >
                  View Your Profile
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements - Spotify-inspired circles */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-spotify-green opacity-10"></div>
        <div className="absolute top-20 -right-20 w-40 h-40 rounded-full bg-spotify-green opacity-10"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl font-bold text-white">Features</h2>
            <div className="mt-2 w-16 h-1 bg-spotify-green mx-auto rounded-full"></div>
            <p className="mt-4 text-xl text-gray-400">Discover what you can do with this Project</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Music Analytics" 
              description="Discover insights about your listening habits and preferences with detailed charts and statistics."
              icon={
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
              }
              delay="100"
              isLoaded={isLoaded}
            />
            
            <FeatureCard 
              title="Playlist Showcase" 
              description="Display your curated playlists and favorite tracks. Share your music taste with others."
              icon={
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
                </svg>
              }
              delay="200"
              isLoaded={isLoaded}
            />
            
            <FeatureCard 
              title="Artist Insights" 
              description="See your top artists and explore their connections. Discover new music based on your preferences."
              icon={
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                </svg>
              }
              delay="300"
              isLoaded={isLoaded}
            />
          </div>
        </div>
      </section>
      
      {/* Recent Tracks Section - Spotify-like UI */}
      <section className="py-16 bg-spotify-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`mb-8 transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl font-bold text-white">Recently Played</h2>
            <div className="mt-2 w-16 h-1 bg-spotify-green rounded-full"></div>
            <p className="mt-4 text-gray-400">Connect with Spotify to see your recently played tracks</p>
          </div>
          
          {!isAuthenticated ? (
            <div className="bg-spotify-light rounded-lg p-8 text-center">
              <p className="text-gray-300 mb-4">Connect your Spotify account to see your recently played tracks</p>
              <a 
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`}
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-full shadow-sm text-black bg-spotify-green hover:bg-opacity-80"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 496 512">
                  <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5z"/>
                </svg>
                Connect Now
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Placeholder track items with Spotify styling */}
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div 
                  key={item} 
                  className="bg-spotify-light hover:bg-gray-700 rounded-md p-4 flex items-center transition-all duration-200 group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-gray-600 rounded flex-shrink-0 relative group-hover:shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-spotify-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-grow">
                    <h4 className="text-white font-medium truncate">Track Title {item}</h4>
                    <p className="text-gray-400 text-sm truncate">Artist Name</p>
                  </div>
                  <div className="text-gray-400 text-sm">3:45</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* How It Works Section - With Spotify-like steps */}
      <section className="py-16 bg-gradient-to-b from-spotify-gray to-spotify-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 delay-900 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl font-bold text-white">How It Works</h2>
            <div className="mt-2 w-16 h-1 bg-spotify-green mx-auto rounded-full"></div>
            <p className="mt-4 text-xl text-gray-400">Simple steps to get started</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              title="Connect Your Account"
              description="Link your Spotify account to enable all features"
              isLoaded={isLoaded}
              delay="1000"
            />
            
            <StepCard 
              number="2"
              title="Explore Your Data"
              description="View personalized analytics and insights"
              isLoaded={isLoaded}
              delay="1100"
            />
            
            <StepCard 
              number="3"
              title="Share Your Profile"
              description="Show off your music taste to friends and followers"
              isLoaded={isLoaded}
              delay="1200"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ title, description, icon, delay, isLoaded }) => (
  <div 
    className={`bg-spotify-light rounded-lg p-6 shadow-lg hover:bg-gray-800 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 p-3 bg-spotify-green bg-opacity-10 rounded-full text-spotify-green">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  </div>
);

const StepCard = ({ number, title, description, isLoaded, delay }) => (
  <div 
    className={`bg-spotify-light rounded-lg p-6 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-spotify-green rounded-full flex items-center justify-center text-xl font-bold text-black mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  </div>
);

export default Home;