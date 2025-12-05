# Role-Based Access Control (RBAC) System

This guide provides comprehensive documentation for the RBAC system implemented in the Legal AI application backend.

## Overview

The RBAC system enables fine-grained access control for the Legal AI application through:
- **4 predefined roles** with specific permissions
- **User-Role mapping** allowing users to have multiple roles
- **Middleware-based authorization** for protecting routes
- **Permission-based access control** for granular resource management

## Database Schema

### Tables

#### `roles`
Stores role definitions and their permissions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Unique role name |
| `description` | TEXT | Role description |
| `permissions` | JSONB | JSON object containing permissions |
| `is_active` | BOOLEAN | Whether the role is active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `user_roles`
Junction table mapping users to roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users table |
| `role_id` | UUID | Foreign key to roles table |
| `assigned_by` | UUID | User who assigned the role |
| `assigned_at` | TIMESTAMPTZ | When the role was assigned |
| `expires_at` | TIMESTAMPTZ | Optional expiration date |
| `is_active` | BOOLEAN | Whether the assignment is active |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `users` (Updated)
The `role` column has been removed from the users table. Users are now associated with roles through the `user_roles` junction table.

## Predefined Roles

### 1. Platform Administrator
Full system access with ability to manage all users, roles, and system configurations.

**Permissions:**
```json
{
  "users": {"create": true, "read": true, "update": true, "delete": true},
  "roles": {"create": true, "read": true, "update": true, "delete": true},
  "documents": {"create": true, "read": true, "update": true, "delete": true},
  "analytics": {"view": true},
  "settings": {"manage": true}
}
```

### 2. Legal Admin
Legal team management and oversight with access to all legal documents and workflows.

**Permissions:**
```json
{
  "users": {"create": true, "read": true, "update": true, "delete": false},
  "roles": {"create": false, "read": true, "update": false, "delete": false},
  "documents": {"create": true, "read": true, "update": true, "delete": true},
  "analytics": {"view": true},
  "settings": {"manage": false}
}
```

### 3. Department Admin
Department-level administration with ability to manage department users and documents.

**Permissions:**
```json
{
  "users": {"create": true, "read": true, "update": true, "delete": false},
  "roles": {"create": false, "read": true, "update": false, "delete": false},
  "documents": {"create": true, "read": true, "update": true, "delete": false},
  "analytics": {"view": true},
  "settings": {"manage": false}
}
```

### 4. Department User
Basic user access with ability to create and manage own documents.

**Permissions:**
```json
{
  "users": {"create": false, "read": false, "update": false, "delete": false},
  "roles": {"create": false, "read": false, "update": false, "delete": false},
  "documents": {"create": true, "read": true, "update": true, "delete": false},
  "analytics": {"view": false},
  "settings": {"manage": false}
}
```

## API Endpoints

### Role Management

#### Get All Roles
```
GET /api/roles
```
Returns all active roles.

#### Get Role by ID
```
GET /api/roles/:id
```
Returns a specific role by its ID.

#### Get Role by Name
```
GET /api/roles/name/:name
```
Returns a specific role by its name.

#### Create Role
```
POST /api/roles
```
**Authorization:** Platform Administrator only

**Body:**
```json
{
  "name": "Custom Role",
  "description": "Description of the role",
  "permissions": {
    "users": {"create": false, "read": true, "update": false, "delete": false}
  }
}
```

#### Update Role
```
PUT /api/roles/:id
```
**Authorization:** Platform Administrator only

**Body:**
```json
{
  "name": "Updated Role Name",
  "description": "Updated description",
  "permissions": {...}
}
```

#### Delete Role
```
DELETE /api/roles/:id
```
**Authorization:** Platform Administrator only

### User-Role Management

#### Get All User-Role Mappings
```
GET /api/user-roles
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

#### Get User-Role by ID
```
GET /api/user-roles/:id
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

#### Get Roles by User ID
```
GET /api/user-roles/user/:userId
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

Returns all roles assigned to a specific user.

#### Get User with Roles
```
GET /api/user-roles/user/:userId/with-roles
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

Returns user information along with all assigned roles.

#### Get Users by Role ID
```
GET /api/user-roles/role/:roleId
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

Returns all users with a specific role.

#### Assign Role to User
```
POST /api/user-roles
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

**Body:**
```json
{
  "user_id": "uuid",
  "role_id": "uuid",
  "assigned_by": "uuid",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### Update User-Role
```
PUT /api/user-roles/:id
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

**Body:**
```json
{
  "expires_at": "2024-12-31T23:59:59Z",
  "is_active": true
}
```

#### Remove Role from User
```
DELETE /api/user-roles/:id
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

#### Remove Role from User by IDs
```
DELETE /api/user-roles/user/:userId/role/:roleId
```
**Authorization:** Platform Administrator, Legal Admin, Department Admin

## Middleware Usage

### Check Role Middleware
Use `checkRole` to restrict route access to specific roles.

```typescript
import { checkRole } from '../middlewares/rbacMiddleware';
import { ROLE_NAMES } from '../constants/messages';

router.get(
  '/admin-only',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN]),
  controller.adminOnlyMethod
);

router.get(
  '/admin-and-managers',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  controller.adminAndManagersMethod
);
```

### Check Permission Middleware
Use `checkPermission` for granular resource-level access control.

```typescript
import { checkPermission } from '../middlewares/rbacMiddleware';

router.post(
  '/documents',
  checkPermission('documents', 'create'),
  controller.createDocument
);

router.delete(
  '/documents/:id',
  checkPermission('documents', 'delete'),
  controller.deleteDocument
);
```

### Attach User Roles Middleware
Use `attachUserRoles` to add user role information to the request object without enforcing authorization.

```typescript
import { attachUserRoles } from '../middlewares/rbacMiddleware';

router.get(
  '/profile',
  attachUserRoles,
  controller.getProfile
);
```

## Migration Instructions

### Running Migrations

1. **First Migration - Create Users Table**
   ```bash
   psql -U your_user -d your_database -f backend/migrations/001_create_users_table.sql
   ```

2. **Second Migration - Create Roles and User-Roles Tables**
   ```bash
   psql -U your_user -d your_database -f backend/migrations/002_create_roles_and_user_roles_tables.sql
   ```

3. **Third Migration - Remove Role from Users Table**
   ```bash
   psql -U your_user -d your_database -f backend/migrations/003_remove_role_from_users_table.sql
   ```

### Data Migration

If you have existing users with roles in the old `users.role` column, you'll need to migrate them to the new system:

```sql
-- Example migration script
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT
  u.id,
  r.id,
  NOW()
FROM users u
JOIN roles r ON r.name = u.role
WHERE u.role IS NOT NULL
ON CONFLICT DO NOTHING;
```

## Usage Examples

### Example 1: Creating a User and Assigning a Role

```typescript
// Create a user
const newUser = await userService.createUser({
  email: 'john@example.com',
  password: 'securepassword',
  name: 'John Doe'
});

// Get the Department User role
const departmentUserRole = await roleService.getRoleByName('Department User');

// Assign the role to the user
await userRoleService.assignRoleToUser({
  user_id: newUser.id,
  role_id: departmentUserRole.id,
  assigned_by: adminUserId
});
```

### Example 2: Checking User Permissions

```typescript
// Get user with roles
const userWithRoles = await userRoleService.getUserWithRoles(userId);

// Check if user has a specific permission
const canDeleteDocuments = userWithRoles.roles.some(
  role => role.permissions.documents?.delete === true
);
```

### Example 3: Protected Route

```typescript
import express from 'express';
import { checkRole } from '../middlewares/rbacMiddleware';
import { ROLE_NAMES } from '../constants/messages';

const router = express.Router();

router.delete(
  '/sensitive-data/:id',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN]),
  async (req, res) => {
    // Only Platform Administrators can access this route
    // Delete sensitive data logic here
  }
);
```

## Security Considerations

1. **Row Level Security (RLS)**: All tables have RLS policies enabled to ensure data security at the database level.

2. **Soft Deletes**: Both roles and user-role mappings use soft deletes (is_active flag) to maintain audit trails.

3. **Expiration Support**: User-role assignments can have expiration dates for temporary access.

4. **Audit Trail**: The assigned_by field tracks who assigned each role for accountability.

5. **Multiple Roles**: Users can have multiple roles simultaneously, and permissions are cumulative.

6. **Database-Level Validation**: Foreign key constraints ensure referential integrity.

## Troubleshooting

### Common Issues

1. **User has no roles assigned**
   - Error: "Forbidden: User has no roles assigned"
   - Solution: Assign at least one role to the user using the user-role assignment API

2. **Role already exists**
   - Error: "Role with name 'X' already exists"
   - Solution: Use a different role name or update the existing role

3. **User already has role**
   - Error: "User already has this role assigned"
   - Solution: Check existing assignments before creating new ones

4. **Expired role assignment**
   - If a user's role has expired, they will not have access
   - Solution: Update the expires_at field or create a new assignment

## Best Practices

1. **Assign Minimum Required Roles**: Follow the principle of least privilege
2. **Use Temporary Assignments**: Set expiration dates for temporary access
3. **Regular Audits**: Periodically review user-role assignments
4. **Custom Permissions**: Extend the permissions object for application-specific needs
5. **Testing**: Always test authorization logic thoroughly
6. **Documentation**: Keep role definitions and permissions documented

## Constants Reference

All role names are available as constants in `/backend/src/constants/messages.ts`:

```typescript
export const ROLE_NAMES = {
  PLATFORM_ADMIN: 'Platform Administrator',
  LEGAL_ADMIN: 'Legal Admin',
  DEPARTMENT_ADMIN: 'Department Admin',
  DEPARTMENT_USER: 'Department User',
};
```

Use these constants instead of hardcoding role names for maintainability.
