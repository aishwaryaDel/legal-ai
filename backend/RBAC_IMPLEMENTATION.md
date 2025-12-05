# Role-Based Access Control (RBAC) Implementation

This document describes the Role-Based Access Control (RBAC) implementation for the Legal AI Application.

## Overview

The RBAC system implements a flexible, many-to-many relationship between users and roles, allowing:
- Multiple roles per user
- Granular permission management
- Temporary role assignments with expiration
- Audit trail of role assignments
- Soft delete support

## Database Schema

### Tables

#### 1. `roles` Table
Stores all available roles in the system.

**Columns:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Unique role name
- `description` (TEXT) - Role description
- `permissions` (JSONB) - Permissions object
- `is_active` (BOOLEAN) - Active status
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Predefined Roles:**
1. **Platform Administrator** - Full system access
2. **Legal Admin** - Legal team administrator
3. **Department Admin** - Department administrator
4. **Department User** - Basic user access

#### 2. `user_roles` Table
Maps users to roles (many-to-many relationship).

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `role_id` (UUID) - Foreign key to roles
- `assigned_by` (UUID) - User who assigned the role
- `assigned_at` (TIMESTAMPTZ) - Assignment timestamp
- `expires_at` (TIMESTAMPTZ) - Optional expiration
- `is_active` (BOOLEAN) - Active status
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

### Database Functions

#### `get_user_roles(p_user_id UUID)`
Returns all active roles for a specific user.

#### `get_user_permissions(p_user_id UUID)`
Returns merged permissions from all user's active roles.

## API Endpoints

### Role Management

#### GET `/api/roles`
Get all roles.
- Query params: `include_inactive` (boolean)

#### GET `/api/roles/:id`
Get role by ID.

#### GET `/api/roles/name/:name`
Get role by name.

#### POST `/api/roles`
Create a new role.

**Request Body:**
```json
{
  "name": "Role Name",
  "description": "Role description",
  "permissions": {
    "users": { "create": true, "read": true, "update": true, "delete": false },
    "documents": { "create": true, "read": true, "update": true, "delete": false }
  },
  "is_active": true
}
```

#### PUT `/api/roles/:id`
Update a role.

#### DELETE `/api/roles/:id`
Delete a role (soft delete by default).
- Query params: `soft` (boolean, default: true)

### User-Role Mapping

#### GET `/api/user-roles`
Get all user-role mappings.

#### GET `/api/user-roles/:id`
Get mapping by ID.

#### GET `/api/user-roles/user/:userId`
Get all roles for a user.
- Query params: `include_inactive` (boolean)

#### GET `/api/user-roles/role/:roleId`
Get all users with a specific role.
- Query params: `include_inactive` (boolean)

#### POST `/api/user-roles`
Assign a role to a user.

**Request Body:**
```json
{
  "user_id": "uuid",
  "role_id": "uuid",
  "assigned_by": "uuid",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### PUT `/api/user-roles/:id`
Update a user-role mapping.

#### DELETE `/api/user-roles/:id`
Delete a mapping (soft delete by default).
- Query params: `soft` (boolean, default: true)

#### DELETE `/api/user-roles/user/:userId/role/:roleId`
Remove a specific role from a user.
- Query params: `soft` (boolean, default: true)

## RBAC Middleware

### Available Middleware Functions

#### `checkPermission(resource, action)`
Checks if user has specific permission.

```typescript
router.post('/documents',
  checkPermission('documents', 'create'),
  documentController.createDocument
);
```

#### `checkRole(allowedRoles[])`
Checks if user has one of the specified roles.

```typescript
router.get('/admin',
  checkRole(['Platform Administrator', 'Legal Admin']),
  adminController.getAdminData
);
```

#### Helper Functions

- `isPlatformAdmin()` - Checks for Platform Administrator role
- `isLegalAdmin()` - Checks for Platform Administrator or Legal Admin role
- `isDepartmentAdmin()` - Checks for admin roles

#### `attachUserPermissions`
Middleware that attaches merged permissions to request object.

```typescript
app.use(attachUserPermissions);
```

## Permission Structure

Permissions are stored as JSONB with the following structure:

```json
{
  "users": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "roles": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "documents": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "analytics": {
    "read": boolean
  },
  "workflows": {
    "create": boolean,
    "read": boolean,
    "update": boolean,
    "delete": boolean
  },
  "system": {
    "configure": boolean
  }
}
```

## Migrations

Run migrations in order:
1. `001_create_users_table.sql` - Creates users table
2. `002_create_roles_table.sql` - Creates roles table with predefined roles
3. `003_create_user_roles_mapping.sql` - Creates user-role mapping table
4. `004_update_users_table_remove_role.sql` - Removes deprecated role column from users

## Usage Examples

### Assigning a Role to a User

```typescript
const response = await fetch('/api/user-roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user-uuid',
    role_id: 'role-uuid',
    assigned_by: 'admin-uuid'
  })
});
```

### Getting User's Roles

```typescript
const response = await fetch('/api/user-roles/user/{userId}');
const { data } = await response.json();
```

### Protecting Routes

```typescript
import { checkPermission, isLegalAdmin } from './middlewares/rbacMiddleware';

router.post('/documents',
  checkPermission('documents', 'create'),
  documentController.createDocument
);

router.get('/admin/settings',
  isLegalAdmin(),
  adminController.getSettings
);
```

## Testing

Run tests with:
```bash
npm test
```

Test files:
- `src/__tests__/role.test.ts` - Role management tests
- `src/__tests__/userRole.test.ts` - User-role mapping tests

## Security Considerations

1. **Row Level Security (RLS)** - Enabled on all tables
2. **Soft Delete** - Default behavior for deletions
3. **Audit Trail** - Track who assigned roles and when
4. **Permission Merging** - Users inherit all permissions from all their roles
5. **Expiration Support** - Temporary role assignments supported

## Swagger Documentation

API documentation available at: `http://localhost:3000/api-docs`

All endpoints are documented with request/response schemas and examples.
