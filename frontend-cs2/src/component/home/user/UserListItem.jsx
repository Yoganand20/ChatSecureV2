import React from "react";

const UserListItem = ({
  userDetails,
  onSelect,
  showCheckbox = false,
  checked = false,
}) => {
  // Centralised click handler
  const handleToggle = () => onSelect(userDetails);

  return (
    <div
      className="flex items-center p-3 hover:bg-base-200/50 cursor-pointer transition-colors"
      onClick={handleToggle}
    >
      {/* Left section – avatar + names  */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Avatar with online/offline ring  */}
        <div
          className={`avatar ${userDetails.isOnline ? "online" : "offline"}`}
        >
          <div className="w-10 h-10 rounded-full">
            <img
              src={userDetails.profilePicture}
              alt={userDetails.name}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* Name & username  */}
        <div className="min-w-0">
          <h4 className="font-semibold text-sm truncate text-base-content">
            {userDetails.name}
          </h4>
          <p className="text-xs text-base-content/70 truncate">
            @{userDetails.username}
          </p>
        </div>
      </div>

      {/* Right section – optional checkbox  */}
      {showCheckbox && (
        <input
          type="checkbox"
          className="checkbox checkbox-primary ml-3"
          checked={checked}
          onChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
};

export default UserListItem;
