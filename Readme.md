## DB connection troubleshooting (Docker)

### 1) Check DB password inside `app` container

Если не заработает

```bash
docker compose exec app sh -lc 'printf "DB_PASSWORD=<%s>\n" "$DB_PASSWORD"; env | egrep "DB_USER|DB_PASSWORD|DB_HOST|DB_PORT|DB_NAME|NODE_ENV"'

docker compose exec app sh -lc 'printf "%s" "$DB_PASSWORD" | od -An -t x1'

docker compose exec app sh -lc 'apk add --no-cache postgresql-client >/dev/null 2>&1 || true; PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "select 1;"'

docker compose exec db sh -lc 'apk add --no-cache postgresql-client >/dev/null 2>&1 || true; PGPASSWORD=00000000 psql -h 127.0.0.1 -U postgres -d vehicle_registration -c "select 1;"'

docker compose exec db sh -lc 'psql -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD '\''00000000'\'';"'

docker compose exec app sh -lc 'apk add --no-cache postgresql-client >/dev/null 2>&1 || true; PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "select 1;"'
docker compose restart app

.env

PORT=3001
DB_NAME=vehicle_registration
DB_USER=postgres
DB_PASSWORD=00000000
DB_HOST=db
DB_PORT=5432
SECRET_KEY=d0a9d3cc8347615464a062deb740589ae8e2efb8ed3af3ea3a3aba97cda41b07
SALT_ROUNDS=10
NODE_ENV=development