import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:5005/api",
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    (config) => {
        // Get access token from storage
        const accessToken = sessionStorage.getItem("accessToken");
        if (accessToken) {
            config.headers.set("X-Access-Token", accessToken);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token reception and refresh
axiosInstance.interceptors.response.use(
    (response) => {
        // Extract and store new access token from response headers
        const newAccessToken = response.headers.get("X-Access-Token");
        if (newAccessToken) {
            sessionStorage.setItem("accessToken", newAccessToken);
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle 403 errors (expired access token)
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh access token
                const refreshResponse = await axiosInstance.post(
                    "/auth/regen-a-token"
                );

                if (refreshResponse.data.success) {
                    // Retry original request with new token
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - redirect to login
                console.log("Error refreshing token: ",refreshError);
                sessionStorage.removeItem("accessToken");
                window.location.href = "/auth/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
