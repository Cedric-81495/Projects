// frontend/src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSpotify } from '../context/SpotifyContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSpotify();
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedRoute;