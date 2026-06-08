use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct FileWatcher {
    watcher: Option<Arc<Mutex<RecommendedWatcher>>>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self { watcher: None }
    }

    pub fn start<F>(&mut self, path: PathBuf, callback: F) -> Result<(), String>
    where
        F: Fn(Event) + Send + 'static,
    {
        let watcher = RecommendedWatcher::new(
            move |res: Result<Event, _>| {
                if let Ok(event) = res {
                    callback(event);
                }
            },
            Config::default(),
        )
        .map_err(|e| e.to_string())?;

        let mut watcher = watcher;
        watcher
            .watch(&path, RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;

        self.watcher = Some(Arc::new(Mutex::new(watcher)));
        Ok(())
    }
}
