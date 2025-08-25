import dexieDb from "./dexieDb.js";
import axiosInstance from "./axios.js";
import EncryptionUtils from "@utils/encryptionUtils.js";
import { socketManager } from "./socketManager.js";
import useMessageStore from "@store/messageStore.js";
/**
 * Handles synchronization of chats, users, messages, and cryptographic keys.
 */
class DataSync {
	/**
	 * Fetch and store all chats from server.
	 * @param {string} authUserId
	 * @returns {Promise<Array>} List of server chats or empty array
	 */
	async syncChats(authUserId) {
		try {
			const response = await axiosInstance.get("/chat");
			if (!response.data.success) return [];
			const serverChats = response.data.data;
			await dexieDb.syncChats(serverChats, authUserId);
			return serverChats;
		} catch (error) {
			console.error("syncChats failed:", error);
			return [];
		}
	}

	/**
	 * Placeholder for future message synchronization by chatId.
	 * @param {string} chatId
	 */
	async syncMessages(chatId) {
		console.log("syncMessages (TODO) for chat:", chatId);
	}

	/**
	 * Fetch user details in chunks for any chat members not yet stored locally.
	 * @returns {Promise<Array>} Newly fetched users
	 */
	async syncMissingUsers() {
		try {
			const memberRows = await dexieDb.chatMembers.toArray();
			const memberIds = [...new Set(memberRows.map((m) => m.userId))];
			if (memberIds.length === 0) return [];

			const cachedIds = await dexieDb.users.where("id").anyOf(memberIds).primaryKeys();
			const missingIds = memberIds.filter((id) => !cachedIds.includes(id));
			if (missingIds.length === 0) return [];

			return await this._fetchUsersInChunks(missingIds);
		} catch (error) {
			console.error("syncMissingUsers failed:", error);
			return [];
		}
	}

	/**
	 * Helper: Fetch user info in chunks and store locally.
	 * @param {Array<string>} ids
	 * @returns {Promise<Array>} Fetched users
	 */
	async _fetchUsersInChunks(ids) {
		const CHUNK = 100;
		let fetched = [];
		for (let i = 0; i < ids.length; i += CHUNK) {
			const chunk = ids.slice(i, i + CHUNK);
			try {
				const { data } = await axiosInstance.post("/user", {
					userIds: chunk,
				});
				if (data.success && Array.isArray(data.data)) {
					await dexieDb.syncUsers(data.data);
					fetched = fetched.concat(data.data);
				}
			} catch (err) {
				console.error("User chunk fetch failed for", chunk, err);
			}
		}
		return fetched;
	}

	/**
	 * Ensure every known user has a shared AES key; if missing, initiate ECDH handshake.
	 * @param {string} authUserId
	 */
	async ensureUserKeys(authUserId) {
		const users = await dexieDb.users.toArray();
		const peers = users.map((u) => u.id).filter((id) => id !== authUserId);
		EncryptionUtils.initPendingKeyCache();

		const missing = [];
		for (const id of peers) {
			const hasStoredKey = await dexieDb.keys.get(id);
			const hasPendingKey = EncryptionUtils._pendingKeyCache.has(id);
			if (hasPendingKey) console.log("Key exchange already in progress for ", id);
			if (hasStoredKey || hasPendingKey) continue;

			missing.push(id);
		}
		if (missing.length === 0) {
			console.log("All users have shared keys.");
			return;
		}

		for (const peerId of missing) {
			const { privateKey, publicKeyRaw } = await EncryptionUtils.generateKeyPair();
			EncryptionUtils.savePendingPrivateKey(peerId, privateKey);
			socketManager.sendPublicKey(peerId, Array.from(publicKeyRaw));
			console.log("Initiated key exchange with", peerId);
		}
	}

	/** Fetch and process undelivered messages & keys from server. */
	async fetchUndeliveredMessages() {
		try {
			const { data } = await axiosInstance.get("/chat/undelivered");
			if (!data.success) return;
			console.log("Pending Data", data);

			for (const msg of data.data.messages || []) {
				await this._handleIncomingMessage(msg);
			}

			for (const key of data.data.keys || []) {
				await socketManager._onReceivePublicKey({
					from: key.senderId,
					publicKey: key.publicKey,
				});
			}
		} catch (err) {
			console.error("Failed to fetch undelivered messages and keys:", err);
		}
	}

	async _handleIncomingMessage(msg) {
		try {
			let plaintext = msg.encryptedMessage;

			// Check if message needs decryption (has encryption key available)
			try {
				if (msg.iv) {
					const key = await dexieDb.loadKey(msg.senderId);
					if (key) {
						plaintext = await EncryptionUtils.decrypt(msg.encryptedMessage, msg.iv, key);
					}
				}
			} catch (decryptError) {
				console.error(`Failed to decrypt message ${msg._id} from ${msg.senderId}:`, decryptError);
				// plaintext remains as the encrypted payload
			}

			const messageForStorage = {
				id: msg._id,
				chatId: msg.chatId,
				senderId: msg.senderId,
				receiverId: msg.receiverId,
				message: plaintext,
				encryptedMessage: msg.encryptedMessage,
				iv: msg.iv,
				messageType: msg.messageType,
				timeSent: msg.sentTime || new Date(),
			};

			await dexieDb.addMessage(messageForStorage);

			// Update UI if this message belongs to current chat
			const { currentChatId } = useMessageStore.getState();
			if (msg.chatId === currentChatId) {
				useMessageStore.getState().addMessage(messageForStorage);
			}

			socketManager.socket.emit("message-received", {
				messageId: msg._id,
				receivedAt: new Date(),
			});
		} catch (error) {
			console.error("Error handling incoming message:", error);
		}
	}

	/**
	 * Orchestrate full user-data sync: chats, users, and keys.
	 * @param {string} authUserId
	 */
	async syncUserData(authUserId) {
		try {
			await this.syncChats(authUserId);
			await this.syncMissingUsers();
			await this.ensureUserKeys(authUserId);
			await this.fetchUndeliveredMessages();
		} catch (error) {
			console.error("syncUserData failed:", error);
		}
	}
}

export const syncData = new DataSync();
