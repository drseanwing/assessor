#!/bin/bash
# Test script to validate docker-compose configuration

set -e

echo "==================================="
echo "Docker Compose Configuration Test"
echo "==================================="
echo ""

# Check if docker is available
echo "✓ Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker is not installed"
    exit 1
fi
echo "  Docker version: $(docker --version)"

# Check if docker compose is available
echo ""
echo "✓ Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo "✗ Docker Compose is not available"
    exit 1
fi
echo "  Docker Compose version: $(docker compose version)"

# Validate docker-compose.yml syntax
echo ""
echo "✓ Validating docker-compose.yml..."
if docker compose config > /dev/null 2>&1; then
    echo "  Configuration is valid"
else
    echo "✗ Configuration has errors"
    docker compose config
    exit 1
fi

# Check required files
echo ""
echo "✓ Checking required files..."
files=(
    "docker-compose.yml"
    ".env.example"
    "docker/kong.yml"
    "docker/init-roles.sql"
    "supabase/migrations/20260125_initial_schema.sql"
    "supabase/seed.sql"
    "Dockerfile"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (missing)"
        exit 1
    fi
done

# Check if .env exists
echo ""
echo "✓ Checking environment configuration..."
if [ -f ".env" ]; then
    echo "  ✓ .env file exists"
    
    # Validate required environment variables
    required_vars=(
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
        "ANON_KEY"
        "SERVICE_ROLE_KEY"
        "FRONTEND_PORT"
        "POSTGRES_PORT"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "  ✓ All required environment variables are present"
    else
        echo "  ✗ Missing environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "    - $var"
        done
        exit 1
    fi
else
    echo "  ! .env file not found (should be created from .env.example)"
    echo "    Run: cp .env.example .env"
fi

# Check port availability (optional)
echo ""
echo "✓ Checking port availability..."
ports=(7385 7386 7387 7388 7389)
unavailable_ports=()

for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        unavailable_ports+=("$port")
    fi
done

if [ ${#unavailable_ports[@]} -eq 0 ]; then
    echo "  ✓ All required ports (7385-7389) are available"
else
    echo "  ⚠ Some ports are already in use:"
    for port in "${unavailable_ports[@]}"; do
        echo "    - Port $port"
    done
    echo "  You may need to update port mappings in .env"
fi

# Summary
echo ""
echo "==================================="
echo "Test Summary"
echo "==================================="
echo "✓ Docker Compose configuration is valid"
echo "✓ All required files are present"
if [ -f ".env" ]; then
    echo "✓ Environment configuration is complete"
else
    echo "! Environment file needs to be created"
fi
echo ""
echo "To start the stack:"
echo "  docker compose up -d"
echo ""
echo "To view logs:"
echo "  docker compose logs -f"
echo ""
echo "To stop the stack:"
echo "  docker compose down"
echo ""
