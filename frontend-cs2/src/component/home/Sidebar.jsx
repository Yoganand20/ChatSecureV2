import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Plus, MoreVertical, Menu, Settings, LogOut } from "lucide-react";

import ChatListItem from "./chat/ChatListItem";
import ChatCreationModal from "./newChatModal/ChatCreationModal";

import useChatStore from "@store/chatStore.js";

const Sidebar = () => {
	// ==================== STATE MANAGEMENT ====================
	const { chats, selectChat } = useChatStore();
	const [showSettingsMenu, setShowSettingsMenu] = useState(false);
	const [showNewChatModal, setShowNewChatModal] = useState(false);

	const handleChatSelect = useCallback(
		(chat) => {
			selectChat(chat);
		},
		[selectChat]
	);
	const openNewChatModal = useCallback(() => setShowNewChatModal(true), []);
	const closeNewChatModal = useCallback(() => setShowNewChatModal(false), []);
	const [isCollapsed, setIsCollapsed] = useState(() => {
		return window.innerWidth < 1024;
	});

	useEffect(() => {
		const checkScreenSize = () => {
			const screenWidth = window.innerWidth;
			setIsCollapsed(screenWidth < 1024);
		};

		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	useEffect(() => {
		const handleKeyPress = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "b") {
				e.preventDefault();
				setIsCollapsed((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, []);

	const toggleSidebar = useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	const SidebarHeader = () => (
		<div className='flex items-center justify-between p-4 border-b border-base-300 min-h-[4rem]'>
			{isCollapsed ? (
				// Collapsed: Only new chat button
				<div className='flex items-center justify-center w-full'>
					<button onClick={openNewChatModal} className='btn btn-primary btn-circle btn-sm' title='New Chat'>
						<Plus size={16} />
					</button>
				</div>
			) : (
				// Expanded: App logo + title on left, new chat button on right
				<div className='flex items-center justify-between w-full'>
					<div className='flex items-center space-x-3'>
						<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
							<MessageCircle size={20} className='text-primary-content' />
						</div>
						<h2 className='text-xl font-bold'>Chats</h2>
					</div>

					<button onClick={openNewChatModal} className='btn btn-ghost btn-circle btn-sm' title='New Chat'>
						<Plus size={20} />
					</button>
				</div>
			)}
		</div>
	);

	const ChatList = () => (
		<div className='flex-1 overflow-y-auto py-2 overflow-x-hidden'>
			{chats.length === 0 ? (
				<div className='no-chats'>
					<p>No chats yet</p>
					<p>Create your first chat!</p>
				</div>
			) : (
				chats.map((chat) => (
					<ChatListItem key={chat.chatId} chat={chat} isCollapsed={isCollapsed} onClick={handleChatSelect} />
				))
			)}
		</div>
	);
	const SettingsDropdown = () => (
		<div className='dropdown dropdown-top dropdown-end'>
			<button className='btn btn-ghost btn-circle btn-sm' onClick={() => setShowSettingsMenu(!showSettingsMenu)}>
				<MoreVertical size={16} />
			</button>
			{showSettingsMenu && (
				<ul className='dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mb-2'>
					<li>
						<a onClick={toggleSidebar}>
							<Menu size={16} />
							Toggle Sidebar
							<span className='text-xs opacity-60'>Ctrl+B</span>
						</a>
					</li>
					<li>
						<a>
							<Settings size={16} />
							Settings
						</a>
					</li>
					<li>
						<a>
							<LogOut size={16} />
							Sign Out
						</a>
					</li>
				</ul>
			)}
		</div>
	);

	const UserProfile = () => (
		<div className='p-4'>
			{isCollapsed ? (
				// Collapsed: Only profile picture
				<div className='flex justify-center'>
					<div className='avatar'>
						<div className='w-10 h-10 rounded-full'>
							{/* <img
                                src={currentUser.profilePicture}
                                alt={`${currentUser.name}'s profile`}
                                className="w-full h-full object-cover rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                                title={currentUser.name}
                            /> */}
						</div>
					</div>
				</div>
			) : (
				// Expanded: Profile info with settings dropdown
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity'>
						<div className='avatar'>
							<div className='w-10 h-10 rounded-full'>
								{/* <img
                                    // src={currentUser.profilePicture}
                                    // alt={`${currentUser.name}'s profile`}
                                    className="w-full h-full object-cover rounded-full"
                                /> */}
							</div>
						</div>
						<div className='flex-1 min-w-0'>
							<h3 className='font-semibold text-sm truncate text-base-content'>
								{/* {currentUser.name} */}
							</h3>
						</div>
					</div>
					<SettingsDropdown />
				</div>
			)}
		</div>
	);

	return (
		<>
			<aside
				className={`
                bg-base-200 text-base-content flex flex-col border-r border-base-300
                transition-all duration-300 ease-out h-full relative
                ${isCollapsed ? "w-16" : "w-80"}
            `}
				style={{
					willChange: "width, transform",
					transitionProperty: "width, padding, margin",
					transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
				}}>
				{/* Header */}
				<SidebarHeader />

				{/* Chat List */}
				<div className='flex-1 overflow-y-auto'>
					<ChatList />
				</div>

				{/* Footer */}
				<div className='border-t border-base-300'>
					{/* User Profile Section */}
					<UserProfile />
				</div>
			</aside>

			<ChatCreationModal isOpen={showNewChatModal} onClose={closeNewChatModal} />
		</>
	);
};

export default Sidebar;
