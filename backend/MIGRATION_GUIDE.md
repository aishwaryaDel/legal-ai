# Migration Guide for RBAC Implementation

This guide explains how to apply the database migrations for the Role-Based Access Control system.

## Prerequisites

- PostgreSQL database running
- Database connection configured in `.env` file
- Database client (psql, pgAdmin, or similar)

## Environment Variables

Ensure your `.env` file contains:

```env
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

## Migration Files

The following migrations must be run in order:

1. **001_create_users_table.sql** - Creates the users table
2. **002_create_roles_table.sql** - Creates the roles table with 4 predefined roles
3. **003_create_user_roles_mapping.sql** - Creates the user-role mapping table
4. **004_update_users_table_remove_role.sql** - Removes the deprecated role column

## Running Migrations

### Option 1: Using psql Command Line

```bash
cd /tmp/cc-agent/61122345/project/backend/migrations

# Run each migration in order
psql -h localhost -U your_user -d your_database -f 001_create_users_table.sql
psql -h localhost -U your_user -d your_database -f 002_create_roles_table.sql
psql -h localhost -U your_user -d your_database -f 003_create_user_roles_mapping.sql
psql -h localhost -U your_user -d your_database -f 004_update_users_table_remove_role.sql
```

### Option 2: Using a Database Client

1. Connect to your PostgreSQL database
2. Open and execute each migration file in order
3. Verify each migration completes successfully before running the next

### Option 3: Using Node.js Script

Create a migration script (recommended for production):

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigrations() {
  const migrations = [
    '001_create_users_table.sql',
    '002_create_roles_table.sql',
    '003_create_user_roles_mapping.sql',
    '004_update_users_table_remove_role.sql',
  ];

  for (const migration of migrations) {
    const filePath = path.join(__dirname, 'migrations', migration);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running migration: ${migration}`);
    await pool.query(sql);
    console.log(`✓ Completed: ${migration}`);
  }

  await pool.end();
  console.log('All migrations completed successfully!');
}

runMigrations().catch(console.error);
```

## Verification

After running all migrations, verify the schema:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'roles', 'user_roles');

-- Check predefined roles were created
SELECT id, name, description, is_active FROM roles;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('roles', 'user_roles');

-- Check functions
SELECT proname FROM pg_proc
WHERE proname IN ('get_user_roles', 'get_user_permissions');
```

Expected output:
- 3 tables: users, roles, user_roles
- 4 roles: Platform Administrator, Legal Admin, Department Admin, Department User
- Indexes on role and user_role tables
- 2 functions: get_user_roles, get_user_permissions

## Initial Setup

### 1. Create Test Users

```sql
INSERT INTO users (email, password, name) VALUES
  ('admin@example.com', 'hashed_password', 'System Administrator'),
  ('legal@example.com', 'hashed_password', 'Legal Admin User'),
  ('dept@example.com', 'hashed_password', 'Department Admin User'),
  ('user@example.com', 'hashed_password', 'Regular User');
```

### 2. Assign Roles to Users

```sql
-- Assign Platform Administrator role
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT
  u.id,
  r.id,
  u.id
FROM users u, roles r
WHERE u.email = 'admin@example.com'
AND r.name = 'Platform Administrator';

-- Assign Legal Admin role
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT
  u.id,
  r.id,
  (SELECT id FROM users WHERE email = 'admin@example.com')
FROM users u, roles r
WHERE u.email = 'legal@example.com'
AND r.name = 'Legal Admin';

-- Assign Department Admin role
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT
  u.id,
  r.id,
  (SELECT id FROM users WHERE email = 'admin@example.com')
FROM users u, roles r
WHERE u.email = 'dept@example.com'
AND r.name = 'Department Admin';

-- Assign Department User role
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT
  u.id,
  r.id,
  (SELECT id FROM users WHERE email = 'admin@example.com')
FROM users u, roles r
WHERE u.email = 'user@example.com'
AND r.name = 'Department User';
```

### 3. Verify Role Assignments

```sql
-- View all user-role assignments
SELECT
  u.email,
  u.name,
  r.name as role_name,
  ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.role_id
WHERE ur.is_active = true;

-- Get roles for a specific user
SELECT * FROM get_user_roles('user_id_here');

-- Get merged permissions for a user
SELECT get_user_permissions('user_id_here');
```

## Rollback (If Needed)

To rollback migrations in reverse order:

```sql
-- Drop user_roles table and functions
DROP FUNCTION IF EXISTS get_user_permissions(uuid);
DROP FUNCTION IF EXISTS get_user_roles(uuid);
DROP TABLE IF EXISTS user_roles;

-- Drop roles table
DROP TABLE IF EXISTS roles;

-- Add back role column to users (if needed)
ALTER TABLE users ADD COLUMN role text;
```

## Troubleshooting

### Issue: Foreign Key Constraint Error

**Cause:** Trying to create user_roles before users or roles tables exist.

**Solution:** Run migrations in the correct order (001, 002, 003, 004).

### Issue: Duplicate Key Error on Role Insert

**Cause:** Roles already exist in the database.

**Solution:** The migration uses `ON CONFLICT DO NOTHING`, so this should not happen. If it does, manually check for duplicate roles.

### Issue: Permission Denied

**Cause:** Database user doesn't have sufficient privileges.

**Solution:** Grant necessary privileges:
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

## Best Practices

1. **Backup First**: Always backup your database before running migrations
2. **Test First**: Run migrations on a test/development database first
3. **Version Control**: Keep track of which migrations have been applied
4. **Monitor Logs**: Check database logs for any warnings or errors
5. **Verify Data**: After migration, verify data integrity and role assignments

## Next Steps

After successful migration:

1. Update your application code to use the new RBAC system
2. Test all API endpoints with different user roles
3. Configure role-based middleware on protected routes
4. Set up proper authentication to populate `req.user` in middleware
5. Review and adjust permissions for each role as needed
