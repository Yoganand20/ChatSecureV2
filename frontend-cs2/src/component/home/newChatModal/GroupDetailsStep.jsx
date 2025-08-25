import { UsersIcon } from "@heroicons/react/24/outline";

const GroupDetailsStep = ({
    chatState,
    updateChatState,
    onCreateChat,
    onBack,
}) => {
    const { selectedUsers, groupName, groupPicture } = chatState;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            updateChatState({ groupPicture: file });
        }
    };

    const handleCreateGroup = () => {
        onCreateChat({
            isGroup: false,
            memberIds: selectedUsers,
            chatName: groupName,
            profilPic: groupPicture,
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                    Group Details
                </h2>
            </div>

            <ProfilePictureUpload
                groupPicture={groupPicture}
                onFileChange={handleFileChange}
            />

            <GroupNameInput
                groupName={groupName}
                onChange={(name) => updateChatState({ groupName: name })}
            />

            <MembersList users={selectedUsers} />

            <div className="flex justify-between">
                <button onClick={onBack} className="btn btn-ghost">
                    Back
                </button>
                <button
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim()}
                    className="btn btn-primary">
                    Create
                </button>
            </div>
        </div>
    );
};

const ProfilePictureUpload = ({ groupPicture, onFileChange }) => (
    <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Profile Picture
        </label>
        <div className="flex items-center space-x-4">
            <div className="avatar">
                <div className="w-16 h-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    {groupPicture ? (
                        <img
                            src={URL.createObjectURL(groupPicture)}
                            alt="Group"
                        />
                    ) : (
                        <div className="bg-gray-200 flex items-center justify-center">
                            <UsersIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                </div>
            </div>
            <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="file-input file-input-bordered file-input-sm"
            />
        </div>
    </div>
);

const GroupNameInput = ({ groupName, onChange }) => (
    <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
        </label>
        <input
            type="text"
            placeholder="Enter group name..."
            className="input input-bordered w-full"
            value={groupName}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const MembersList = ({ users }) => (
    <div className="mb-6">
        {console.log(users)}
        <p className="text-sm font-medium text-gray-700 mb-2">
            Members ({users.length})
        </p>
        <div className="space-y-2 max-h-40 overflow-y-auto">
            {users.map((user) => (
                <div
                    key={user._id}
                    className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                    <div className="avatar">
                        <div className="w-8 h-8 rounded-full">
                            <img
                                src={user.avatar || "/default-avatar.png"}
                                alt={user.username}
                            />
                        </div>
                    </div>
                    <div className="text-sm font-medium">{user.username}</div>
                </div>
            ))}
        </div>
    </div>
);

export { GroupDetailsStep };
