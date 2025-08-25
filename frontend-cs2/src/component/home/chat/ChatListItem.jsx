const ChatListItem = ({ chat, isCollapsed, onClick }) => {
	return (
		<div
			className={`
                flex items-center hover:bg-base-300 cursor-pointer
                transition-all duration-200 relative group
                ${isCollapsed ? "p-2 justify-center" : "p-3 space-x-3"}
                ${chat.isActive ? "bg-primary/10 border-r-2 border-primary" : ""}
            `}
			style={{
				maxWidth: "100%",
				overflow: "hidden",
			}}
			title={isCollapsed ? chat.chatName : ""}
			onClick={() => onClick(chat)}>
			{/* Profile Picture with online indicator and unread badge */}
			<div className={`${isCollapsed ? "w-8 h-8" : "w-10 h-10"} rounded-full`}>
				<img
					src={chat.profilePic}
					alt={`${chat.chatName}'s profile`}
					className='w-full h-full object-cover rounded-full'
				/>
			</div>

			{/* Chat Info - Only visible when expanded */}
			{!isCollapsed && (
				<div className='flex-1 min-w-0'>
					<div className='flex items-center justify-between mb-1'>
						<h3 className='font-semibold text-sm truncate text-base-content'>{chat.chatName}</h3>
					</div>
				</div>
			)}

			{/* Hover tooltip for collapsed state */}
			{isCollapsed && (
				<div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-base-100 text-base-content px-2 py-1 rounded shadow-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10'>
					<div className='font-semibold'>{chat.chatName}</div>
					{/* Arrow pointing to profile */}
					<div className='absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-base-100'></div>
				</div>
			)}
		</div>
	);
};

export default ChatListItem;
