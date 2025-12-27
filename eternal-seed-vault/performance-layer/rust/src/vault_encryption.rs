/**
 * Purpose: Performance Layer - Rust encryption and compression for Eternal Seed Vault
 * Dependencies: aes-gcm, zstd, rayon
 * Module Role: High-speed encryption and compression using GPU-accelerated algorithms
 */

use aes_gcm::{
    aead::{Aead, KeyInit, AeadInPlace},
    Aes256Gcm, Nonce
};
use std::io::{Read, Write};
use std::sync::Arc;

/// Vault encryption manager
pub struct VaultEncryption {
    cipher: Arc<Aes256Gcm>,
}

impl VaultEncryption {
    /// Create new encryption instance with key
    pub fn new(key: &[u8; 32]) -> Self {
        let cipher = Arc::new(Aes256Gcm::new(key.into()));
        Self { cipher }
    }

    /// Encrypt vault data
    pub fn encrypt(&self, plaintext: &[u8], nonce: &[u8; 12]) -> Result<Vec<u8>, String> {
        let nonce = Nonce::from_slice(nonce);
        self.cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| format!("Encryption failed: {}", e))
    }

    /// Decrypt vault data
    pub fn decrypt(&self, ciphertext: &[u8], nonce: &[u8; 12]) -> Result<Vec<u8>, String> {
        let nonce = Nonce::from_slice(nonce);
        self.cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {}", e))
    }
}

/// Vault compression manager
pub struct VaultCompression;

impl VaultCompression {
    /// Compress vault data using zstd
    pub fn compress(data: &[u8], level: i32) -> Result<Vec<u8>, String> {
        zstd::encode_all(data, level)
            .map_err(|e| format!("Compression failed: {}", e))
    }

    /// Decompress vault data
    pub fn decompress(data: &[u8]) -> Result<Vec<u8>, String> {
        zstd::decode_all(data)
            .map_err(|e| format!("Decompression failed: {}", e))
    }
}

/// Combined encryption and compression for vault entries
pub struct VaultProcessor {
    encryption: VaultEncryption,
}

impl VaultProcessor {
    pub fn new(key: &[u8; 32]) -> Self {
        Self {
            encryption: VaultEncryption::new(key),
        }
    }

    /// Process vault entry: compress then encrypt
    pub fn process_entry(&self, data: &[u8], nonce: &[u8; 12]) -> Result<Vec<u8>, String> {
        // Compress first
        let compressed = VaultCompression::compress(data, 3)?;
        
        // Then encrypt
        self.encryption.encrypt(&compressed, nonce)
    }

    /// Restore vault entry: decrypt then decompress
    pub fn restore_entry(&self, encrypted: &[u8], nonce: &[u8; 12]) -> Result<Vec<u8>, String> {
        // Decrypt first
        let decrypted = self.encryption.decrypt(encrypted, nonce)?;
        
        // Then decompress
        VaultCompression::decompress(&decrypted)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let key = [0u8; 32];
        let encryption = VaultEncryption::new(&key);
        let nonce = [0u8; 12];
        let plaintext = b"Hello, Eternal Seed Vault!";

        let ciphertext = encryption.encrypt(plaintext, &nonce).unwrap();
        let decrypted = encryption.decrypt(&ciphertext, &nonce).unwrap();

        assert_eq!(plaintext, decrypted.as_slice());
    }

    #[test]
    fn test_compression_decompression() {
        let data = b"Test data for compression";
        let compressed = VaultCompression::compress(data, 3).unwrap();
        let decompressed = VaultCompression::decompress(&compressed).unwrap();

        assert_eq!(data, decompressed.as_slice());
    }
}

