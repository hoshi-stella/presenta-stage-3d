# MariaDB Persistence Foundation

The current Stage Player is a browser-only Vite application. It must not connect directly to MariaDB. This Compose service provides a persistent local database for a future Studio API.

## Start

```powershell
Copy-Item .env.db.example .env.db.local
docker compose -f docker/compose.yml --env-file .env.db.local up -d
docker compose -f docker/compose.yml --env-file .env.db.local ps
```

Docker Desktop shows the Compose project as `presenta-stage-3d`, with `presenta-stage-3d-web` and `presenta-stage-3d-mariadb` containers. The Vite app is available at `http://localhost:5174`.

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

## Next Step

Add a local Studio API service that validates Presentation Package v1 input, writes a new revision transactionally, and reads selected revisions for Stage Player or Archive views. Keep the browser client behind that API boundary.
