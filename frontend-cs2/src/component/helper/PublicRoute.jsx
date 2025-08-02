import  useAuthStore  from '../../store/authStore';
import { Navigate } from 'react-router';

const PublicRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  
  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }
  
  // Redirect to home if already authenticated
  if (authUser) {
    return <Navigate to="/" replace />;
  }
  
  // Render public content
  return children;
};

export default PublicRoute;
