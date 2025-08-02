import React ,{useState,useEffect,useCallback} from 'react';
import Sidebar from '../component/home/Sidebar';
import ChatContainer from '../component/home/ChatContainer';
import ChatInput from '../component/home/chat/ChatInput';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

import { socketManager } from '../lib/socketManager';
import { syncData } from '../lib/DataSync';
const ChatHome = () => {
  const { authUser } = useAuthStore();
  const { selectedChat, loadChats } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);


  const initializeApp = useCallback(async () => {
    try {
      // Initialize socket connection
      await socketManager.connect(authUser._id);
      console.log("Syncing data from server");
      // Sync data from server to Dexie
      await syncData.syncUserData(authUser._id);
      // Load chats from Dexie
      await loadChats();
      
      setIsLoading(false);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsLoading(false);
    }
  }, [authUser._id, loadChats]);

  useEffect(() => {
    if (authUser?._id) {
      initializeApp();
    }

    return () => {
      socketManager.disconnect();
    };
  }, [authUser, initializeApp]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  return (
    <div className="flex h-screen bg-base-200">
      {/* Left Sidebar: Recent Chats List */}
      <div className="flex-none border-r border-base-300">
        <Sidebar />
      </div>

      {/* Right Section: Chat Messages Display */}

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <ChatContainer />
        </div>
        <div className="flex-none">
          {selectedChat && <ChatInput />}
          </div>
        </div>
    </div>
  );
};

export default ChatHome;
