// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import { SpotifyProvider } from './context/SpotifyContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRoutes';
import NowPlayingBar from './components/NowPlayingBar';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';

function App() {
  return (
    <BrowserRouter>
      <SpotifyProvider>
         <ScrollToTop /> 
         <BackToTop /> 
        <div className="flex flex-col min-h-screen bg-spotify-black">
          <Navbar />
          <main className="flex-grow pb-20">
            <AppRoutes />
          </main>
          <NowPlayingBar />
          <Footer />
        </div>
      </SpotifyProvider>
    </BrowserRouter>
  );
}

export default App;