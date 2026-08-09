# MariaDB Persistence Foundation

The current Stage Player is a browser-only Vite application. It must not connect directly to MariaDB. The Compose stack provides a local `api` service between Studio and MariaDB.

## Start

```powershell
Copy-Item .env.db.example .env.db.local
docker compose -f docker/compose.yml --env-file .env.db.local up -d
docker compose -f docker/compose.yml --env-file .env.db.local ps
```

Docker Desktop shows the Compose project as `presenta-stage-3d`, with `presenta-stage-3d-web`, `presenta-stage-3d-api`, and `presenta-stage-3d-mariadb` containers. The Vite app is available at `http://localhost:5174`.

MariaDB is exposed on `localhost:3307` by default to avoid a typical local `3306` conflict. Credentials belong only in `.env.db.local`, which is ignored by Git.

To watch application logs:

```powershell
docker compose -f docker/compose.yml --env-file .env.db.local logs -f web
```

## Schema

- `presentations`: stable Package identity, title, lifecycle, and selected presented/published revisions.
- `presentation_revisions`: immutable Presentation Package JSON revisions and optional snapshot metadata.
- `presentation_publication_events`: append-only markers for the revision used at an event or published for viewing.

The initial schema is created only when the named `presenta-stage-3d-mariadb-data` volume is first initialized. To recreate it during local development, stop the service and explicitly remove that named volume before starting it again.

## Studio API

The Vite development server proxies `/api` to the local API container. Studio can list a saved Package, load its latest revision, and use **Save DB** to create a new immutable revision. The API rejects malformed Package v1 input and broken slide/speaker references before starting a database transaction.

This is local single-user persistence. It does not yet provide authentication, concurrent editing, deletion, revision browsing, or Archive publication URLs.
