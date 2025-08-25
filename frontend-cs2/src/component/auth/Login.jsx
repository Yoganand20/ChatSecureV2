import React, { useState } from "react";
import { Link } from "react-router";
import useAuthStore from "@store/authStore";
import toast from "react-hot-toast";
import SimpleConfirmationModal from "../helper/SimpleConfirmationModal";

const Login = () => {
	const { login } = useAuthStore();
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	const [showModal, setShowModal] = useState(false);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const performLogin = async (forceLogin = false) => {
		const { username, password } = formData;

		if (!username || !password) {
			toast.error("Please fill all the fields");
			return;
		}

		const loginData = { username, password };
		if (forceLogin) loginData.forcedLogin = "true";

		const result = await login(loginData);
		if (result.success) {
			console.log("Login successful:", result.data);
			toast.success("Login Successful");
		} else if (result.status === 409 && !forceLogin) {
			// Show modal only on first 409 error (not force login)
			setShowModal(true);
		} else {
			// All other errors are handled by toast in the store
			console.log("Login failed:", result.message);
			toast.success("Login Failed");
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		performLogin(false);
	};

	const handleForceLogin = () => {
		setShowModal(false);
		performLogin(true);
	};

	return (
		<>
			<div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-sm'>
					<h2 className='mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900'>
						Login to your account
					</h2>
				</div>

				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label htmlFor='username' className='block text-sm/6 font-medium text-gray-900'>
								Username
							</label>
							<div className='mt-2'>
								<input
									id='username'
									name='username'
									type='text'
									value={formData.username}
									onChange={handleInputChange}
									required
									autoComplete='username'
									className='block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6'
								/>
							</div>
						</div>

						<div>
							<div className='flex items-center justify-between'>
								<label htmlFor='password' className='block text-sm/6 font-medium text-gray-900'>
									Password
								</label>
								<div className='text-sm'>
									<a href='#' className='font-semibold text-indigo-600 hover:text-indigo-500'>
										Forgot password?
									</a>
								</div>
							</div>
							<div className='mt-2'>
								<input
									id='password'
									name='password'
									type='password'
									value={formData.password}
									onChange={handleInputChange}
									required
									autoComplete='current-password'
									className='block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6'
								/>
							</div>
						</div>

						<div>
							<button
								type='submit'
								className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>
								Login
							</button>
						</div>
					</form>

					<p className='mt-10 text-center text-sm/6 text-gray-500'>
						Not a member?{" "}
						<Link to='/auth/signup' className='font-semibold text-indigo-600 hover:text-indigo-500'>
							Sign Up Now
						</Link>
					</p>
				</div>
			</div>

			<SimpleConfirmationModal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				title='Confirm Forced Login'
				message='You are logged in on another device. Force Login will log you out of other device and will result in lose of all chat.'
				primaryButtonText='Force Login'
				secondaryButtonText='Cancel'
				onPrimaryClick={handleForceLogin}
				onSecondaryClick={() => setShowModal(false)}
			/>
		</>
	);
};

export default Login;
