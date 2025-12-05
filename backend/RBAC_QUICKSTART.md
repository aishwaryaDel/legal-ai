# RBAC Quick Start Guide

Quick reference for implementing Role-Based Access Control in your routes and services.

## Setup

1. **Run the migration**
```bash
# Apply the RBAC migration to your database
# Migration file: migrations/002_create_roles_and_user_roles_tables.sql
```

2. **Import middleware**
```typescript
import {
  requireAuth,
  requireRole,
  requirePermission,
  requirePlatformAdmin,
  requireLegalAdmin,
  requireDepartmentAdmin
} from '../middlewares/rbacMiddleware';
```

## Common Patterns

### 1. Simple Authentication
```typescript
// Just check if user is logged in
router.get('/profile', requireAuth, getUserProfile);
```

### 2. Role-Based Access
```typescript
// Only Platform Admins can access
router.post('/system/config', requirePlatformAdmin, updateConfig);

// Legal Admin or Platform Admin
router.post('/templates', requireLegalAdmin, createTemplate);

// Department Admin or higher
router.post('/users/:id/assign', requireDepartmentAdmin, assignUser);
```

### 3. Permission-Based Access
```typescript
// Check specific permission
router.post('/documents',
  requirePermission('documents', 'create'),
  createDocument
);

// Check multiple permissions (user needs ALL)
router.post('/documents/publish',
  requireAllPermissions([
    { resource: 'documents', permission: 'update' },
    { resource: 'documents', permission: 'publish' }
  ]),
  publishDocument
);

// Check multiple permissions (user needs ANY)
router.get('/content',
  requireAnyPermission([
    { resource: 'documents', permission: 'read' },
    { resource: 'templates', permission: 'read' }
  ]),
  getContent
);
```

## System Roles

```typescript
import { SystemRoles } from '../types/RoleTypes';

SystemRoles.PLATFORM_ADMIN      // 'Platform Administrator'
SystemRoles.LEGAL_ADMIN         // 'Legal Admin'
SystemRoles.DEPARTMENT_ADMIN    // 'Department Admin'
SystemRoles.DEPARTMENT_USER     // 'Department User'
```

## Service Usage

### Check User Permission
```typescript
import { roleService } from '../services/roleService';

const canCreate = await roleService.checkUserPermission(
  userId,
  'documents',
  'create'
);

if (canCreate) {
  // User can create documents
}
```

### Get User's All Permissions
```typescript
const permissions = await roleService.getUserPermissions(userId);
// Returns: { documents: ['read', 'create'], users: ['read'], ... }
```

### Assign Role to User
```typescript
await roleService.assignRoleToUser({
  user_id: targetUserId,
  role_id: roleId,
  assigned_by: currentUserId
});
```

### Get User's Roles
```typescript
const userRoles = await roleService.getUserRoles(userId);
// Returns array of UserRole objects with role details
```

## Permission Structure Reference

### Resources
- `users` - User management
- `roles` - Role management
- `documents` - Documents
- `templates` - Templates
- `clauses` - Clause library
- `workflows` - Workflows
- `analytics` - Analytics
- `system` - System settings
- `audit` - Audit logs

### Common Actions
- `create` - Create new
- `read` - View/List
- `update` - Modify
- `delete` - Remove
- `publish` - Publish content
- `approve` - Approve changes
- `execute` - Run workflows
- `export` - Export data

## Example Route File

```typescript
import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import {
  requireAuth,
  requirePermission,
  requireLegalAdmin
} from '../middlewares/rbacMiddleware';

const router = Router();

// Anyone authenticated can read
router.get('/', requireAuth, documentController.getAll);

// Need 'documents.create' permission
router.post('/',
  requirePermission('documents', 'create'),
  documentController.create
);

// Need 'documents.update' permission
router.put('/:id',
  requirePermission('documents', 'update'),
  documentController.update
);

// Only Legal Admin or Platform Admin
router.post('/:id/publish',
  requireLegalAdmin,
  documentController.publish
);

// Need 'documents.delete' permission
router.delete('/:id',
  requirePermission('documents', 'delete'),
  documentController.delete
);

export default router;
```

## Testing with Mock Auth

For development/testing, use mock authentication:

```typescript
import { mockAuthMiddleware } from '../middlewares/rbacMiddleware';

// Provides a mock Platform Admin user
router.get('/test', mockAuthMiddleware, requireAuth, handler);
```

## Common Errors

### 401 Unauthorized
- User is not authenticated
- Missing or invalid token

### 403 Forbidden
- User authenticated but lacks required role/permission
- Check user's assigned roles
- Verify role permissions include required actions

### 500 Internal Server Error
- Database connection issues
- Invalid role/permission configuration

## Best Practices

1. **Use most specific middleware**
   - Prefer `requirePermission` over `requireRole` when possible
   - More granular = more maintainable

2. **Chain middleware**
   ```typescript
   router.post('/',
     requireAuth,
     requirePermission('documents', 'create'),
     validateInput,
     handler
   );
   ```

3. **Check permissions in services for complex logic**
   ```typescript
   async updateDocument(userId, docId, data) {
     const canUpdate = await roleService.checkUserPermission(
       userId, 'documents', 'update'
     );

     if (!canUpdate) {
       throw new Error('Permission denied');
     }

     // proceed with update
   }
   ```

4. **Don't hardcode role names**
   ```typescript
   // ❌ Bad
   requireRole(['Platform Administrator'])

   // ✅ Good
   requireRole([SystemRoles.PLATFORM_ADMIN])
   ```

## Quick API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/roles` | GET | Required | List all roles |
| `/api/roles` | POST | Platform Admin | Create role |
| `/api/roles/:id` | GET | Required | Get role |
| `/api/roles/:id` | PUT | Platform Admin | Update role |
| `/api/roles/:id` | DELETE | Platform Admin | Delete role |
| `/api/users/:id/roles` | GET | Required | Get user's roles |
| `/api/users/:id/roles` | POST | Dept Admin+ | Assign role |
| `/api/users/:id/roles/:roleId` | DELETE | Dept Admin+ | Remove role |
| `/api/users/:id/permissions` | GET | Required | Get user permissions |
| `/api/roles/:id/users` | GET | Required | Get users with role |

## Need More Help?

- Full documentation: `RBAC_IMPLEMENTATION.md`
- API docs: `http://localhost:3000/api-docs`
- Tests: `src/__tests__/role.test.ts` and `src/__tests__/rbac.test.ts`
