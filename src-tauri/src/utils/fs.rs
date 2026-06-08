use std::fs;
use std::io::Write;
use std::path::PathBuf;

pub fn atomic_write(path: &PathBuf, content: &str) -> std::io::Result<()> {
    let dir = path.parent().unwrap_or(std::path::Path::new("."));
    let mut temp = tempfile::NamedTempFile::new_in(dir)?;
    temp.write_all(content.as_bytes())?;
    temp.flush()?;
    temp.persist(path)?;
    Ok(())
}

pub fn ensure_dir(path: &PathBuf) -> std::io::Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}

pub fn get_omp_agent_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取用户主目录");
    home.join(".omp").join("agent")
}

pub fn get_switch_data_dir() -> PathBuf {
    dirs::data_local_dir()
        .expect("无法获取本地数据目录")
        .join("omp-switch")
}

pub fn get_db_path() -> PathBuf {
    get_switch_data_dir().join("omp-switch.db")
}

pub fn get_models_yaml_path() -> PathBuf {
    get_omp_agent_dir().join("models.yml")
}

pub fn get_settings_json_path() -> PathBuf {
    get_omp_agent_dir().join("settings.json")
}
