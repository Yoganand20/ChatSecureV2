import { create } from "zustand";
import dexieDb from "@lib/dexieDb.js";
import { syncData } from "@lib/dataSync";
import useChatStore from "./chatStore.js";
const useMessageStore = create((set, get) => ({
	messages: [],
	currentChatId: null,

	loadMessages: async (chatId) => {
		try {
			const messages = await dexieDb.getChatMessages(chatId);
			set({
				messages: messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
				currentChatId: chatId,
			});
		} catch (error) {
			console.error("Failed to load messages:", error);
		}
	},

	addMessage: async (message) => {
		try {
			await dexieDb.addMessage(message);
			const { loadChats } = useChatStore.getState();
			// Only update if it's for the current chat
			const { currentChatId } = get();
			if (message.chatId === currentChatId) {
				set((state) => ({
					messages: [...state.messages, message],
				}));
			}

			if (!dexieDb.getChat(message.chatId)) {
				// Sync data from server to Dexie
				await syncData.syncUserData(message.receiverid);
				// Load chats from Dexie
				await loadChats();
			}
		} catch (error) {
			console.error("Failed to add message:", error);
		}
	},

	clearMessages: () => {
		set({ messages: [], currentChatId: null });
	},
}));

export default useMessageStore;
