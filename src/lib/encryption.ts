/**
 * AES-256-GCM encryption for sensitive fields (portal_password).
 * Key is stored in PORTAL_ENCRYPTION_KEY env var (server-side only, NOT NEXT_PUBLIC_).
 * Encrypted values are stored as "ENC:iv:authTag:ciphertext" (all hex-encoded).
 * Plaintext values that don't start with "ENC:" are treated as legacy unencrypted
 * and returned as-is — they will be encrypted on the next save.
 */

const PREFIX = 'ENC:';

function getKey(): Buffer {
    const hex = process.env.PORTAL_ENCRYPTION_KEY;
    if (!hex || hex.length !== 64) {
        throw new Error('PORTAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return Buffer.from(hex, 'hex');
}

export function encryptPassword(plaintext: string): string {
    if (!plaintext) return plaintext;
    // Already encrypted — don't double-encrypt
    if (plaintext.startsWith(PREFIX)) return plaintext;

    const { createCipheriv, randomBytes } = require('crypto');
    const key = getKey();
    const iv = randomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptPassword(stored: string): string {
    if (!stored) return stored;
    // Legacy plaintext — return as-is, will be encrypted on next save
    if (!stored.startsWith(PREFIX)) return stored;

    const { createDecipheriv } = require('crypto');
    const key = getKey();
    const parts = stored.slice(PREFIX.length).split(':');
    if (parts.length !== 3) return stored; // malformed, return as-is

    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertext) + decipher.final('utf8');
}
