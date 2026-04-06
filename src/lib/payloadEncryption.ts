const KEY_SIZE_BYTES = 32;
const IV_SIZE_BYTES = 12;

export type EncryptedPayload = {
	iv: string;
	ciphertext: string;
};

function base64ToBytes(base64: string): Uint8Array {
	if (typeof atob !== "undefined") {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	const buffer = Buffer.from(base64, "base64");
	return new Uint8Array(
		buffer.buffer as unknown as ArrayBuffer,
		buffer.byteOffset,
		buffer.byteLength,
	);
}

function bytesToBase64(data: ArrayBuffer | Uint8Array): string {
	const bytes = new Uint8Array(data instanceof Uint8Array ? data : new Uint8Array(data));
	if (typeof btoa !== "undefined") {
		let binary = "";
		for (let i = 0; i < bytes.length; i += 1) {
			binary += String.fromCharCode(bytes[i]);
		}
		return btoa(binary);
	}
	return Buffer.from(bytes).toString("base64");
}

async function getSubtleCrypto(): Promise<SubtleCrypto> {
	if (import.meta.env.SSR) {
		const { webcrypto } = await import("node:crypto");
		return webcrypto.subtle as unknown as SubtleCrypto;
	}
	return crypto.subtle;
}

async function getRawKey(): Promise<Uint8Array> {
	if (import.meta.env.SSR) {
		const { env } = await import("process");
		const raw = env.AUTH_PAYLOAD_KEY?.trim();
		if (!raw) throw new Error("AUTH_PAYLOAD_KEY is not set in the server environment.");
		return base64ToBytes(raw);
	}

	const raw = import.meta.env.VITE_AUTH_PAYLOAD_KEY?.trim();
	if (!raw) throw new Error("VITE_AUTH_PAYLOAD_KEY is not set in the browser environment.");
	return base64ToBytes(raw);
}

async function importAesKey(rawKey: Uint8Array, usages: KeyUsage[]) {
	if (rawKey.byteLength !== KEY_SIZE_BYTES) {
		throw new Error(`Encryption key must be ${KEY_SIZE_BYTES} bytes long.`);
	}
	const subtle = await getSubtleCrypto();
	const keyBytes = new Uint8Array(
		rawKey.buffer as unknown as ArrayBuffer,
		rawKey.byteOffset,
		rawKey.byteLength,
	);
	return subtle.importKey("raw", keyBytes, "AES-GCM", false, usages);
}

export async function encryptPayload(payload: string): Promise<EncryptedPayload> {
	const rawKey = await getRawKey();
	const key = await importAesKey(rawKey, ["encrypt"]);
	const subtle = await getSubtleCrypto();
	const iv = new Uint8Array(IV_SIZE_BYTES);
	crypto.getRandomValues(iv);
	const encoded = new TextEncoder().encode(payload);
	const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, encoded as unknown as BufferSource);
	return {
		iv: bytesToBase64(iv),
		ciphertext: bytesToBase64(ciphertext),
	};
}

export async function decryptPayload(payload: EncryptedPayload): Promise<string> {
	if (!payload || typeof payload !== "object") {
		throw new Error("Invalid encrypted payload.");
	}
	const rawKey = await getRawKey();
	const key = await importAesKey(rawKey, ["decrypt"]);
	const subtle = await getSubtleCrypto();
	const iv = base64ToBytes(payload.iv);
	const ciphertext = base64ToBytes(payload.ciphertext);
	const decrypted = await subtle.decrypt(
		{ name: "AES-GCM", iv: iv as unknown as BufferSource },
		key,
		ciphertext as unknown as BufferSource,
	);
	return new TextDecoder().decode(decrypted);
}
