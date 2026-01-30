#!/bin/bash
# REdI Assessment System - PostgreSQL Roles for PostgREST
# This script runs as the superuser during container init.

set -e

if [ -z "$POSTGRES_PASSWORD" ]; then
  echo "ERROR: POSTGRES_PASSWORD environment variable is not set"
  exit 1
fi

# Use separate passwords if provided, fall back to POSTGRES_PASSWORD
AUTHENTICATOR_PASSWORD="${DB_AUTHENTICATOR_PASSWORD:-$POSTGRES_PASSWORD}"
WORKER_PASSWORD="${DB_WORKER_PASSWORD:-$POSTGRES_PASSWORD}"

echo "Creating PostgREST roles..."

psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname "$POSTGRES_DB" \
     -v auth_password="$AUTHENTICATOR_PASSWORD" \
     -v worker_password="$WORKER_PASSWORD" <<-'EOSQL'
  -- web_anon: the role PostgREST switches to for unauthenticated requests.
  -- It has no login capability; PostgREST assumes this role after JWT validation.
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'web_anon') THEN
      CREATE ROLE web_anon NOLOGIN;
    END IF;
  END
  $$;

  -- authenticator: the role PostgREST connects to PostgreSQL with.
  -- NOINHERIT means it must explicitly SET ROLE to web_anon after connecting.
  -- The password is safely injected via psql variable substitution.
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
      CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD :'auth_password';
      GRANT web_anon TO authenticator;
    ELSE
      ALTER ROLE authenticator WITH PASSWORD :'auth_password';
    END IF;
  END
  $$;

  -- redi_worker: least-privilege role for the worker service.
  -- Has SELECT on all tables, INSERT/UPDATE on sync targets, no superuser access.
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'redi_worker') THEN
      CREATE ROLE redi_worker NOINHERIT LOGIN PASSWORD :'worker_password';
    ELSE
      ALTER ROLE redi_worker WITH PASSWORD :'worker_password';
    END IF;
  END
  $$;
EOSQL

echo "PostgREST roles created successfully."
