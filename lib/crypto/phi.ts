/**
 * PHI Encryption Utilities
 * HIPAA-compliant AES-256-GCM encryption for Protected Health Information
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Derives a 32-byte key from the provided encryption key string
 */
function deriveKey(key: string): Buffer {
  if (!key) {
    throw new Error('Encryption key is required');
  }
  
  // If key is already 64 hex chars (32 bytes), use directly
  if (/^[0-9a-f]{64}$/i.test(key)) {
    return Buffer.from(key, 'hex');
  }
  
  // Otherwise, derive key using SHA-256
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypts PHI data using AES-256-GCM
 * @param plaintext - The data to encrypt
 * @param encryptionKey - The encryption key (64 hex chars or passphrase)
 * @returns Base64-encoded encrypted data with IV and auth tag
 */
export async function encryptPHI(
  plaintext: string,
  encryptionKey: string
): Promise<string> {
  if (!plaintext) {
    return '';
  }

  try {
    const key = deriveKey(encryptionKey);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all hex)
    const combined = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
    // Return as base64 for storage
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    throw new Error(
      `PHI encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypts PHI data using AES-256-GCM
 * @param encryptedData - Base64-encoded encrypted data
 * @param encryptionKey - The encryption key (64 hex chars or passphrase)
 * @returns Decrypted plaintext
 */
export async function decryptPHI(
  encryptedData: string,
  encryptionKey: string
): Promise<string> {
  if (!encryptedData) {
    return '';
  }

  try {
    const key = deriveKey(encryptionKey);
    
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64').toString('utf8');
    const parts = combined.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error('Missing encryption components');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(
      `PHI decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Encrypts PHI for storage in Supabase bytea field
 */
export async function encryptPHIForDB(
  plaintext: string,
  encryptionKey: string
): Promise<Buffer> {
  const encrypted = await encryptPHI(plaintext, encryptionKey);
  return Buffer.from(encrypted, 'base64');
}

/**
 * Decrypts PHI from Supabase bytea field
 */
export async function decryptPHIFromDB(
  encryptedBuffer: Buffer | null,
  encryptionKey: string
): Promise<string> {
  if (!encryptedBuffer) {
    return '';
  }
  
  const base64 = encryptedBuffer.toString('base64');
  return decryptPHI(base64, encryptionKey);
}

/**
 * Validates that an encryption key is properly formatted
 */
export function validateEncryptionKey(key: string): boolean {
  if (!key) {
    return false;
  }
  
  // Accept 64 hex chars or any string (will be hashed)
  return key.length >= 32;
}

