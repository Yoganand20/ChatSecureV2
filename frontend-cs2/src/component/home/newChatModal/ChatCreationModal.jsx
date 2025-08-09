import React, { useState, Fragment } from "react";
import {
    Dialog,
    Transition,
    DialogPanel,
    TransitionChild,
} from "@headlessui/react";
import useChatStore from "../../../store/chatStore.js";
import NewChatMainStep from "./NewChatMainStep.jsx";
import { GroupDetailsStep } from "./GroupDetailsStep.jsx";
import useAuthStore from "../store/authStore.js";
import { syncData } from '../lib/dataSync';

const ChatCreationModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState("main");
    const { authUser } = useAuthStore();
    const { loadChats } = useChatStore();
    const [chatState, setChatState] = useState({
        isGroupMode: false,
        searchResults: [],
        selectedUsers: [],
        groupName: "",
        groupPicture: null,
    });

    const { createChat } = useChatStore();

    const resetModal = () => {
        setStep("main");
        setChatState({
            isGroupMode: false,
            searchResults: [],
            selectedUsers: [],
            groupName: "",
            groupPicture: null,
        });
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleCreateChat = async(chatData) => {
        createChat(chatData);
        // Sync data from server to Dexie
        await syncData.syncUserData(authUser._id);
        // Load chats from Dexie
        await loadChats();
        handleClose();
    };

    const updateChatState = (updates) => {
        setChatState((prev) => ({ ...prev, ...updates }));
    };


    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black opacity-70" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95">
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                                {step === "main" ? (
                                    <NewChatMainStep
                                        chatState={chatState}
                                        updateChatState={updateChatState}
                                        onNext={() => setStep("groupDetails")}
                                        onCreateChat={handleCreateChat}
                                        closeModal={handleClose}
                                    />
                                ) : (
                                    <GroupDetailsStep
                                        chatState={chatState}
                                        updateChatState={updateChatState}
                                        onCreateChat={handleCreateChat}
                                        onBack={() => setStep("main")}
                                    />
                                )}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
export default ChatCreationModal;
