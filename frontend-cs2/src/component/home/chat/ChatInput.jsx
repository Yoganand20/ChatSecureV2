import React, { useState, useCallback } from "react";
import useChatStore from "@store/chatStore";
import useAuthStore from "@store/authStore";
import useMessageStore from "@/store/messageStore";
import { socketManager } from "@lib/socketManager";
import dexieDb from "@lib/dexieDb";

const ChatInput = () => {
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const { selectedChat } = useChatStore();
	const { authUser } = useAuthStore();
	const { addMessage } = useMessageStore();
	// Handle sending new message
	const handleSendMessage = useCallback(
		async (event) => {
			event.preventDefault();
			if (!message.trim() || !selectedChat || sending) return;
			setSending(true);

			try {
				// Get other members (excluding current user)
				const chatMembers = await dexieDb.getChatMembers(selectedChat.chatId);

				const otherMembers = chatMembers.filter((member) => member !== authUser._id);

				const messageData = await socketManager.sendMessage({
					chatId: selectedChat.chatId,
					receiverIds: otherMembers,
					senderId: authUser._id,
					plaintext: message.trim(),
				});

				addMessage(messageData);

				setMessage("");
			} catch (error) {
				console.error("Failed to send message:", error);
			} finally {
				setSending(false);
			}
		},
		[message, selectedChat, sending, authUser]
	);
	const handleInputChange = useCallback(({ target: { value } }) => {
		setMessage(value);
	}, []);
	return (
		<div>
			<div className='border-t border-base-300 p-4 bg-base-200'>
				<form onSubmit={handleSendMessage} className='flex space-x-2'>
					<input
						type='text'
						value={message}
						onChange={handleInputChange}
						placeholder='Type a message...'
						disabled={sending}
						className='flex-1 input input-bordered focus:outline-none'
					/>
					<button type='submit' disabled={!message.trim() || sending} className='btn btn-primary'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							fill='none'
							viewBox='0 0 24 24'
							strokeWidth={1.5}
							stroke='currentColor'
							className='w-5 h-5'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5'
							/>
						</svg>
					</button>
				</form>
			</div>
		</div>
	);
};

export default ChatInput;
