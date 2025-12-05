# RBAC Quick Start Guide

This is a quick reference guide for developers working with the RBAC system.

## Quick Setup

### 1. Run Migrations

```bash
cd backend
psql -h localhost -U postgres -d your_database -f migrations/001_create_users_table.sql
psql -h localhost -U postgres -d your_database -f migrations/002_create_roles_and_user_roles_tables.sql
psql -h localhost -U postgres -d your_database -f migrations/003_remove_role_from_users_table.sql
```

### 2. Verify Roles Were Created

```bash
psql -h localhost -U postgres -d your_database -c "SELECT name, description FROM roles;"
```

You should see 4 roles:
- Platform Administrator
- Legal Admin
- Department Admin
- Department User

## Common Tasks

### Create a User with a Role

```typescript
import { userService } from './services/userService';
import { roleService } from './services/roleService';
import { userRoleService } from './services/userRoleService';

// 1. Create user
const newUser = await userService.createUser({
  email: 'user@example.com',
  password: 'hashedPassword',
  name: 'John Doe'
});

// 2. Get role
const role = await roleService.getRoleByName('Department User');

// 3. Assign role to user
await userRoleService.assignRoleToUser({
  user_id: newUser.id,
  role_id: role.id,
  assigned_by: adminUserId
});
```

### Protect a Route with Role Check

```typescript
import express from 'express';
import { checkRole } from '../middlewares/rbacMiddleware';
import { ROLE_NAMES } from '../constants/messages';

const router = express.Router();

// Only Platform Admins can access
router.delete('/admin-action',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN]),
  async (req, res) => {
    // Your logic here
  }
);

// Multiple roles can access
router.get('/manager-action',
  checkRole([
    ROLE_NAMES.PLATFORM_ADMIN,
    ROLE_NAMES.LEGAL_ADMIN,
    ROLE_NAMES.DEPARTMENT_ADMIN
  ]),
  async (req, res) => {
    // Your logic here
  }
);
```

### Protect a Route with Permission Check

```typescript
import { checkPermission } from '../middlewares/rbacMiddleware';

// Check if user has permission to delete documents
router.delete('/documents/:id',
  checkPermission('documents', 'delete'),
  async (req, res) => {
    // Only users with documents.delete permission can access
  }
);
```

### Get User with All Roles

```typescript
import { userRoleService } from './services/userRoleService';

const userWithRoles = await userRoleService.getUserWithRoles(userId);

console.log(userWithRoles);
// {
//   id: 'uuid',
//   email: 'user@example.com',
//   name: 'John Doe',
//   roles: [
//     {
//       id: 'role-uuid',
//       name: 'Department User',
//       permissions: {...},
//       assigned_at: '2024-01-01T00:00:00Z'
//     }
//   ]
// }
```

### Check User Permissions Programmatically

```typescript
const userWithRoles = await userRoleService.getUserWithRoles(userId);

const canDeleteDocs = userWithRoles.roles.some(
  role => role.permissions.documents?.delete === true
);

const canManageSettings = userWithRoles.roles.some(
  role => role.permissions.settings?.manage === true
);

if (canDeleteDocs) {
  // Allow document deletion
}
```

## Role Hierarchy

```
Platform Administrator (Highest)
├── Full access to everything
└── Can manage all users and roles

Legal Admin
├── Manage legal team
├── Access all legal documents
└── Cannot manage system settings

Department Admin
├── Manage department users
├── Manage department documents
└── Cannot delete documents

Department User (Lowest)
├── Create and manage own documents
└── Limited read access
```

## Available Constants

```typescript
// Import role names
import { ROLE_NAMES } from '../constants/messages';

ROLE_NAMES.PLATFORM_ADMIN      // 'Platform Administrator'
ROLE_NAMES.LEGAL_ADMIN         // 'Legal Admin'
ROLE_NAMES.DEPARTMENT_ADMIN    // 'Department Admin'
ROLE_NAMES.DEPARTMENT_USER     // 'Department User'
```

## Middleware Options

### 1. checkRole(roles: string[])
Requires user to have at least one of the specified roles.

```typescript
checkRole([ROLE_NAMES.PLATFORM_ADMIN])
checkRole([ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN])
```

### 2. checkPermission(resource: string, action: string)
Requires user to have specific permission on a resource.

```typescript
checkPermission('documents', 'create')
checkPermission('users', 'delete')
checkPermission('analytics', 'view')
```

### 3. attachUserRoles
Adds user roles to request object without enforcing authorization.

```typescript
router.get('/profile',
  attachUserRoles,
  async (req: AuthRequest, res) => {
    // req.user.roles will be available
    console.log(req.user?.roles);
  }
);
```

## Permission Structure

Permissions are stored as JSONB in the database:

```typescript
interface RolePermissions {
  users?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  roles?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  documents?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  analytics?: {
    view?: boolean;
  };
  settings?: {
    manage?: boolean;
  };
  [key: string]: any; // Extensible for custom resources
}
```

## API Quick Reference

### Roles
- `GET /api/roles` - List all roles
- `GET /api/roles/:id` - Get role by ID
- `GET /api/roles/name/:name` - Get role by name
- `POST /api/roles` - Create role (Platform Admin only)
- `PUT /api/roles/:id` - Update role (Platform Admin only)
- `DELETE /api/roles/:id` - Delete role (Platform Admin only)

### User-Roles
- `GET /api/user-roles` - List all mappings (Admin only)
- `GET /api/user-roles/user/:userId` - Get user's roles (Admin only)
- `GET /api/user-roles/user/:userId/with-roles` - Get user with roles (Admin only)
- `POST /api/user-roles` - Assign role to user (Admin only)
- `PUT /api/user-roles/:id` - Update assignment (Admin only)
- `DELETE /api/user-roles/:id` - Remove role (Admin only)

### Users (Updated)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (no role field)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Testing

### Test with curl

```bash
# Get all roles
curl http://localhost:3000/api/roles

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'

# Assign role
curl -X POST http://localhost:3000/api/user-roles \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user-uuid","role_id":"role-uuid"}'
```

## Troubleshooting

### Issue: "User has no roles assigned"
**Solution:** Assign at least one role to the user via the user-roles API.

### Issue: "Forbidden: User does not have required role"
**Solution:** Check which roles have access to the route and ensure the user has one of those roles.

### Issue: Role names don't match
**Solution:** Always use the ROLE_NAMES constants instead of hardcoding strings.

### Issue: Permissions not working
**Solution:** Check the permissions JSON structure in the database matches your code expectations.

## Best Practices

1. ✅ **DO** use ROLE_NAMES constants
2. ✅ **DO** assign minimum required roles (principle of least privilege)
3. ✅ **DO** use checkPermission for granular control
4. ✅ **DO** set expiration dates for temporary access
5. ❌ **DON'T** hardcode role names
6. ❌ **DON'T** give users more permissions than needed
7. ❌ **DON'T** skip RBAC middleware on sensitive routes
8. ❌ **DON'T** forget to test authorization logic

## Need More Help?

- See `RBAC_GUIDE.md` for comprehensive documentation
- See `API_EXAMPLES.md` for detailed API examples
- Check the middleware implementations in `src/middlewares/rbacMiddleware.ts`
