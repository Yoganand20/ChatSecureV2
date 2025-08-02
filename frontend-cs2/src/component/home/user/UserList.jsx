import React from "react";
import UserListItem from "./UserListItem";

/**
 * Props
 * @param {Array<Object>} users               – Array of user objects.
 * @param {string}         emptyMessage       – Message shown when list is empty.
 * @param {boolean}        loaderState        – When true shows a loading indicator.
 * @param {Function}       onSelect           – Callback fired when a user row is clicked.
 * @param {boolean}        showCheckbox       – If true, each row renders a checkbox.
 * @param {Set<number>}    selectedUserIds    – Set of selected user ids (for checkbox state).
 */
const UserList = ({
  users = [],
  emptyMessage = "No users found",
  loading = false,
  onSelect = () => {},
  showCheckbox = false,
  selectedUserIds = new Set(),
}) => {
  /* ---------- render helpers ---------- */
  const renderLoader = () => (
    <div className="flex items-center justify-center h-64">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );

  const renderEmpty = () => (
    <div className="flex items-center justify-center h-64">
      <p className="text-base-content/50">{emptyMessage}</p>
    </div>
  );

  const renderList = () => (
    <div className="h-64 overflow-y-auto divide-y divide-base-300/50">
      {users.map((user) => (
        <UserListItem
          key={user._id}
          userDetails={user}
          onSelect={onSelect}
          showCheckbox={showCheckbox}
          checked={selectedUserIds.has(user._id)}
        />
      ))}
    </div>
  );

  /* ---------- main render ---------- */
  return (
    <section className="border border-base-300/50 rounded-lg bg-base-200/30 backdrop-blur-sm">
      {loading
        ? renderLoader()
        : users.length === 0
        ? renderEmpty()
        : renderList()}
    </section>
  );
};

export default UserList;
