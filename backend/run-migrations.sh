#!/bin/bash

# RBAC Migration Runner Script
# This script runs all database migrations in the correct order

set -e

echo "======================================"
echo "RBAC System Migration Runner"
echo "======================================"
echo ""

if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-postgres}

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

read -p "Do you want to proceed with migrations? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Running migrations..."
echo ""

echo "[1/3] Creating users table..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f migrations/001_create_users_table.sql
if [ $? -eq 0 ]; then
    echo "✓ Users table created successfully"
else
    echo "✗ Failed to create users table"
    exit 1
fi
echo ""

echo "[2/3] Creating roles and user_roles tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f migrations/002_create_roles_and_user_roles_tables.sql
if [ $? -eq 0 ]; then
    echo "✓ Roles and user_roles tables created successfully"
    echo "✓ Default roles inserted"
else
    echo "✗ Failed to create roles and user_roles tables"
    exit 1
fi
echo ""

echo "[3/3] Removing deprecated role column from users table..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f migrations/003_remove_role_from_users_table.sql
if [ $? -eq 0 ]; then
    echo "✓ Role column removed successfully"
else
    echo "✗ Failed to remove role column"
    exit 1
fi
echo ""

echo "======================================"
echo "All migrations completed successfully!"
echo "======================================"
echo ""

echo "Verifying roles..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT name, description FROM roles ORDER BY created_at;"
echo ""

echo "======================================"
echo "Next Steps:"
echo "======================================"
echo "1. Create your first user using POST /api/users"
echo "2. Assign a role using POST /api/user-roles"
echo "3. Test the RBAC system with the API examples"
echo ""
echo "Documentation:"
echo "- RBAC_GUIDE.md - Comprehensive guide"
echo "- API_EXAMPLES.md - API usage examples"
echo "- QUICK_START_RBAC.md - Quick reference"
echo ""
