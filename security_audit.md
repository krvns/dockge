# Dockge Security Audit Report

### 1. Executive Verdict: `[HIGH RISK]`
The application relies on mounting the host's `/var/run/docker.sock` while executing its NodeJS backend as the `root` user inside the container. While this architecture is typical for a Docker compose management tool, any authentication bypass, command injection, or prototype pollution in the web interface will result in immediate, trivial full host compromise.

### 2. Network Egress Inventory
* **Zero Egress (Fully Offline):** All outbound network requests (including the update check ping in `backend/check-version.ts`) have been disabled.
* **Zero Malicious Egress:** No tracking analytics, telemetry, crash reporting, or credential exfiltration pings exist in the codebase.

### 3. High-Severity Findings Table

| Severity (Crit / High / Med) | Audit Vector | File & Line | Code Snippet / Mechanism | Exploitation / Risk Analysis |
| --- | --- | --- | --- | --- |
| **Crit** | Privilege Escalation & Container Sandboxing | `compose.yaml:9`<br>`docker/Dockerfile:1` | `- /var/run/docker.sock:/var/run/docker.sock`<br>*(No `USER` directive specified in Dockerfile)* | The application runs as root and has direct access to the Docker socket. An attacker compromising the Node app can spawn a `privileged: true` container, mount `/` from the host, and achieve full bare-metal host takeover. |
| **High** | Privilege Escalation & Container Sandboxing | `backend/terminal.ts:286` | `shell = "bash" \| "powershell.exe"` | The application deliberately exposes an interactive web terminal to the host. If the application's authentication layer is bypassed, attackers gain instant RCE. |
| **Med** | Dynamic Code Execution | `backend/terminal.ts:115` | `pty.spawn(this.file, this.args, {...})` | Uses `node-pty` to spawn subprocesses. While arguments are passed as arrays (avoiding trivial shell injection), improper sanitization of terminal inputs in the web UI could still lead to escaped execution depending on the shell environment. |

### 4. Filesystem & System Footprint
* **Host Mounts:** Binds `/var/run/docker.sock` to control the host's Docker daemon.
* **Volume Mounts:** Binds `./data` for SQLite database (`dockge.db`) and user data persistence.
* **Directory Writes:** Reads, writes, and provisions directories dynamically in `/opt/stacks` (configurable via `DOCKGE_STACKS_DIR`). Reads and modifies `global.env` and individual `.env` files within these stack paths.
* **Subprocesses:** Spawns `docker` and `docker compose` binaries to manage stack lifecycles. Also spawns `bash` or `pwsh.exe` when the interactive terminal is invoked.

### 5. Runtime Isolation Prescription
To run this project with maximum safety without breaking its core functionality:
1. **Rootless Docker / Podman:** Switch the host environment to Rootless Docker or Podman. Bind the user-level socket (e.g., `$XDG_RUNTIME_DIR/docker.sock`) instead of the system-level socket.
2. **Drop Privileges:** Modify the `Dockerfile` to add `USER node`. Adjust socket permissions on the host so the `node` user's GUID can read/write the socket without requiring `root` inside the container.
3. **Capabilities:** Run the container with `--cap-drop=ALL`. The container only needs socket access, not inherent Linux capabilities.
4. **Network & Auth:** Do **not** expose port `5001` directly to the internet. Bind it to `127.0.0.1` and place it behind a reverse proxy (e.g., Nginx/Caddy) with strict network ACLs and a robust secondary authentication provider (like Authelia, Authentik, or Cloudflare Zero Trust) to protect the web terminal.
