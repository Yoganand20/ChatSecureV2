import React, { useCallback, useEffect, useRef } from "react";
import ChatHeader from "./chat/ChatHeader.jsx";
import useAuthStore from "@store/authStore.js";
import useChatStore from "@store/chatStore.js";
import useMessageStore from "@store/messageStore.js";
// Individual Message Component
const ChatMessage = ({ message, isFromCurrentUser }) => {
	const { selectedChatMember } = useChatStore();
	const chatAlignment = isFromCurrentUser ? "chat-end" : "chat-start";
	const bubbleColor = isFromCurrentUser ? "chat-bubble-primary" : "chat-bubble-secondary";

	const sender = selectedChatMember[message.senderId];

	const formatTime = useCallback(
		(timestamp) =>
			new Date(timestamp).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			}),
		[]
	);
	return (
		<div key={message.id} className={`chat ${chatAlignment}`}>
			<div className='chat-image avatar'>
				<div className='w-10 rounded-full'>
					<img alt={`${sender.username}'s avatar`} src={sender.profilePic || "/user.png"} />
				</div>
			</div>
			<div className='chat-header'>
				{sender.name}
				<time className='text-xs opacity-50 ml-2'>{formatTime(message.timeSent)}</time>
			</div>
			<div className={`chat-bubble ${bubbleColor}`}>{message.message}</div>
			<div className='chat-footer opacity-50'>{message.status || (isFromCurrentUser ? "Delivered" : "")}</div>
		</div>
	);
};

// Main Chat Container Component
const ChatContainer = () => {
	const { selectedChat } = useChatStore();
	const { messages, loadMessages } = useMessageStore();
	const { authUser } = useAuthStore();

	useEffect(() => {
		if (selectedChat) {
			loadMessages(selectedChat.chatId);
		}
	}, [selectedChat, loadMessages]);

	const messagesEndRef = useRef(null);

	// Auto-scroll to bottom when new messages arrive
	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	// Scroll to bottom when messages change
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	if (!selectedChat) {
		return (
			<div className='flex-1 flex justify-center items-center bg-base-100 h-full'>
				<div className='text-center items-center'>
					<h2 className='text-2xl font-bold text-base-content mb-2'>Welcome to Chat</h2>
					<p className='text-base-content/70'>Select a conversation to start messaging</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex-1 flex flex-col bg-base-100 h-full'>
			{/* Chat Header */}
			<div className='sticky top-0 z-10 bg-base-100 flex-none'>
				<ChatHeader />
			</div>

			{/* Messages Area */}
			<div className='overflow-y-auto p-4 space-y-4 h-full'>
				{messages.length === 0 ? (
					<div className='text-center py-8 h-full items-center'>
						<p className='text-base-content/70'>No messages yet. Start the conversation!</p>
					</div>
				) : (
					<>
						{messages.map((message) => (
							<ChatMessage
								key={message.id}
								message={message}
								isFromCurrentUser={message.senderId === authUser}
							/>
						))}
						<div ref={messagesEndRef} />
					</>
				)}
			</div>
		</div>
	);
};

export default ChatContainer;
