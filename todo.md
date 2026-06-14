# TODO

- [ ] Review and update `scripts/quick-release.sh` so it requires `RELEASE_NOTES.md` and runs `node scripts/check-version.cjs <version> <previous-version>` before tagging.
- [ ] Review and update `scripts/build-release.ps1`; it still only updates `package.json` and `src-tauri/Cargo.toml`, not every version-owned file.
- [ ] Decide whether old planning docs under `docs/` should be archived or kept as active project documentation.
