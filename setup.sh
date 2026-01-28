#!/bin/bash
# ============================================================================
# REdI Assessment System - Unattended Setup Script
# ============================================================================
#
# This script automates the setup process for the REdI Assessment System.
# It checks for dependencies, configures the PostgreSQL database, and sets up
# the frontend application.
#
# Usage:
#   ./setup.sh [options]
#
# Options:
#   --help              Show this help message
#   --skip-db           Skip database setup
#   --skip-frontend     Skip frontend setup
#   --db-name NAME      Database name (default: redi_assessment)
#   --db-user USER      Database user (default: postgres)
#   --db-host HOST      Database host (default: localhost)
#   --db-port PORT      Database port (default: 5432)
#   --supabase-url URL  Supabase URL for cloud setup
#   --supabase-key KEY  Supabase anon key for cloud setup
#   --quiet             Reduce output verbosity
#   --yes               Auto-confirm prompts (unattended mode)
#
# Exit codes:
#   0  - Success
#   1  - General error
#   2  - Dependency error
#   3  - Database error
#   4  - Frontend error
#   5  - Configuration error
#
# ============================================================================

set -o pipefail

# ============================================================================
# Configuration
# ============================================================================

# Script version
SCRIPT_VERSION="1.0.0"

# Default configuration
DB_NAME="${DB_NAME:-redi_assessment}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
SUPABASE_URL=""
SUPABASE_KEY=""
SKIP_DB=false
SKIP_FRONTEND=false
QUIET=false
AUTO_CONFIRM=false

# Minimum required versions
MIN_NODE_VERSION="20.0.0"
MIN_NPM_VERSION="8.0.0"
MIN_POSTGRES_VERSION="14.0"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/frontend"
SUPABASE_DIR="${SCRIPT_DIR}/supabase"
LOG_FILE="${SCRIPT_DIR}/setup.log"
ENV_FILE="${FRONTEND_DIR}/.env"

# Colors for output
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m' # No Color
    BOLD='\033[1m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    CYAN=''
    NC=''
    BOLD=''
fi

# ============================================================================
# Logging Functions
# ============================================================================

# Initialize log file with header
init_log() {
    {
        echo "============================================================================"
        echo "REdI Assessment System - Setup Log"
        echo "Started at: $(date '+%Y-%m-%d %H:%M:%S %Z')"
        echo "Script version: $SCRIPT_VERSION"
        echo "============================================================================"
        echo ""
    } > "$LOG_FILE"
}

# Log message to file with timestamp
log_to_file() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" >> "$LOG_FILE"
}

# Print info message
log_info() {
    local message="$1"
    log_to_file "INFO" "$message"
    if [[ "$QUIET" != true ]]; then
        echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') - $message"
    fi
}

# Print success message
log_success() {
    local message="$1"
    log_to_file "SUCCESS" "$message"
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%H:%M:%S') - $message"
}

# Print warning message
log_warn() {
    local message="$1"
    log_to_file "WARN" "$message"
    echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') - $message"
}

# Print error message
log_error() {
    local message="$1"
    log_to_file "ERROR" "$message"
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $message" >&2
}

# Print step header
log_step() {
    local step="$1"
    local description="$2"
    log_to_file "STEP" "Step $step: $description"
    echo ""
    echo -e "${BOLD}${CYAN}========================================${NC}"
    echo -e "${BOLD}${CYAN}  Step $step: $description${NC}"
    echo -e "${BOLD}${CYAN}========================================${NC}"
}

# Print debug message (only to log file)
log_debug() {
    local message="$1"
    log_to_file "DEBUG" "$message"
}

# ============================================================================
# Error Handling Functions
# ============================================================================

# Error handler for trap
handle_error() {
    local line_no="$1"
    local error_code="$2"
    local command="$3"
    
    log_error "Error occurred at line $line_no"
    log_error "Command: $command"
    log_error "Exit code: $error_code"
    log_to_file "ERROR" "Stack trace: ${FUNCNAME[*]}"
    
    echo ""
    echo -e "${RED}============================================================================${NC}"
    echo -e "${RED}  Setup failed! Check the log file for details:${NC}"
    echo -e "${RED}  ${LOG_FILE}${NC}"
    echo -e "${RED}============================================================================${NC}"
    
    exit "$error_code"
}

# Exit with error message
exit_error() {
    local message="$1"
    local code="${2:-1}"
    log_error "$message"
    log_to_file "FATAL" "Exiting with code $code: $message"
    exit "$code"
}

# Cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        log_to_file "INFO" "Setup completed successfully"
    else
        log_to_file "INFO" "Setup ended with exit code $exit_code"
    fi
    log_to_file "INFO" "Setup log saved to: $LOG_FILE"
}

# Set up traps for error handling
trap 'handle_error ${LINENO} $? "$BASH_COMMAND"' ERR
trap cleanup EXIT

# ============================================================================
# Utility Functions
# ============================================================================

# Show help message
show_help() {
    cat << EOF
REdI Assessment System - Unattended Setup Script v${SCRIPT_VERSION}

Usage:
  ./setup.sh [options]

Options:
  --help              Show this help message
  --skip-db           Skip database setup
  --skip-frontend     Skip frontend setup
  --db-name NAME      Database name (default: redi_assessment)
  --db-user USER      Database user (default: postgres)
  --db-host HOST      Database host (default: localhost)
  --db-port PORT      Database port (default: 5432)
  --supabase-url URL  Supabase URL for cloud setup
  --supabase-key KEY  Supabase anon key for cloud setup
  --quiet             Reduce output verbosity
  --yes               Auto-confirm prompts (unattended mode)

Examples:
  # Interactive setup with defaults
  ./setup.sh

  # Unattended setup with Supabase
  ./setup.sh --yes --skip-db --supabase-url 'https://xxx.supabase.co' --supabase-key 'xxx'

  # Self-hosted PostgreSQL setup
  ./setup.sh --yes --db-name mydb --db-user myuser

Environment Variables:
  DB_NAME             Database name
  DB_USER             Database user
  DB_HOST             Database host
  DB_PORT             Database port
  PGPASSWORD          PostgreSQL password (⚠️ SECURITY WARNING: Use only for
                      local development. In production, use .pgpass or other
                      secure credential management.)
  SUPABASE_URL        Supabase project URL
  SUPABASE_KEY        Supabase anon key

For more information, see the documentation at:
  https://github.com/drseanwing/assessor

EOF
    exit 0
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help)
                show_help
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --skip-frontend)
                SKIP_FRONTEND=true
                shift
                ;;
            --db-name)
                DB_NAME="$2"
                shift 2
                ;;
            --db-user)
                DB_USER="$2"
                shift 2
                ;;
            --db-host)
                DB_HOST="$2"
                shift 2
                ;;
            --db-port)
                DB_PORT="$2"
                shift 2
                ;;
            --supabase-url)
                SUPABASE_URL="$2"
                shift 2
                ;;
            --supabase-key)
                SUPABASE_KEY="$2"
                shift 2
                ;;
            --quiet)
                QUIET=true
                shift
                ;;
            --yes)
                AUTO_CONFIRM=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Compare semantic versions
# Returns: 0 if v1 >= v2, 1 otherwise
version_gte() {
    local v1="$1"
    local v2="$2"
    
    # Extract major.minor.patch
    local v1_major v1_minor v1_patch
    local v2_major v2_minor v2_patch
    
    IFS='.' read -r v1_major v1_minor v1_patch <<< "${v1%%[^0-9.]*}"
    IFS='.' read -r v2_major v2_minor v2_patch <<< "${v2%%[^0-9.]*}"
    
    # Default missing components to 0
    v1_major="${v1_major:-0}"
    v1_minor="${v1_minor:-0}"
    v1_patch="${v1_patch:-0}"
    v2_major="${v2_major:-0}"
    v2_minor="${v2_minor:-0}"
    v2_patch="${v2_patch:-0}"
    
    if [[ "$v1_major" -gt "$v2_major" ]]; then
        return 0
    elif [[ "$v1_major" -lt "$v2_major" ]]; then
        return 1
    fi
    
    if [[ "$v1_minor" -gt "$v2_minor" ]]; then
        return 0
    elif [[ "$v1_minor" -lt "$v2_minor" ]]; then
        return 1
    fi
    
    if [[ "$v1_patch" -ge "$v2_patch" ]]; then
        return 0
    fi
    
    return 1
}

# Prompt for confirmation
confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [[ "$AUTO_CONFIRM" == true ]]; then
        log_debug "Auto-confirming: $message"
        return 0
    fi
    
    local prompt
    if [[ "$default" == "y" ]]; then
        prompt="[Y/n]"
    else
        prompt="[y/N]"
    fi
    
    echo -n -e "${YELLOW}$message $prompt: ${NC}"
    read -r response
    
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        [nN][oO]|[nN])
            return 1
            ;;
        "")
            if [[ "$default" == "y" ]]; then
                return 0
            else
                return 1
            fi
            ;;
        *)
            return 1
            ;;
    esac
}

# Prompt for input with default value
# Uses indirect variable assignment to avoid eval security risks
prompt_input() {
    local message="$1"
    local default="$2"
    local var_name="$3"
    
    # Validate var_name contains only valid variable characters
    if [[ ! "$var_name" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
        log_error "Invalid variable name in prompt_input: $var_name"
        return 1
    fi
    
    if [[ "$AUTO_CONFIRM" == true ]]; then
        log_debug "Auto-using default for $var_name: $default"
        printf -v "$var_name" '%s' "$default"
        return
    fi
    
    echo -n -e "${CYAN}$message [$default]: ${NC}"
    read -r response
    
    if [[ -z "$response" ]]; then
        printf -v "$var_name" '%s' "$default"
    else
        printf -v "$var_name" '%s' "$response"
    fi
}

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# ============================================================================
# Dependency Check Functions
# ============================================================================

# Check Node.js installation
check_nodejs() {
    log_info "Checking Node.js installation..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js ${MIN_NODE_VERSION}+ from https://nodejs.org/"
        log_info "Or use a version manager like nvm: https://github.com/nvm-sh/nvm"
        return 1
    fi
    
    local node_version
    node_version=$(node --version | sed 's/v//')
    log_debug "Found Node.js version: $node_version"
    
    if ! version_gte "$node_version" "$MIN_NODE_VERSION"; then
        log_error "Node.js version $node_version is below minimum required version $MIN_NODE_VERSION"
        log_info "Please upgrade Node.js to version ${MIN_NODE_VERSION} or higher"
        return 1
    fi
    
    log_success "Node.js $node_version is installed (minimum: $MIN_NODE_VERSION)"
    return 0
}

# Check npm installation
check_npm() {
    log_info "Checking npm installation..."
    
    if ! command_exists npm; then
        log_error "npm is not installed"
        log_info "npm is usually bundled with Node.js. Please reinstall Node.js."
        return 1
    fi
    
    local npm_version
    npm_version=$(npm --version)
    log_debug "Found npm version: $npm_version"
    
    if ! version_gte "$npm_version" "$MIN_NPM_VERSION"; then
        log_error "npm version $npm_version is below minimum required version $MIN_NPM_VERSION"
        log_info "Please upgrade npm: npm install -g npm@latest"
        return 1
    fi
    
    log_success "npm $npm_version is installed (minimum: $MIN_NPM_VERSION)"
    return 0
}

# Check PostgreSQL installation
check_postgresql() {
    log_info "Checking PostgreSQL installation..."
    
    # Check for psql client
    if ! command_exists psql; then
        log_warn "PostgreSQL client (psql) is not installed"
        log_info "PostgreSQL is required for local database setup"
        log_info "Install from: https://www.postgresql.org/download/"
        log_info ""
        log_info "Alternative: Use Supabase cloud (https://supabase.com)"
        log_info "Run with: --skip-db --supabase-url 'your-url' --supabase-key 'your-key'"
        return 1
    fi
    
    local psql_version
    psql_version=$(psql --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    log_debug "Found PostgreSQL client version: $psql_version"
    
    if ! version_gte "$psql_version" "$MIN_POSTGRES_VERSION"; then
        log_warn "PostgreSQL version $psql_version is below recommended version $MIN_POSTGRES_VERSION"
        log_info "Some features may not work as expected"
    else
        log_success "PostgreSQL client $psql_version is installed (minimum: $MIN_POSTGRES_VERSION)"
    fi
    
    # Check if PostgreSQL server is running
    log_info "Checking PostgreSQL server connection..."
    
    local pg_connect_cmd="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c '\\q' postgres"
    log_debug "Testing connection with: $pg_connect_cmd"
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c '\q' postgres 2>/dev/null; then
        log_warn "Cannot connect to PostgreSQL server at $DB_HOST:$DB_PORT"
        log_info "Make sure PostgreSQL is running and accepting connections"
        log_info "You may need to:"
        log_info "  1. Start PostgreSQL: sudo service postgresql start"
        log_info "  2. Set PGPASSWORD environment variable"
        log_info "  3. Configure pg_hba.conf for local connections"
        return 1
    fi
    
    log_success "PostgreSQL server is accessible at $DB_HOST:$DB_PORT"
    return 0
}

# Check all dependencies
check_dependencies() {
    log_step "1" "Checking Dependencies"
    
    local deps_ok=true
    local missing_deps=()
    
    # Check Node.js
    if ! check_nodejs; then
        deps_ok=false
        missing_deps+=("Node.js ${MIN_NODE_VERSION}+")
    fi
    
    # Check npm
    if ! check_npm; then
        deps_ok=false
        missing_deps+=("npm ${MIN_NPM_VERSION}+")
    fi
    
    # Check PostgreSQL (only if not using Supabase and not skipping DB)
    if [[ "$SKIP_DB" != true ]] && [[ -z "$SUPABASE_URL" ]]; then
        if ! check_postgresql; then
            deps_ok=false
            missing_deps+=("PostgreSQL ${MIN_POSTGRES_VERSION}+")
        fi
    fi
    
    # Check optional dependencies
    log_info "Checking optional dependencies..."
    
    if command_exists git; then
        log_success "git is installed"
    else
        log_warn "git is not installed (optional, but recommended)"
    fi
    
    # Summary
    if [[ "$deps_ok" == true ]]; then
        log_success "All required dependencies are satisfied"
        return 0
    else
        log_error "Missing dependencies: ${missing_deps[*]}"
        echo ""
        echo -e "${YELLOW}Would you like instructions for installing missing dependencies?${NC}"
        if confirm "Show installation instructions?" "y"; then
            show_install_instructions "${missing_deps[@]}"
        fi
        exit_error "Please install missing dependencies and run setup again" 2
    fi
}

# Show installation instructions for missing dependencies
show_install_instructions() {
    echo ""
    echo -e "${BOLD}Installation Instructions${NC}"
    echo "========================="
    echo ""
    
    for dep in "$@"; do
        case "$dep" in
            *Node.js*)
                echo -e "${CYAN}Node.js:${NC}"
                echo "  Using nvm (recommended):"
                echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
                echo "    nvm install 20"
                echo "    nvm use 20"
                echo ""
                echo "  Or download from: https://nodejs.org/"
                echo ""
                ;;
            *npm*)
                echo -e "${CYAN}npm:${NC}"
                echo "  npm is bundled with Node.js. Reinstall Node.js to get npm."
                echo "  To upgrade: npm install -g npm@latest"
                echo ""
                ;;
            *PostgreSQL*)
                echo -e "${CYAN}PostgreSQL:${NC}"
                echo "  Ubuntu/Debian:"
                echo "    sudo apt update && sudo apt install postgresql postgresql-contrib"
                echo ""
                echo "  macOS (Homebrew):"
                echo "    brew install postgresql@16"
                echo "    brew services start postgresql@16"
                echo ""
                echo "  Windows:"
                echo "    Download from https://www.postgresql.org/download/windows/"
                echo ""
                echo "  Alternative: Use Supabase cloud at https://supabase.com"
                echo ""
                ;;
        esac
    done
}

# ============================================================================
# Database Setup Functions
# ============================================================================

# Validate database configuration values to prevent injection
validate_db_config() {
    log_debug "Validating database configuration..."
    
    # Validate DB_NAME (alphanumeric, underscores, hyphens only)
    if [[ ! "$DB_NAME" =~ ^[a-zA-Z][a-zA-Z0-9_-]*$ ]]; then
        log_error "Invalid database name: $DB_NAME"
        log_info "Database name must start with a letter and contain only alphanumeric characters, underscores, and hyphens"
        return 1
    fi
    
    # Validate DB_USER (alphanumeric, underscores only)
    if [[ ! "$DB_USER" =~ ^[a-zA-Z][a-zA-Z0-9_]*$ ]]; then
        log_error "Invalid database user: $DB_USER"
        log_info "Database user must start with a letter and contain only alphanumeric characters and underscores"
        return 1
    fi
    
    # Validate DB_HOST (hostname or IP, no special chars that could be injection)
    if [[ ! "$DB_HOST" =~ ^[a-zA-Z0-9._-]+$ ]]; then
        log_error "Invalid database host: $DB_HOST"
        log_info "Database host must contain only alphanumeric characters, dots, underscores, and hyphens"
        return 1
    fi
    
    # Validate DB_PORT (numeric only)
    if [[ ! "$DB_PORT" =~ ^[0-9]+$ ]]; then
        log_error "Invalid database port: $DB_PORT"
        log_info "Database port must be a number"
        return 1
    fi
    
    log_debug "Database configuration validation passed"
    return 0
}

# Create PostgreSQL database
create_database() {
    log_info "Creating database '$DB_NAME'..."
    
    # Validate configuration before use
    if ! validate_db_config; then
        return 1
    fi
    
    # Check if database already exists
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        log_warn "Database '$DB_NAME' already exists"
        
        if confirm "Drop and recreate the database? (WARNING: This will delete all data)" "n"; then
            log_info "Dropping existing database..."
            dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" || {
                log_error "Failed to drop database"
                return 1
            }
        else
            log_info "Keeping existing database"
            return 0
        fi
    fi
    
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" || {
        log_error "Failed to create database '$DB_NAME'"
        log_info "Make sure you have permission to create databases"
        return 1
    }
    
    log_success "Database '$DB_NAME' created successfully"
    return 0
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Find migration files dynamically (in case file names change)
    local migration_dir="${SUPABASE_DIR}/migrations"
    local migration_file
    
    if [[ ! -d "$migration_dir" ]]; then
        log_error "Migrations directory not found: $migration_dir"
        return 1
    fi
    
    # Find SQL files in migrations directory, sorted alphabetically
    local migration_files
    mapfile -t migration_files < <(find "$migration_dir" -maxdepth 1 -name "*.sql" -type f | sort)
    
    if [[ ${#migration_files[@]} -eq 0 ]]; then
        log_error "No migration files found in: $migration_dir"
        return 1
    fi
    
    log_info "Found ${#migration_files[@]} migration file(s)"
    
    # Run each migration file
    for migration_file in "${migration_files[@]}"; do
        log_debug "Running migration: $migration_file"
        
        # Run the migration
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" 2>&1 | tee -a "$LOG_FILE"; then
            # Check for actual errors vs warnings
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\dt' 2>/dev/null | grep -q 'assessors'; then
                log_warn "Migration completed with warnings (schema already exists)"
            else
                log_error "Failed to run database migration: $(basename "$migration_file")"
                return 1
            fi
        fi
    done
    
    log_success "Database migrations completed"
    return 0
}

# Run database seed data
run_seed() {
    log_info "Loading seed data..."
    
    local seed_file="${SUPABASE_DIR}/seed.sql"
    
    if [[ ! -f "$seed_file" ]]; then
        log_error "Seed file not found: $seed_file"
        return 1
    fi
    
    log_debug "Running seed: $seed_file"
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$seed_file" 2>&1 | tee -a "$LOG_FILE"; then
        log_warn "Seed data may have partial conflicts (existing data)"
    fi
    
    log_success "Seed data loaded"
    return 0
}

# Verify database setup
verify_database() {
    log_info "Verifying database setup..."
    
    # Check required tables exist
    local required_tables=(
        "assessors"
        "course_templates"
        "template_components"
        "template_outcomes"
        "courses"
        "participants"
        "component_assessments"
        "outcome_scores"
        "overall_assessments"
    )
    
    local missing_tables=()
    for table in "${required_tables[@]}"; do
        if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\\d $table" &>/dev/null; then
            missing_tables+=("$table")
        fi
    done
    
    if [[ ${#missing_tables[@]} -gt 0 ]]; then
        log_error "Missing tables: ${missing_tables[*]}"
        return 1
    fi
    
    # Verify sample data
    local assessor_count
    assessor_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM assessors" 2>/dev/null | tr -d ' ')
    
    if [[ "$assessor_count" -gt 0 ]]; then
        log_success "Database verified: $assessor_count assessor(s) found"
    else
        log_warn "Database is empty (no seed data)"
    fi
    
    log_success "Database setup verified successfully"
    return 0
}

# Main database setup function
setup_database() {
    log_step "2" "Database Setup"
    
    if [[ "$SKIP_DB" == true ]]; then
        log_info "Skipping database setup (--skip-db specified)"
        return 0
    fi
    
    if [[ -n "$SUPABASE_URL" ]]; then
        log_info "Using Supabase cloud database"
        log_info "URL: $SUPABASE_URL"
        log_debug "Supabase key configured: ${SUPABASE_KEY:+yes}" # Mask key in logs
        log_info "Skipping local database setup"
        log_warn "Make sure to run migrations in Supabase SQL editor or via CLI"
        return 0
    fi
    
    log_info "Setting up PostgreSQL database..."
    log_info "  Host: $DB_HOST"
    log_info "  Port: $DB_PORT"
    log_info "  User: $DB_USER"
    log_info "  Database: $DB_NAME"
    
    if ! confirm "Proceed with database setup?" "y"; then
        log_info "Skipping database setup"
        return 0
    fi
    
    # Create database
    if ! create_database; then
        exit_error "Failed to create database" 3
    fi
    
    # Run migrations
    if ! run_migrations; then
        exit_error "Failed to run migrations" 3
    fi
    
    # Run seed data
    if confirm "Load sample seed data?" "y"; then
        if ! run_seed; then
            log_warn "Seed data loading had issues (non-fatal)"
        fi
    fi
    
    # Verify setup
    if ! verify_database; then
        exit_error "Database verification failed" 3
    fi
    
    return 0
}

# ============================================================================
# Frontend Setup Functions
# ============================================================================

# Install frontend dependencies
install_frontend_deps() {
    log_info "Installing frontend dependencies..."
    
    cd "$FRONTEND_DIR" || exit_error "Cannot access frontend directory" 4
    
    # Check for node_modules directory (more reliable than .package-lock.json)
    if [[ -d "node_modules" ]]; then
        log_info "node_modules exists, checking if update needed..."
        
        local npm_check_result
        if npm_check_result=$(npm ls --depth=0 2>&1); then
            log_debug "npm ls check passed"
            log_success "Dependencies are already installed and up to date"
            
            if confirm "Reinstall dependencies anyway?" "n"; then
                log_info "Cleaning node_modules..."
                rm -rf node_modules
            else
                return 0
            fi
        else
            log_debug "npm ls check failed: $npm_check_result"
            log_info "Dependencies need updating"
        fi
    fi
    
    log_info "Running npm ci for clean install..."
    
    if npm ci 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Frontend dependencies installed successfully"
    else
        log_warn "npm ci failed, trying npm install..."
        if npm install 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Frontend dependencies installed with npm install"
        else
            log_error "Failed to install frontend dependencies"
            return 1
        fi
    fi
    
    return 0
}

# Configure frontend environment
configure_frontend_env() {
    log_info "Configuring frontend environment..."
    
    local env_example="${FRONTEND_DIR}/.env.example"
    
    if [[ -f "$ENV_FILE" ]]; then
        log_warn "Environment file already exists: $ENV_FILE"
        
        if ! confirm "Overwrite existing .env file?" "n"; then
            log_info "Keeping existing environment configuration"
            return 0
        fi
    fi
    
    if [[ ! -f "$env_example" ]]; then
        log_warn ".env.example not found, creating basic .env"
    fi
    
    # Determine configuration values
    local supabase_url_value
    local supabase_key_value
    
    if [[ -n "$SUPABASE_URL" ]]; then
        supabase_url_value="$SUPABASE_URL"
    else
        prompt_input "Enter Supabase URL (or leave empty for local)" "" supabase_url_value
    fi
    
    if [[ -n "$SUPABASE_KEY" ]]; then
        supabase_key_value="$SUPABASE_KEY"
    elif [[ -n "$supabase_url_value" ]]; then
        prompt_input "Enter Supabase anon key" "" supabase_key_value
    fi
    
    # Create .env file
    cat > "$ENV_FILE" << EOF
# REdI Assessment System - Environment Configuration
# Generated by setup.sh on $(date '+%Y-%m-%d %H:%M:%S')

# Supabase Configuration
VITE_SUPABASE_URL=${supabase_url_value}
VITE_SUPABASE_ANON_KEY=${supabase_key_value}

# Optional: For self-hosted PostgreSQL (template - replace with your credentials)
# VITE_DATABASE_URL=postgresql://user:password@localhost:5432/database_name

# SharePoint Integration (Optional - Phase 5)
# VITE_AZURE_CLIENT_ID=your_azure_client_id
# VITE_AZURE_TENANT_ID=your_azure_tenant_id
# VITE_SHAREPOINT_SITE_ID=your_sharepoint_site_id
# VITE_SHAREPOINT_LIST_ID=your_sharepoint_list_id
EOF
    
    # Set restrictive permissions on .env file (contains sensitive credentials)
    chmod 600 "$ENV_FILE"
    log_debug "Set permissions 600 on $ENV_FILE"
    
    log_success "Environment file created: $ENV_FILE"
    
    if [[ -z "$supabase_url_value" ]]; then
        log_warn "VITE_SUPABASE_URL is not set - the application will not connect to a database"
        log_info "Edit $ENV_FILE to configure your database connection"
    fi
    
    return 0
}

# Verify frontend build
verify_frontend_build() {
    log_info "Verifying frontend build..."
    
    cd "$FRONTEND_DIR" || exit_error "Cannot access frontend directory" 4
    
    # Run TypeScript type check
    log_info "Running TypeScript type check..."
    if ! npx tsc --noEmit 2>&1 | tee -a "$LOG_FILE"; then
        log_warn "TypeScript type check has errors"
        log_info "This may be expected if Supabase credentials are not configured"
        log_info "Review errors above and update .env file if needed"
    else
        log_success "TypeScript type check passed"
    fi
    
    # Try to build
    if confirm "Run frontend build to verify setup?" "y"; then
        log_info "Building frontend..."
        if npm run build 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Frontend build completed successfully"
        else
            log_warn "Frontend build had issues (check environment configuration)"
        fi
    fi
    
    return 0
}

# Main frontend setup function
setup_frontend() {
    log_step "3" "Frontend Setup"
    
    if [[ "$SKIP_FRONTEND" == true ]]; then
        log_info "Skipping frontend setup (--skip-frontend specified)"
        return 0
    fi
    
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        exit_error "Frontend directory not found: $FRONTEND_DIR" 4
    fi
    
    log_info "Setting up frontend application..."
    
    # Install dependencies
    if ! install_frontend_deps; then
        exit_error "Failed to install frontend dependencies" 4
    fi
    
    # Configure environment
    if ! configure_frontend_env; then
        exit_error "Failed to configure frontend environment" 5
    fi
    
    # Verify build
    if ! verify_frontend_build; then
        log_warn "Frontend verification had issues"
    fi
    
    return 0
}

# ============================================================================
# Summary and Next Steps
# ============================================================================

show_summary() {
    log_step "4" "Setup Complete"
    
    echo ""
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}  REdI Assessment System Setup Complete!${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    
    echo -e "${BOLD}Configuration Summary:${NC}"
    echo "  - Log file: $LOG_FILE"
    
    if [[ "$SKIP_DB" != true ]] && [[ -z "$SUPABASE_URL" ]]; then
        echo "  - Database: $DB_NAME on $DB_HOST:$DB_PORT"
    elif [[ -n "$SUPABASE_URL" ]]; then
        echo "  - Database: Supabase (cloud)"
    fi
    
    if [[ "$SKIP_FRONTEND" != true ]]; then
        echo "  - Frontend: $FRONTEND_DIR"
        echo "  - Environment: $ENV_FILE"
    fi
    
    echo ""
    echo -e "${BOLD}Next Steps:${NC}"
    echo ""
    echo "  1. Review and update the environment configuration:"
    echo "     ${CYAN}$ENV_FILE${NC}"
    echo ""
    echo "  2. Start the development server:"
    echo "     ${CYAN}cd frontend && npm run dev${NC}"
    echo ""
    echo "  3. Open the application in your browser:"
    echo "     ${CYAN}http://localhost:5173${NC}"
    echo ""
    
    if [[ -z "$SUPABASE_URL" ]] && [[ "$SKIP_DB" != true ]]; then
        echo "  4. If using Supabase, update .env with your Supabase credentials"
        echo ""
    fi
    
    echo -e "${BOLD}Useful Commands:${NC}"
    echo "  npm run dev        - Start development server"
    echo "  npm run build      - Build for production"
    echo "  npm test           - Run unit tests"
    echo "  npm run lint       - Run linter"
    echo ""
    
    echo -e "${BOLD}Documentation:${NC}"
    echo "  - README.md               - Project overview"
    echo "  - frontend/README.md      - Frontend guide"
    echo "  - supabase/README.md      - Database guide"
    echo ""
    
    log_success "Setup completed successfully!"
}

# ============================================================================
# Main Entry Point
# ============================================================================

main() {
    # Parse command line arguments
    parse_args "$@"
    
    # Initialize logging
    init_log
    
    # Print header
    echo ""
    echo -e "${BOLD}${CYAN}============================================================================${NC}"
    echo -e "${BOLD}${CYAN}  REdI Assessment System - Unattended Setup v${SCRIPT_VERSION}${NC}"
    echo -e "${BOLD}${CYAN}============================================================================${NC}"
    echo ""
    
    log_info "Starting setup process..."
    log_debug "Script directory: $SCRIPT_DIR"
    log_debug "Configuration: DB_NAME=$DB_NAME, DB_HOST=$DB_HOST, DB_PORT=$DB_PORT"
    log_debug "Options: SKIP_DB=$SKIP_DB, SKIP_FRONTEND=$SKIP_FRONTEND, AUTO_CONFIRM=$AUTO_CONFIRM"
    
    # Step 1: Check dependencies
    check_dependencies
    
    # Step 2: Database setup
    setup_database
    
    # Step 3: Frontend setup
    setup_frontend
    
    # Step 4: Show summary
    show_summary
    
    return 0
}

# Run main function
main "$@"
