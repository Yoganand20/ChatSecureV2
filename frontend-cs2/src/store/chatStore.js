import { create } from "zustand";
import axiosInstance from "../lib/axios.js";
import dexieDb from "../lib/dexieDb.js";
import useAuthStore from "./authStore.js";

const useChatStore = create((set) => ({
    chats: [],
    selectedChatMember:null,
    loadingChats: false,
    selectedChat: null,
    error: null,
    selectChat: async (chat) => {
        const members=await dexieDb.getChatMembersWithDetails(chat.chatId);
        set({ selectedChat: chat,selectedChatMember:members });

    },
    createChat: async ({
        chatName = "",
        memberIds,
        isGroup = false,
        profilPic = "",
    }) => {
        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            set({ error: "User IDs array is required and cannot be empty" });
            return null;
        }

        set({ loadingChats: true, error: null });

        try {
            const response = await axiosInstance.post("/chat/", {
                chatName,
                memberIds,
                isGroup,
                profilPic,
            });
            const { authUser } = useAuthStore.getState();

            if (response.data.success) {
                const chatData = response.data.data;
                if (!chatData.isGroup) {
                    chatData.chatName =
                        chatData.members[0]._id == authUser._id
                            ? chatData.members[1].username
                            : chatData.members[0].username;
                    chatData.profilePic =
                        chatData.members[0]._id == authUser._id
                            ? chatData.members[1].profilePic
                            : chatData.members[0].profilePic;
                }

                // Store chat data in IndexedDB using Dexie createChat function
                const chatId = await dexieDb.addChat(chatData);

                // If the server response includes member data, store them too
                if (chatData.members && Array.isArray(chatData.members)) {
                    for (const memberId of chatData.members) {
                        await dexieDb.addMemberToChat(chatId, memberId._id);
                    }
                    // await addMembersToChat(chatData._id, chatData.members);
                }

                // Retrieve the stored chat entry from IndexedDB
                const storedChat = await dexieDb.getChat(chatId);

                if (storedChat) {
                    // Add the stored chat to the existing chats list
                    set((state) => ({
                        chats: [storedChat, ...state.chats],
                        loadingChats: false,
                        error: null,
                    }));

                    return storedChat;
                } else {
                    throw new Error(
                        "Failed to retrieve stored chat from IndexedDB"
                    );
                }
            } else {
                // Server responded but with success: false
                const errorMessage =
                    response.data.message || "Failed to create chat";
                set({
                    error: errorMessage,
                    loadingChats: false,
                });
                return null;
            }
        } catch (err) {
            // Network error or other exceptions
            const errorMessage =
                err.response?.data?.message ||
                err.message ||
                "Network error occurred while creating chat";

            set({
                error: errorMessage,
                loadingChats: false,
            });

            return null;
        }
    },

    loadChats: async () => {
        try {
            set({ chats: await dexieDb.getAllChats() });
        } catch (error) {
            console.error("Failed to load chats:", error);
        }
    },
}));

export default useChatStore;
