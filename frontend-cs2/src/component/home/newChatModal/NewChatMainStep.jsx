
import  {useUserStore}  from "../../../store/userStore.js";
import {useEffect,useState} from 'react';
import UserList from "../user/UserList";
import SearchBar from '../SearchBar'
import { XMarkIcon } from "@heroicons/react/24/outline";
const DEBOUNCE_DELAY=300;

const NewChatMainStep = ({
    chatState,
    updateChatState,
    onNext,
    onCreateChat,
    closeModal,
}) => {
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const { loading, searchUserName } = useUserStore();

    const { isGroupMode, selectedUsers } = chatState;

    // Debounced user search effect
    useEffect(() => {
        const trimmed = search.trim();
        if (trimmed.length < 2) return;

        const timeoutId = setTimeout(async() => {
            if(trimmed.length>2)
                setSearchResults(await searchUserName(trimmed));
            else{
                setSearchResults([]);
            }
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timeoutId);
    }, [search, searchUserName]);

    const handleUserSelect = (user) => {
        if (isGroupMode) {
            const isSelected = selectedUsers.find((u) => u.id === user.id);
            const newSelectedUsers = isSelected
                ? selectedUsers.filter((u) => u.id !== user.id)
                : [...selectedUsers, user];
            updateChatState({ selectedUsers: newSelectedUsers });
        } else {
            onCreateChat({ memberIds:[user._id] });
            closeModal();
        }
    };

    const handleModeToggle = () => {
        updateChatState({
            isGroupMode: !isGroupMode,
            selectedUsers: [],
        });
    };

    const emptyMessage = search.trim().length === 0
    ? "Type in the search bar to find users"
    : "No matching users";

    return (
        <div className="p-6">
            <Header
                title={
                    isGroupMode ? "Create Group Chat" : "Start Direct Message"
                }
                onClose={closeModal}
            />

            <ModeToggle isGroupMode={isGroupMode} onToggle={handleModeToggle} />

            <SearchBar
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
            />

            {isGroupMode && selectedUsers.length > 0 && (
                <SelectedUsers
                    users={selectedUsers}
                    onRemove={handleUserSelect} 
                />
            )}
            <UserList
                users={searchResults}
                loading={loading}
                emptyMessage={emptyMessage}
                onSelect={handleUserSelect}
                showCheckbox={isGroupMode}
            /> 
            <BottomButtons
                isGroupMode={isGroupMode}
                canProceed={selectedUsers.length > 0}
                onCancel={closeModal}
                onNext={onNext}
            />
        </div>
    );
};

// components/ui/Header.jsx
export const Header = ({ title, onClose }) => (
    <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <XMarkIcon className="h-5 w-5" />
        </button>
    </div>
);

// components/ui/ModeToggle.jsx
export const ModeToggle = ({ isGroupMode, onToggle }) => (
    <div className="mb-6">
        <div className="flex items-center justify-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
                {["DM", "Group Message"].map((mode, index) => (
                    <button
                        key={mode}
                        onClick={() =>
                            (index === 1) !== isGroupMode && onToggle()
                        }
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            (index === 1) === isGroupMode
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}>
                        {mode}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

export const SelectedUsers = ({ users, onRemove }) => (
    <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Selected ({users.length}):</p>
        <div className="flex flex-wrap gap-2">
            {users.map((user) => (
                <div key={user.id} className="badge badge-primary gap-2">
                    {user.name}
                    <button
                        onClick={() => onRemove(user)}
                        className="btn btn-xs btn-ghost btn-circle">
                        ×
                    </button>
                </div>
            ))}
        </div>
    </div>
);

export const BottomButtons = ({
    isGroupMode,
    canProceed,
    onCancel,
    onNext,
}) => (
    <div className="flex justify-between">
        <button onClick={onCancel} className="btn btn-ghost">
            Cancel
        </button>
        {isGroupMode && (
            <button
                onClick={onNext}
                disabled={!canProceed}
                className="btn btn-primary">
                Next
            </button>
        )}
    </div>
);

export default NewChatMainStep;