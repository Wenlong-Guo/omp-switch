import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sync from "./Sync";

vi.mock("@/stores/syncStore", () => {
  const store = {
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
  return {
    useSyncStore: () => store,
  };
});

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
});
