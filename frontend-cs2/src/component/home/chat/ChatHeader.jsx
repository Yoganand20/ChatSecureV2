import React from "react";
import useChatStore from "../../../store/chatStore";

const ChatHeader = () => {
    const { selectedChat } = useChatStore();
    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                <div className="flex item-center gap-3">
                    {/* Profile picture */}
                    <div className="avatar">
                        <div className="size-10 rounded-full relative">
                            <img
                                src={selectedChat.profilePic || "/avatar.png"}
                                alt={selectedChat.chatName}
                            />
                        </div>
                    </div>

                    {/* User info */}
                    <div>
                        <h3 className="font-medium">{selectedChat.chatName}</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
