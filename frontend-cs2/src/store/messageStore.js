import { create } from 'zustand';
import dexieDb from "../lib/dexieDb.js"
 const useMessageStore = create((set, get) => ({
  messages: [],
  currentChatId: null,

  loadMessages: async chatId => {
    try {
      const messages = await dexieDb.getChatMessages(chatId);
      set({ 
        messages: messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        currentChatId: chatId 
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  },

  addMessage: async message => {
    try {
      await dexieDb.addMessage(message);
      
      // Only update if it's for the current chat
      const { currentChatId } = get();
      if (message.chatId === currentChatId) {
        set(state => ({
          messages: [...state.messages, message]
        }));
      }
    } catch (error) {
      console.error('Failed to add message:', error);
    }
  },

  clearMessages: () => {
    set({ messages: [], currentChatId: null });
  }
}));

export default useMessageStore;