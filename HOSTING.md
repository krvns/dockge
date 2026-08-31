# Secure Hosting Guide for Dockge

This document outlines security best practices and hardening recommendations for deploying and hosting Dockge in a production environment.

---

## 1. Container Hardening & Linux Capabilities

By default, Docker containers inherit a set of default Linux capabilities. Because Dockge only requires access to the Docker daemon socket (`/var/run/docker.sock`), it does not require additional kernel capabilities.

* **Capability Drop:** Explicitly drop all Linux capabilities using `cap_drop: [ ALL ]` in Docker Compose or `--cap-drop=ALL` via CLI.
* **Prevent Privilege Escalation:** Enable `no-new-privileges:true` to prevent container processes from gaining additional privileges.

### Hardened Docker Compose Example
```yaml
services:
  dockge:
    # Use the pre-built image or build locally
    image: ${DOCKGE_IMAGE:-louislam/dockge:1}
    restart: unless-stopped
    ports:
      # Bind to localhost to prevent direct internet exposure
      - "${DOCKGE_HOST_PORT:-127.0.0.1:5001}:${DOCKGE_PORT:-5001}"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ${DOCKGE_DATA_DIR:-./data}:/app/data
      - ${DOCKGE_STACKS_BIND:-/opt/stacks}:${DOCKGE_STACKS_BIND:-/opt/stacks}
    environment:
      DOCKGE_PORT: ${DOCKGE_PORT:-5001}
      DOCKGE_DATA_DIR: /app/data
      DOCKGE_STACKS_DIR: ${DOCKGE_STACKS_BIND:-/opt/stacks}
    # Drop all Linux capabilities
    cap_drop:
      - ALL
    # Prevent privilege escalation
    security_opt:
      - no-new-privileges:true
```

---

## 2. Docker Socket Security & Isolation

Mounting `/var/run/docker.sock` grants container processes full control over the host Docker daemon. To minimize risk:

* **Rootless Docker / Podman:** Deploy Dockge under a Rootless Docker or Podman setup whenever possible. This ensures that even if an attacker compromises the container, they only obtain unprivileged user permissions on the host rather than host root.
* **Socket Proxy (Optional):** Consider placing a read-only Docker socket proxy (such as `tecnativa/docker-socket-proxy`) between Dockge and the Docker daemon to limit allowed API routes if full container lifecycle control is not required.

---

## 3. Network Isolation & Access Control

Dockge includes an interactive web terminal. Exposing port `5001` directly to the public internet poses a severe risk if authentication is bypassed.

* **Bind to Loopback Only:** Always map the host port to `127.0.0.1:5001` (e.g., `- 127.0.0.1:5001:5001`). Do not expose `0.0.0.0:5001`.
* **Use a Reverse Proxy with TLS:** Route traffic through a reverse proxy (Caddy, Nginx, Traefik, or NPM) to enforce HTTPS encryption.
* **Secondary Authentication:** Add an identity provider or authentication layer (e.g., Authelia, Authentik, Cloudflare Zero Trust / Access, or HTTP Basic Auth) in front of Dockge.

---

## 4. Filesystem & Stack Path Permissions

* **Dedicated Stacks Directory:** Restrict permissions on `/opt/stacks` (or your configured `DOCKGE_STACKS_DIR`) so only the Docker daemon/specified user can manage stack files.
* **Database Protection:** Ensure host directory permissions for `./data` prevent unauthorized local user access to `dockge.db`.

---

## 5. Security Checklist Before Launch

- [ ] Docker container is configured with `cap_drop: [ ALL ]`.
- [ ] Container security opt `no-new-privileges:true` is active.
- [ ] Port `5001` is bound exclusively to `127.0.0.1`.
- [ ] Reverse proxy is enforcing HTTPS with a valid TLS certificate.
- [ ] Additional SSO / Access control gateway protects the web console.
- [ ] Automated updates or version checking overhead is reviewed per organizational policies.
