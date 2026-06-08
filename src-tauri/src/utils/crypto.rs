use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::Result;

const KEY: &[u8] = b"omp-switch-encryption-key-32bytes!";

pub fn encrypt(plaintext: &str) -> Result<String> {
    let cipher = Aes256Gcm::new_from_slice(KEY)
        .map_err(|e| anyhow::anyhow!("Failed to create cipher: {}", e))?;
    let nonce = Aes256Gcm::generate_nonce(&mut aes_gcm::aead::OsRng);
    let ciphertext = cipher
        .encrypt(&nonce, plaintext.as_bytes())
        .map_err(|e| anyhow::anyhow!("Encrypt failed: {:?}", e))?;

    let mut result = nonce.to_vec();
    result.extend_from_slice(&ciphertext);
    Ok(base64::encode(&result))
}

pub fn decrypt(ciphertext: &str) -> Result<String> {
    let data = base64::decode(ciphertext)
        .map_err(|e| anyhow::anyhow!("Invalid base64: {}", e))?;
    if data.len() < 12 {
        anyhow::bail!("Ciphertext too short");
    }

    let (nonce_bytes, encrypted) = data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    let cipher = Aes256Gcm::new_from_slice(KEY)
        .map_err(|e| anyhow::anyhow!("Failed to create cipher: {}", e))?;

    let plaintext = cipher
        .decrypt(nonce, encrypted)
        .map_err(|e| anyhow::anyhow!("Decrypt failed: {:?}", e))?;

    Ok(String::from_utf8(plaintext)
        .map_err(|e| anyhow::anyhow!("Invalid UTF-8: {}", e))?)
}

// Simple base64 module for internal use
mod base64 {
    pub fn encode(data: &[u8]) -> String {
        use base64::{engine::general_purpose::STANDARD, Engine};
        STANDARD.encode(data)
    }

    pub fn decode(s: &str) -> Result<Vec<u8>, base64::DecodeError> {
        use base64::{engine::general_purpose::STANDARD, Engine};
        STANDARD.decode(s)
    }
}
