# hosting

Sample config for running PrintLib behind your own reverse proxy on the
public internet, rather than just locally. Not required for local/LAN-only
use — the root `docker-compose.yml` is enough for that.

## nginx-printlib.conf.example

A vhost for nginx: HTTP→HTTPS redirect, TLS, and a proxy to the container.
Fill in your domain and cert paths. Two ways to reach the container:

- **Published port**: run PrintLib with the root `docker-compose.yml`
  as-is (publishes `8000` on the host) and point the upstream at
  `127.0.0.1:8000`.
- **Shared Docker network**: if you're adding PrintLib as a service inside
  a bigger compose stack that already runs your reverse proxy, put both on
  the same network and point the upstream at the container's name and
  port instead (no host port needs publishing).

Get a TLS cert however you already do — certbot, acme.sh, your proxy's
built-in ACME support, etc. That part's outside this example since it
depends entirely on your existing setup.

### Restricting login to your LAN

If PrintLib is reachable from the public internet, the `/api/login`
endpoint is the one thing worth locking down further than just the
password — the config includes an optional block that restricts it to
your own LAN/VPN subnet at the nginx level, so login attempts from
anywhere else get a 403 before they ever reach the app. Browsing, viewing,
and downloading are unaffected for everyone; this only gates login itself.
Swap in your actual LAN subnet (`ip route` on the host will show it).

Using Caddy, Traefik, or something else? The same idea applies — restrict
the login route to your LAN/VPN CIDR at the proxy level, however your
proxy of choice expresses that (Caddy: `@lan remote_ip 192.168.1.0/24` +
`respond @lan.not 403` on that route; Traefik: an IPAllowList middleware
on the login router).
