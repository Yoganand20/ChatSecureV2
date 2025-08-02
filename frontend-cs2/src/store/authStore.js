import { create } from "zustand";
import axiosInstance from "../lib/axios";

const useAuthStore = create((set) => ({
    authUser: false,
    isAuthenticated: false,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/checkAuth");
            if (res.data.success) {
                set({ authUser: res.data.data, isAuthenticated: true });
                return true;
            } else {
                set({ authUser: null, isAuthenticated: false });
                return false;
            }
        } catch (error) {
            console.log("Error in Check Auth", error);
            sessionStorage.removeItem("accessToken");
            set({ authUser: null, isAuthenticated: false });
            return false;
        }
    },

    signup: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/signup", data);
            const accessToken = res.headers.get("X-Access-Token");
            if (accessToken) {
                sessionStorage.setItem("accessToken", accessToken);
            }
            set({ authUser: res.data.data, isAuthenticated: true });
            return res.data;
        } catch (error) {
            const message = error.response?.data?.message || "Sign up failed";
            set({ authUser: null, isAuthenticated: false });
            return {
                success: false,
                status: error.response?.status,
                message: message,
                data: error.response?.data,
            };
        }
    },

    login: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/login", data);
            const accessToken = res.headers.get("X-Access-Token");
            if (accessToken) {
                sessionStorage.setItem("accessToken", accessToken);
            }
            set({ authUser: res.data.data, isAuthenticated: true });
            return res.data;
        } catch (error) {
            set({ authUser: null, isAuthenticated: false });

            const message = error.response?.data?.message || "Login failed";
            if (error.response?.status !== 409) {
                console.log(message);
            }

            return {
                success: false,
                status: error.response?.status,
                message: message,
                data: error.response?.data,
            };
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            sessionStorage.removeItem("accessToken");
        } catch (error) {
            sessionStorage.removeItem("accessToken");
            console.log(error);
        } finally {
            set({ authUser: null, isAuthenticated: false });
            console.log("Logged out successfully");
        }
    },
}));

export default useAuthStore;
