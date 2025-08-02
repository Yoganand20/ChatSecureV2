import { io } from "socket.io-client";
import useChatStore from "../store/chatStore.js";
import useMessageStore from "../store/messageStore.js";
import dexieDb from "./dexieDb.js";
import EncryptionUtils from "../utils/encryptionUtils.js";
import { syncData } from "./DataSync.js";
const ACK_TIMEOUT = 5000;
const MAX_RETRIES = 3;

class SocketManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    //          Connect / Disconnect
    connect = async (userId) => {
        if (this.socket) this.disconnect();

        return new Promise((resolve, reject) => {
            this.socket = io("http://localhost:5005", {
                transports: ["polling", "websocket"],
                auth: { userId },
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });

            this.socket.once("connect", async () => {
                try {
                    this.isConnected = true;
                    this._registerCoreListeners();
                    console.log("Connected to server");
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });

            this.socket.on("connect_error", (error) => {
                console.error("Connection failed:", error);
                reject(error);
            });
        });
    };
    disconnect = () => {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    };

    _registerCoreListeners = () => {
        this.socket.on("update-chatdata", (payload) =>
            useChatStore.getState().updateChatData(payload)
        );

        this.socket.on("receive-encrypted", (msg, ack) =>
            this._onReceiveEncrypted(msg, ack)
        );

        this.socket.on("receive-public-key", (data, cd) =>
            this._onReceivePublicKey(data, cd)
        );

        this.socket.on("queue-error", (err) =>
            console.error("Queue error ->", err)
        );

        this.socket.on("disconnect", () => {
            this.isConnected = false;
            console.log("Disconnected from server");
        });
        this.socket.on("reconnect", async () => {
            console.log("Reconnected to server");
            await this._fetchUndeliveredMessages();
        });
    };
    //          EMITTER HELPERS
    #emitWithRetry = (event, payload, tries = 0) =>
        new Promise((resolve, reject) => {
            if (!this.socket || !this.isConnected) {
                console.log("Socket offline or not connected");
                return reject(new Error("socket-offline"));
            }
            this.socket
                .timeout(ACK_TIMEOUT)
                .emitWithAck(event, payload)
                .then((response) => {
                    resolve(response);
                })
                .catch((err) => {
                    console.log("emitWithAck failed:", err.message);
                    if (tries < MAX_RETRIES) {
                        console.warn(
                            `${event} ack timeout – retry ${tries + 1}`
                        );
                        setTimeout(
                            () =>
                                this.#emitWithRetry(event, payload, tries + 1)
                                    .then(resolve)
                                    .catch(reject),
                            300 * (tries + 1)
                        );
                    } else {
                        reject(err || new Error("ack-timeout"));
                    }
                });
        });

    //          public helpers

    async sendEncrypted({ chatId, receiverId, senderId, plaintext }) {
        try {
            const sharedKey = await dexieDb.loadKey(receiverId);
            const { encryptedText, iv } = sharedKey
                ? await EncryptionUtils.encrypt(plaintext, sharedKey)
                : { encryptedText: plaintext, iv: "" };

            const msg = {
                chatId,
                receiverId,
                senderId,
                encryptedMessage: encryptedText,
                iv,
                messageType: "text",
                timeSent: new Date(),
            };
            const serverMsg = await this.#emitWithRetry("send-encrypted", msg);

            const messageForStorage = {
                id: serverMsg._id,
                chatId: serverMsg.chatId,
                senderId,
                receiverId,
                message: plaintext,
                encryptedMessage: serverMsg.encryptedMessage,
                iv: serverMsg.iv,
                messageType: "text",
                timeSent: serverMsg.sentTime,
            };

            // Update UI if this is the current chat
            const { currentChatId } = useMessageStore.getState();
            if (serverMsg.chatId === currentChatId) {
                useMessageStore.getState().addMessage(messageForStorage);
            }

            return serverMsg;
        } catch (error) {
            // Mark message as failed
            console.error("Failed to send message:", error);
            throw error;
        }
    }

    /** Send our public ECDH key to a peer. */
    sendPublicKey(receiverId, publicKeyArray) {
        return this.#emitWithRetry("send-public-key", {
            to: receiverId,
            publicKey: publicKeyArray,
        });
    }

    /** Handle incoming public key for ECDH handshake. */
    async _onReceivePublicKey({ from, publicKey }, cb) {
        try {
            const peerPub = new Uint8Array(publicKey);
            // const myPriv = this._pendingKeyExchanges.get(from);
            const myPriv = await EncryptionUtils.loadCachedPrivateKey(from);
            if (!myPriv) {
                console.warn(
                    `No private key cached for ${from}, skipping handshake.`
                );
                cb?.("failed");
                return;
            }

            // Derive and store shared AES key
            const sharedKey = await EncryptionUtils.deriveSharedKey(
                myPriv,
                peerPub
            );
            await dexieDb.saveKey(from, sharedKey);

            await EncryptionUtils.clearCachedPrivateKey(from);
            console.log(`Completed key exchange with ${from}`);
            cb?.("received");
        } catch (err) {
            console.error("Error in receive-public-key:", err);
        }
    }

    /** Handle incoming encrypted message. */
    async _onReceiveEncrypted(msg, ack) {
        try {
            await syncData._handleIncomingMessage(msg);
            ack?.("received");
        } catch (err) {
            console.error("Error handling incoming message:", err);
            ack?.("error");
        }
    }

    fetchUndeliveredMessages = () => this._fetchUndeliveredMessages();
}

export const socketManager = new SocketManager();
