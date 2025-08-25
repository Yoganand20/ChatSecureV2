import dexieDb from "@lib/dexieDb.js";

/**
 * AES-GCM Encryption & ECDH Key Exchange Utilities
 * Leverages Web Crypto API for secure, hardware-accelerated operations.
 */
export default class EncryptionUtils {
	static ivLength = 12; // bytes (96-bit IV)
	static _pendingKeyCache = new Map();

	// Upon first import/usage, load any pending keys from IndexedDB
	static async initPendingKeyCache() {
		const all = await dexieDb.pendingKeys.toArray();
		// [{ userId, privateKey }]
		for (const { userId, privateKey } of all) {
			this._pendingKeyCache.set(userId, privateKey);
		}
	}
	static async clearCachedPrivateKey(peerId) {
		this._pendingKeyCache.delete(peerId);
		await dexieDb.deletePendingKey(peerId);
	}

	static async loadCachedPrivateKey(peerId) {
		if (this._pendingKeyCache.has(peerId)) {
			return this._pendingKeyCache.get(peerId);
		}
		const pkcs8KeyBuffer = await dexieDb.loadPendingKey(peerId);
		if (!pkcs8KeyBuffer) return null;
		const privateKey = await crypto.subtle.importKey(
			"pkcs8",
			pkcs8KeyBuffer,
			{
				name: "ECDH",
				namedCurve: "P-256",
			},
			true,
			["deriveKey"]
		);
		this._pendingKeyCache.set(peerId, privateKey);
		return privateKey;
	}

	static async savePendingPrivateKey(peerId, privateKey) {
		// Store in in-memory cache
		this._pendingKeyCache.set(peerId, privateKey);

		// Export the CryptoKey to JWK for storage
		const pkcs8KeyBuffer = await crypto.subtle.exportKey("pkcs8", privateKey);

		// Save into IndexedDB
		await dexieDb.savePendingKey(peerId, pkcs8KeyBuffer);
	}
	/**
	 * Generate an ECDH P-256 key pair.
	 * @returns {Promise<{privateKey: CryptoKey, publicKeyRaw: Uint8Array}>}
	 */
	static async generateKeyPair() {
		try {
			const { publicKey, privateKey } = await crypto.subtle.generateKey(
				{ name: "ECDH", namedCurve: "P-256" },
				true,
				["deriveKey"]
			);
			const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", publicKey));
			return { privateKey, publicKeyRaw };
		} catch (err) {
			console.error("generateKeyPair failed:", err);
			throw new Error("ECDH key pair generation error");
		}
	}

	/**
	 * Derive a 256-bit AES-GCM key from ECDH private and peer public key.
	 * @param {CryptoKey} privateKey
	 * @param {Uint8Array} peerPublicKeyRaw
	 * @returns {Promise<CryptoKey>}
	 */
	static async deriveSharedKey(privateKey, peerPublicKeyRaw) {
		if (!privateKey || !peerPublicKeyRaw) {
			throw new Error("deriveSharedKey missing arguments");
		}
		try {
			const peerKey = await crypto.subtle.importKey(
				"raw",
				peerPublicKeyRaw,
				{ name: "ECDH", namedCurve: "P-256" },
				false,
				[]
			);
			return await crypto.subtle.deriveKey(
				{ name: "ECDH", public: peerKey },
				privateKey,
				{ name: "AES-GCM", length: 256 },
				true,
				["encrypt", "decrypt"]
			);
		} catch (err) {
			console.error("deriveSharedKey failed:", err);
			throw new Error("Shared key derivation error");
		}
	}

	/**
	 * Encrypt text using AES-GCM.
	 * @param {string} plaintext
	 * @param {CryptoKey} key
	 * @returns {Promise<{encryptedText: string, iv: string}>}
	 */
	static async encrypt(plaintext, key) {
		if (typeof plaintext !== "string" || !key) {
			throw new Error("encrypt missing arguments");
		}
		try {
			const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
			const ciphertext = await crypto.subtle.encrypt(
				{ name: "AES-GCM", iv },
				key,
				new TextEncoder().encode(plaintext)
			);
			return {
				encryptedText: this.arrayToBase64(new Uint8Array(ciphertext)),
				iv: this.arrayToBase64(iv),
			};
		} catch (err) {
			console.error("encrypt failed:", err);
			throw new Error("Encryption error");
		}
	}

	/**
	 * Decrypt AES-GCM ciphertext.
	 * @param {string} encryptedText - Base64
	 * @param {string} iv - Base64
	 * @param {CryptoKey} key
	 * @returns {Promise<string>}
	 */
	static async decrypt(encryptedText, iv, key) {
		if (!encryptedText || !iv || !key) {
			throw new Error("decrypt missing arguments");
		}
		try {
			const ivBytes = this.base64ToArray(iv);
			const data = this.base64ToArray(encryptedText);
			const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, data);
			return new TextDecoder().decode(decrypted);
		} catch (err) {
			console.error("decrypt failed:", err);
			throw new Error("Decryption error");
		}
	}

	/** Convert Uint8Array to Base64 string */
	static arrayToBase64(buffer) {
		return btoa(String.fromCharCode(...buffer));
	}

	/** Convert Base64 string to Uint8Array */
	static base64ToArray(base64) {
		return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
	}
}
