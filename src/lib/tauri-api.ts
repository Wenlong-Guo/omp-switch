import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { InvokeArgs } from "@tauri-apps/api/core";

export async function invokeCommand<T>(cmd: string, payload?: InvokeArgs): Promise<T> {
  try {
    return await invoke<T>(cmd, payload);
  } catch (error) {
    console.error(`IPC 调用失败 [${cmd}]:`, error);
    throw error;
  }
}

export function onConfigChanged(callback: () => void) {
  return listen("config:changed", callback);
}
