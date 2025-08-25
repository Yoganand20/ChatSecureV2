import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import "./App.css";
import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import useAuthStore from "@store/authStore";
import AuthPage from "@page/AuthPage";
import Signup from "@component/auth/Signup";
import Login from "@component/auth/Login";
import ChatHome from "@page/ChatHome";
import ProtectedRoute from "@component/helper/ProtectedRoute";
import PublicRoute from "@component/helper/PublicRoute";

function App() {
	const { checkAuth } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	return (
		<>
			<Toaster position='top-center' reverseOrder={false} />
			<BrowserRouter>
				<Routes>
					{/* Public Routes */}
					<Route
						path='/auth'
						element={
							<PublicRoute>
								<AuthPage />
							</PublicRoute>
						}>
						<Route path='login' element={<Login />} />
						<Route path='signup' element={<Signup />} />
					</Route>
					{/* Protected Routes */}
					<Route
						path='/'
						element={
							<ProtectedRoute>
								<ChatHome />
							</ProtectedRoute>
						}
					/>

					<Route path='*' element={<Navigate to='/' replace />} />
				</Routes>
			</BrowserRouter>
			{/* <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            authUser ? (
                                <ChatHome />
                            ) : (
                                <Navigate to="/auth/login" />
                            )
                        }></Route>

                    <Route
                        path="/auth"
                        element={
                            !authUser ? <AuthPage /> : <Navigate to="/" />
                        }>
                        <Route path="login" element={<Login />}></Route>
                        <Route path="signup" element={<Signup />}></Route>
                    </Route>
                </Routes>
            </BrowserRouter> */}
		</>
	);
}

export default App;
