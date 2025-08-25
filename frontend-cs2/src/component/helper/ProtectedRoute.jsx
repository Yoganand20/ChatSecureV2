import useAuthStore from "@store/authStore";
import { Navigate } from "react-router";

const ProtectedRoute = ({ children }) => {
	const { authUser, isCheckingAuth } = useAuthStore();

	// Show loading while checking authentication
	if (isCheckingAuth) {
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='loading loading-spinner loading-lg'></div>
			</div>
		);
	}

	// Redirect to login if not authenticated
	if (!authUser) {
		return <Navigate to='/auth/login' replace />;
	}

	// Render protected content
	return children;
};

export default ProtectedRoute;
