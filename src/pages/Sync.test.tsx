import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sync from "./Sync";

const mockSyncStore = {
  config: {
    enabled: true,
    serverUrl: "https://dav.example.com",
    username: "user",
    password: "pass",
    remotePath: "/omp-switch.db",
    lastSyncAt: "2025-01-01T00:00:00Z",
    lastSyncStatus: "success" as const,
  },
  isSyncing: false,
  fetchConfig: vi.fn(),
  saveConfig: vi.fn(),
  testConnection: vi.fn(),
  triggerSync: vi.fn(),
};

vi.mock("@/stores/syncStore", () => ({
  useSyncStore: vi.fn(() => mockSyncStore),
}));

import { useSyncStore } from "@/stores/syncStore";
const store = useSyncStore();
const mockTest = store.testConnection;

describe("Sync", () => {
  it("renders sync title", () => {
    render(<Sync />);
    expect(screen.getByText("WebDAV 同步")).toBeInTheDocument();
  });

  it("shows server url input", () => {
    render(<Sync />);
    expect(screen.getByDisplayValue("https://dav.example.com")).toBeInTheDocument();
  });

  it("shows username input", () => {
    render(<Sync />);
    expect(screen.getByDisplayValue("user")).toBeInTheDocument();
  });

  it("shows password input", () => {
    render(<Sync />);
    const passwordInputs = screen.getAllByDisplayValue("pass");
    expect(passwordInputs.length).toBeGreaterThan(0);
  });

  it("shows remote path input", () => {
    render(<Sync />);
    expect(screen.getByDisplayValue("/omp-switch.db")).toBeInTheDocument();
  });

  it("has test connection button", () => {
    render(<Sync />);
    expect(screen.getByText("测试连接")).toBeInTheDocument();
  });

  it("has save config button", () => {
    render(<Sync />);
    expect(screen.getByText("保存配置")).toBeInTheDocument();
  });

  it("has upload and download buttons", () => {
    render(<Sync />);
    expect(screen.getByText("上传")).toBeInTheDocument();
    expect(screen.getByText("下载")).toBeInTheDocument();
  });

  it("calls test connection on click", () => {
    render(<Sync />);
    fireEvent.click(screen.getByText("测试连接"));
    expect(mockTest).toHaveBeenCalled();
  });

  it("shows last sync info", () => {
    render(<Sync />);
    expect(screen.getByText(/最后同步:/)).toBeInTheDocument();
  });

  it("shows test connection failure result", async () => {
    vi.mocked(mockTest).mockResolvedValueOnce(false);
    render(<Sync />);
    fireEvent.click(screen.getByText("测试连接"));
    await vi.waitFor(() => expect(screen.getByText("连接失败")).toBeInTheDocument());
  });

  it("shows password placeholder hint when password is masked", () => {
    const maskedStore = {
      config: { enabled: true, serverUrl: "", username: "", password: "***", remotePath: "/" },
      isSyncing: false,
      fetchConfig: vi.fn(),
      saveConfig: vi.fn(),
      testConnection: vi.fn(),
      triggerSync: vi.fn(),
    };
    vi.mocked(useSyncStore).mockReturnValue(maskedStore as any);
    render(<Sync />);
    expect(screen.getByText(/密码已加密保存/)).toBeInTheDocument();
  });

  it("calls upload sync", async () => {
    const trigger = vi.fn().mockResolvedValue({ success: true, message: "Uploaded" });
    const fetchConfig = vi.fn();
    vi.mocked(useSyncStore).mockReturnValue({
      ...mockSyncStore,
      triggerSync: trigger,
      fetchConfig,
    } as any);
    render(<Sync />);
    fireEvent.click(screen.getByText("上传"));
    await vi.waitFor(() => expect(trigger).toHaveBeenCalledWith("upload"));
  });

  it("calls download sync", async () => {
    const trigger = vi.fn().mockResolvedValue({ success: true, message: "Downloaded" });
    const fetchConfig = vi.fn();
    vi.mocked(useSyncStore).mockReturnValue({
      ...mockSyncStore,
      triggerSync: trigger,
      fetchConfig,
    } as any);
    render(<Sync />);
    fireEvent.click(screen.getByText("下载"));
    await vi.waitFor(() => expect(trigger).toHaveBeenCalledWith("download"));
  });

  it("saves config on click", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useSyncStore).mockReturnValue({
      ...mockSyncStore,
      saveConfig: save,
    } as any);
    render(<Sync />);
    fireEvent.click(screen.getByText("保存配置"));
    await vi.waitFor(() => expect(save).toHaveBeenCalled());
  });

  it("changes password input", () => {
    render(<Sync />);
    const passwordInput = screen.getAllByDisplayValue("pass")[0];
    fireEvent.change(passwordInput, { target: { value: "newpass" } });
    expect(passwordInput).toHaveValue("newpass");
  });

  it("toggles enabled checkbox", () => {
    render(<Sync />);
    const checkbox = screen.getByLabelText("启用同步");
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
