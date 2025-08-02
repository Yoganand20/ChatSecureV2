import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useUserStore = create((set) => ({
  users: [],
  loading: false,
  error: null,


  searchUserName: async (partialUserName) => {
    set({ loading: true, error: null });

    try {
      const res = await axiosInstance.post("/user/search/", {
        partialUserName,
      });

      if (res.data.success) {
        set({ users: res.data.data, loading: false });
        return res.data.data;
      } else {
        set({ error: res.data.message || "Search failed", loading: false });
        return [];
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || err.message || "Network error",
        loading: false,
      });
      return [];
    }
  },
}));
