use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

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
    if let Ok(dir) = std::env::var("PI_CODING_AGENT_DIR") {
        let dir = dir.trim();
        if !dir.is_empty() {
            return PathBuf::from(dir);
        }
    }

    for executable in omp_executable_candidates() {
        let mut command = Command::new(executable);
        command.args(["config", "path"]);
        #[cfg(windows)]
        command.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = command.output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path.is_empty() {
                    return PathBuf::from(path);
                }
            }
        }
    }

    let home = dirs::home_dir().expect("无法获取用户主目录");
    home.join(".omp").join("agent")
}

#[cfg(windows)]
fn omp_executable_candidates() -> [&'static str; 2] {
    ["omp", "omp.cmd"]
}

#[cfg(not(windows))]
fn omp_executable_candidates() -> [&'static str; 1] {
    ["omp"]
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

pub fn get_config_yml_path() -> PathBuf {
    get_omp_agent_dir().join("config.yml")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn omp_agent_dir_uses_pi_coding_agent_dir() {
        let temp = tempfile::tempdir().unwrap();
        let previous = std::env::var("PI_CODING_AGENT_DIR").ok();
        std::env::set_var("PI_CODING_AGENT_DIR", temp.path());

        assert_eq!(get_omp_agent_dir(), temp.path());

        if let Some(previous) = previous {
            std::env::set_var("PI_CODING_AGENT_DIR", previous);
        } else {
            std::env::remove_var("PI_CODING_AGENT_DIR");
        }
    }
}
