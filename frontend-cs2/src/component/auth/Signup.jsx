import React, { useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import useAuthStore from "@store/authStore";
const Signup = () => {
	const { signup } = useAuthStore();
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		confirmPassword: "",
	});

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};
	const validateForm = () => {
		const { username, password, confirmPassword } = formData;

		if (!username || !password || !confirmPassword) {
			toast.error("Please fill all the fields");
			return false;
		}

		if (username.length < 3) {
			toast.error("Username must be at least 3 characters long");
			return false;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return false;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;
		const { username, password } = formData;
		const result = await signup({ username, password });

		if (result.success) {
			console.log("Signup successful:", result.data);
			// Redirect or perform success actions
		} else {
			// Error handling is done in the store with toast
			console.log("Signup failed:", result.message);
		}
	};
	return (
		<>
			<div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
				<div className='sm:mx-auto sm:w-full sm:max-w-sm'>
					<h2 className='mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900'>
						Sign in to your account
					</h2>
				</div>

				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label htmlFor='email' className='block text-sm/6 font-medium text-gray-900'>
								Username
							</label>
							<div className='mt-2'>
								<input
									value={formData.userName}
									onChange={handleInputChange}
									id='username'
									name='username'
									type='text'
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
							</div>
							<div className='mt-2'>
								<input
									id='password'
									value={formData.password}
									onChange={handleInputChange}
									name='password'
									type='password'
									required
									autoComplete='current-password'
									className='block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6'
								/>
							</div>
						</div>
						<div>
							<div className='flex items-center justify-between'>
								<label htmlFor='password' className='block text-sm/6 font-medium text-gray-900'>
									Confirm Password
								</label>
							</div>
							<div className='mt-2'>
								<input
									id='confirmPassword'
									value={formData.confirmPassword}
									onChange={handleInputChange}
									name='confirmPassword'
									type='password'
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
								Register
							</button>
						</div>
					</form>

					<p className='mt-10 text-center text-sm/6 text-gray-500'>
						Already a member?{" "}
						<Link to='/auth/login' className='font-semibold text-indigo-600 hover:text-indigo-500'>
							Login Now
						</Link>
					</p>
				</div>
			</div>
		</>
	);
};

export default Signup;
