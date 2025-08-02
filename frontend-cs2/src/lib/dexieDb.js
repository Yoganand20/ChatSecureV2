import Dexie from "dexie";
import EncryptionUtils from "../utils/encryptionUtils";

class ChatSecureDB extends Dexie {
  constructor() {
    super("ChatSecureDB");
    this.version(1).stores({
      messages: "++id,chatId,message,senderId,receiverId,timeSent,[chatId],[senderId+receiverId],[id+timeSent]",
      users: "id,username,profilePic",
      chats: "&chatId,chatName,profilePic,owner,createdAt,isGroup",
      chatMembers: "[chatId+userId],chatId,userId",
      keys: "&userId,aesKey,createdAt,version",
      pendingKeys: "&userId,privateKey",
    });
    this._keyCache = new Map();
  }

  async initDB() {
    try {
      await this.open();
      console.log("initDB: Database initialized successfully");
    } catch (err) {
      console.error("initDB failed:", err);
    }
  }

  // Users
  async addUser(user) {
    const id = user._id || user.id;
    const username = user.username;
    const profilePic = user.profilePic?.trim()
      ? user.profilePic
      : `https://api.dicebear.com/9.x/pixel-art/svg?seed=${username}`;
    return this.users.put({ id, username, profilePic });
  }

  async getUser(userId) {
    try {
      return await this.users.get({ id: userId });
    } catch (err) {
      console.error("getUser failed:", err);
      return null;
    }
  }

  async syncUsers(serverUsers) {
    return this.transaction("rw", this.users, async () => {
      for (const u of serverUsers) {
        await this.addUser(u);
      }
    });
  }

  // Messages
  async addMessage(msg) {
    const timeSent = msg.timeSent ? new Date(msg.timeSent) : new Date();
    return this.messages.put({
      id: msg._id || msg.id,
      chatId: msg.chatId,
      message: msg.message,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      timeSent
    });
  }

  async getChatMessages(chatId) {
    try {
      const msgs = await this.messages.where("chatId").equals(chatId).toArray();
      return msgs.sort((a, b) => a.timeSent - b.timeSent);
    } catch (err) {
      console.error("getChatMessages failed:", err);
      return [];
    }
  }

  async syncMessages(chatId, serverMessages) {
    return this.transaction("rw", this.messages, async () => {
      for (const m of serverMessages) {
        await this.addMessage(m);
      }
    });
  }

  // Chats
  async addChat(chatData, authUserId) {
    try {
      const members = chatData.members?.filter(m => m._id !== authUserId) || [];
      let chatName = chatData.chatName;
      if (!chatName) {
        const names = members.slice(0, 3).map(m => m.username).filter(Boolean);
        chatName = names.length ? names.join(", ") : "Unknown Chat";
      }
      let profilePic = chatData.profilePic;
      if (!profilePic) {
        profilePic = chatData.isGroup
          ? "/group.png"
          : members[0]?.profilePic || "/user.png";
      }

      const record = {
        chatId: chatData._id,
        chatName,
        profilePic,
        owner: chatData.owner || "",
        createdAt: new Date(),
        isGroup: chatData.isGroup || false
      };

      let id;
      await this.transaction(
        "rw",
        this.chats,
        this.chatMembers,
        async () => {
          id = await this.chats.put(record);
          if (Array.isArray(chatData.members)) {
            const toAdd = chatData.members.map(m => ({
              chatId: chatData._id,
              userId: m._id
            }));
            await this.chatMembers.bulkPut(toAdd);
          }
        }
      );
      console.log("addChat: Chat created with ID:", id);
      return id;
    } catch (err) {
      console.error("addChat failed:", err);
      throw err;
    }
  }

  async getChat(chatId) {
    try {
      return await this.chats.get({ chatId });
    } catch (err) {
      console.error("getChat failed:", err);
      return null;
    }
  }

  async getAllChats() {
    try {
      return await this.chats.toArray();
    } catch (err) {
      console.error("getAllChats failed:", err);
      return [];
    }
  }

  async syncChats(serverChats, authUserId) {
    return this.transaction(
      "rw",
      this.chats,
      this.chatMembers,
      async () => {
        for (const c of serverChats) {
          await this.addChat(c, authUserId);
        }
      }
    );
  }

  // Chat Members
  async addMemberToChat(chatId, userId) {
    try {
      const existing = await this.chatMembers
        .where("[chatId+userId]")
        .equals([chatId, userId])
        .first();
      if (!existing) {
        await this.chatMembers.add({ chatId, userId });
        console.log("addMemberToChat: Member added");
        return true;
      }
      console.log("addMemberToChat: Member already exists");
      return false;
    } catch (err) {
      console.error("addMemberToChat failed:", err);
      throw err;
    }
  }

  async addMembersToChat(chatId, userIds) {
    try {
      const keys = await this.chatMembers.where("chatId").equals(chatId).keys();
      const existing = keys.map(k => (Array.isArray(k) ? k[1] : k));
      const toAdd = userIds.filter(id => !existing.includes(id))
        .map(id => ({ chatId, userId: id }));
      if (toAdd.length) {
        await this.chatMembers.bulkPut(toAdd);
        console.log("addMembersToChat: Added", toAdd.length);
      }
    } catch (err) {
      console.error("addMembersToChat failed:", err);
      throw err;
    }
  }

  async removeMemberFromChat(chatId, userId) {
    try {
      const rec = await this.chatMembers
        .where("[chatId+userId]")
        .equals([chatId, userId])
        .first();
      if (rec) {
        await this.chatMembers.delete(rec.id);
        console.log("removeMemberFromChat: Removed member");
      }
    } catch (err) {
      console.error("removeMemberFromChat failed:", err);
      throw err;
    }
  }

  async getChatMembers(chatId) {
    try {
      const mems = await this.chatMembers.where("chatId").equals(chatId).toArray();
      return mems.map(m => m.userId);
    } catch (err) {
      console.error("getChatMembers failed:", err);
      return [];
    }
  }

  async getChatMembersWithDetails(chatId) {
    return this.transaction(
      "r",
      this.chatMembers,
      this.users,
      async () => {
        const mems = await this.chatMembers.where("chatId").equals(chatId).toArray();
        if (!mems.length) return {};
        const ids = [...new Set(mems.map(m => m.userId))];
        const users = await this.users.where("id").anyOf(ids).toArray();
        return users.reduce((acc, u) => {
          acc[u.id] = { username: u.username, profilePic: u.profilePic };
          return acc;
        }, {});
      }
    );
  }

  // Encryption Keys
  async saveKey(userId, key) {
    try {
      const now = new Date();
      const existing = await this.keys.get(userId);
      const version = existing ? existing.version + 1 : 1;
      const raw = await crypto.subtle.exportKey("raw", key);
      const aesKey = EncryptionUtils.arrayToBase64(new Uint8Array(raw));
      await this.keys.put({ userId, aesKey, createdAt: now, version });
      this._keyCache.set(userId, key);
    } catch (err) {
      console.error("saveKey failed:", err);
      throw err;
    }
  }

  async loadKey(userId) {
    const rec = await this.keys.get(userId);
    if (!rec) return null;
    try {
      const raw = EncryptionUtils.base64ToArray(rec.aesKey);
      const key = await crypto.subtle.importKey(
        "raw",
        raw,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );
      this._keyCache.set(userId, key);
      return key;
    } catch (err) {
      console.error("loadKey failed:", err);
      throw err;
    }
  }

  async deleteKey(userId) {
    await this.keys.delete(userId);
    this._keyCache.delete(userId);
  }

  // Message Helpers
  async updateMessage(clientMessageId, updates) {
    try {
      await this.messages.where("clientMessageId").equals(clientMessageId).modify(updates);
    } catch (err) {
      console.error("updateMessage failed:", err);
      throw err;
    }
  }

  async updateMessageStatus(messageId, status, timestamp = new Date()) {
    try {
      const upd = { status };
      if (status === "delivered") upd.deliveredAt = timestamp;
      if (status === "sent") upd.sentTime = timestamp;
      if (status === "failed") upd.failedAt = timestamp;
      await this.messages.where("id").equals(messageId).modify(upd);
    } catch (err) {
      console.error("updateMessageStatus failed:", err);
      throw err;
    }
  }

  async getMessageByClientId(clientMessageId) {
    try {
      return await this.messages.where("clientMessageId").equals(clientMessageId).first();
    } catch (err) {
      console.error("getMessageByClientId failed:", err);
      throw err;
    }
  }

  async getFailedMessages(chatId) {
    try {
      return await this.messages.where("chatId").equals(chatId)
        .and(m => m.status === "failed")
        .toArray();
    } catch (err) {
      console.error("getFailedMessages failed:", err);
      throw err;
    }
  }

    // Pending ECDH private keys
    async savePendingKey(userId, privateKey) {
      // store CryptoKey directly
      await this.pendingKeys.put({ userId, privateKey });
    }
  
    async loadPendingKey(userId) {
      const rec = await this.pendingKeys.get(userId);
      return rec ? rec.privateKey : null;
    }
  
    async deletePendingKey(userId) {
      await this.pendingKeys.delete( userId );
    }
}

const dexieDb = new ChatSecureDB();
export default dexieDb;
