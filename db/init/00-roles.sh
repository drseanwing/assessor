#!/bin/bash
# REdI Assessment System - PostgreSQL Roles for PostgREST
# This script runs as the superuser during container init.
# It dynamically reads the password from POSTGRES_PASSWORD environment variable.

set -e

# Ensure POSTGRES_PASSWORD is set
if [ -z "$POSTGRES_PASSWORD" ]; then
  echo "ERROR: POSTGRES_PASSWORD environment variable is not set"
  exit 1
fi

echo "Creating PostgREST roles..."

# Use psql -v to safely pass the password as a variable.
# The quoted heredoc delimiter ('EOSQL') prevents bash from expanding
# variables inside the heredoc body - only psql :'varname' syntax is used.
psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname "$POSTGRES_DB" \
     -v password="$POSTGRES_PASSWORD" <<-'EOSQL'
  -- web_anon: the role PostgREST switches to for unauthenticated requests.
  -- It has no login capability; PostgREST assumes this role after JWT validation.
  CREATE ROLE web_anon NOLOGIN;

  -- authenticator: the role PostgREST connects to PostgreSQL with.
  -- NOINHERIT means it must explicitly SET ROLE to web_anon after connecting.
  -- The password is safely injected via psql variable substitution.
  CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD :'password';
  GRANT web_anon TO authenticator;
EOSQL

echo "PostgREST roles created successfully."
