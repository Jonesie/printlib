# docker

The actual Dockerfile and standalone docker-compose.yml live at the repo root
(same layout as this user's other home-hosted apps, e.g. `mirage`). See
[PLAN.md](../PLAN.md) for the deployment design. Production runs as a
`printlib` service inside `~/dev/home_nginx`'s docker-compose.yml, reachable
at `printlib.jonesie.home` via the shared nginx reverse proxy.
