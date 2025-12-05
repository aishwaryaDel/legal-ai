# Database Migrations

This directory contains SQL migration files for the PostgreSQL database.

## Running Migrations

To run the migrations, execute the SQL files in order using `psql`:

```bash
psql -h localhost -U postgres -d postgres -f migrations/001_create_use_cases_table.sql
```

Or use the PostgreSQL connection from your `.env` file:

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/001_create_use_cases_table.sql
```

## Migration Files

- `001_create_users_table.sql` - Creates the users table with user authentication information
- `002_create_roles_and_user_roles_tables.sql` - Creates the RBAC system with roles and user_roles tables, includes 4 default roles
- `003_remove_role_from_users_table.sql` - Removes the deprecated role column from users table

## Migration Order

**IMPORTANT**: Migrations must be run in the exact order listed above:

```bash
# Step 1: Create users table
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/001_create_users_table.sql

# Step 2: Create RBAC system (roles and user_roles tables)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/002_create_roles_and_user_roles_tables.sql

# Step 3: Remove deprecated role column from users table
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/003_remove_role_from_users_table.sql
```

## RBAC System

The migrations include a complete Role-Based Access Control (RBAC) system with:

### Default Roles
1. **Platform Administrator** - Full system access
2. **Legal Admin** - Legal team management and oversight
3. **Department Admin** - Department-level administration
4. **Department User** - Basic user access

### Key Features
- Multiple roles per user through junction table
- JSONB permissions for flexible access control
- Temporary role assignments with expiration dates
- Row Level Security (RLS) policies
- Soft deletes for audit trails
- Complete audit tracking with assigned_by field

For detailed RBAC documentation, see `/backend/RBAC_GUIDE.md`.

## Notes

- Migrations use `IF NOT EXISTS` and `IF EXISTS` clauses to be idempotent
- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- JSONB columns are used for flexible data storage (arrays and objects)
- Indexes are created on frequently queried columns
- Foreign key constraints ensure referential integrity
- Row Level Security (RLS) is enabled on all tables for enhanced security
