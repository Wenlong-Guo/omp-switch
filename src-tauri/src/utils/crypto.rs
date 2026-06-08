use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::Result;
use std::path::PathBuf;

const OLD_KEY: &[u8] = b"omp-switch-encryption-key-32bytes!";

fn get_key_path() -> PathBuf {
    crate::utils::fs::get_switch_data_dir().join(".enc-key")
}

fn get_or_create_key() -> Vec<u8> {
    let key_path = get_key_path();
    if let Ok(data) = std::fs::read(&key_path) {
        if data.len() == 32 {
            return data;
        }
    }
    let new_key: Vec<u8> = (0..32).map(|_| rand::random::<u8>()).collect();
    let _ = crate::utils::fs::ensure_dir(&key_path.parent().unwrap().to_path_buf());
    let _ = std::fs::write(&key_path, &new_key);
    new_key
}

fn get_key() -> Vec<u8> {
    get_or_create_key()
}

pub fn encrypt(plaintext: &str) -> Result<String> {
    let key = get_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
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

    let key = get_key();
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| anyhow::anyhow!("Failed to create cipher: {}", e))?;

    match cipher.decrypt(nonce, encrypted) {
        Ok(plaintext) => Ok(String::from_utf8(plaintext)
            .map_err(|e| anyhow::anyhow!("Invalid UTF-8: {}", e))?),
        Err(_) => {
            let old_cipher = Aes256Gcm::new_from_slice(OLD_KEY)
                .map_err(|e| anyhow::anyhow!("Failed to create old cipher: {}", e))?;
            let plaintext = old_cipher
                .decrypt(nonce, encrypted)
                .map_err(|e| anyhow::anyhow!("Decrypt failed: {:?}", e))?;
            let text = String::from_utf8(plaintext)
                .map_err(|e| anyhow::anyhow!("Invalid UTF-8: {}", e))?;
            let _ = encrypt(&text);
            Ok(text)
        }
    }
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
