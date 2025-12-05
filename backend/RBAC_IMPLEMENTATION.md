# Role-Based Access Control (RBAC) Implementation

This document provides a comprehensive guide to the Role-Based Access Control system implemented in the Legal AI application backend.

## Overview

The RBAC system provides granular permission management across the application with support for four system roles:
- **Platform Administrator** - Full system access
- **Legal Admin** - Manages legal content and team members
- **Department Admin** - Manages department users and documents
- **Department User** - Basic user with limited access

## Database Schema

### Tables Created

#### 1. `roles` Table
Stores role definitions with their permissions.

```sql
- id (uuid, primary key)
- name (text, unique)
- description (text)
- permissions (jsonb)
- is_system_role (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### 2. `user_roles` Table
Maps users to their assigned roles.

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key → users)
- role_id (uuid, foreign key → roles)
- assigned_by (uuid, foreign key → users)
- assigned_at (timestamptz)
- is_active (boolean)
```

### Relationships
- Users can have multiple roles (many-to-many)
- Each role assignment tracks who assigned it
- System roles cannot be deleted
- Deleting a user cascades to their role assignments

## API Endpoints

### Role Management

#### Get All Roles
```
GET /api/roles
Authorization: Required
Returns: List of all roles
```

#### Get Role by ID
```
GET /api/roles/:id
Authorization: Required
Returns: Single role details
```

#### Create Role
```
POST /api/roles
Authorization: Platform Administrator only
Body: {
  name: string
  description?: string
  permissions: PermissionsStructure
  is_system_role?: boolean
}
Returns: Created role
```

#### Update Role
```
PUT /api/roles/:id
Authorization: Platform Administrator only
Body: {
  name?: string
  description?: string
  permissions?: PermissionsStructure
}
Returns: Updated role
```

#### Delete Role
```
DELETE /api/roles/:id
Authorization: Platform Administrator only
Notes:
  - Cannot delete system roles
  - Cannot delete roles with active assignments
Returns: Success message
```

### User-Role Management

#### Get User's Roles
```
GET /api/users/:userId/roles
Authorization: Required
Returns: List of roles assigned to the user
```

#### Assign Role to User
```
POST /api/users/:userId/roles
Authorization: Department Admin or higher
Body: {
  role_id: string (uuid)
}
Returns: Created assignment
```

#### Remove Role from User
```
DELETE /api/users/:userId/roles/:roleId
Authorization: Department Admin or higher
Returns: Success message
```

#### Get Users by Role
```
GET /api/roles/:roleId/users
Authorization: Required
Returns: List of users with the specified role
```

#### Get User Permissions
```
GET /api/users/:userId/permissions
Authorization: Required
Returns: Aggregated permissions from all user's roles
```

## Permissions Structure

Permissions are stored as JSONB with this structure:

```json
{
  "users": ["create", "read", "update", "delete"],
  "roles": ["create", "read", "update", "delete"],
  "documents": ["create", "read", "update", "delete", "publish"],
  "templates": ["create", "read", "update", "delete", "publish"],
  "clauses": ["create", "read", "update", "delete", "approve"],
  "workflows": ["create", "read", "update", "execute"],
  "analytics": ["read", "export"],
  "system": ["configure", "backup", "restore"],
  "audit": ["read", "export"]
}
```

### Resources
- `users` - User management
- `roles` - Role management
- `documents` - Document operations
- `templates` - Template management
- `clauses` - Clause library
- `workflows` - Workflow automation
- `analytics` - Analytics and reporting
- `system` - System configuration
- `audit` - Audit log access

### Actions
- `create` - Create new items
- `read` - View items
- `update` - Modify items
- `delete` - Remove items
- `publish` - Publish content
- `approve` - Approve changes
- `execute` - Run workflows
- `export` - Export data
- `configure` - System configuration
- `backup` - Backup operations
- `restore` - Restore operations
- `use` - Use templates/clauses

## Middleware

### Authentication Middleware

#### `requireAuth`
Ensures user is authenticated.

```typescript
router.get('/protected', requireAuth, handler);
```

#### `requireRole(allowedRoles: string[])`
Checks if user has one of the specified roles.

```typescript
router.post('/admin', requireRole([SystemRoles.PLATFORM_ADMIN]), handler);
```

#### `requirePermission(resource: string, permission: string)`
Checks if user has a specific permission.

```typescript
router.post('/documents', requirePermission('documents', 'create'), handler);
```

#### `requireAnyPermission(permissions: Array<{resource, permission}>)`
Checks if user has at least one of the specified permissions.

```typescript
router.get('/content', requireAnyPermission([
  { resource: 'documents', permission: 'read' },
  { resource: 'templates', permission: 'read' }
]), handler);
```

#### `requireAllPermissions(permissions: Array<{resource, permission}>)`
Checks if user has all specified permissions.

```typescript
router.post('/publish', requireAllPermissions([
  { resource: 'documents', permission: 'update' },
  { resource: 'documents', permission: 'publish' }
]), handler);
```

### Pre-configured Middleware

```typescript
requirePlatformAdmin    // Platform Administrator only
requireLegalAdmin       // Legal Admin or Platform Admin
requireDepartmentAdmin  // Department Admin or higher
```

## System Roles

### 1. Platform Administrator
Full system access with all permissions across all resources.

**Default Permissions:**
- All CRUD operations on users and roles
- Full document lifecycle management
- System configuration and maintenance
- Complete audit log access

### 2. Legal Admin
Manages legal content and legal team members.

**Default Permissions:**
- Read/Update users
- Full document and template management
- Clause library management with approval rights
- Workflow creation and execution
- Analytics access

### 3. Department Admin
Manages department users and their content.

**Default Permissions:**
- Read/Update users in their department
- Document CRUD operations
- Template and clause usage
- Workflow execution
- Department analytics

### 4. Department User
Basic user with limited access.

**Default Permissions:**
- Read users
- Create, read, and update own documents
- Use templates and clauses
- View workflows

## Usage Examples

### Protecting Routes

```typescript
import { requireAuth, requirePermission, requireRole } from '../middlewares/rbacMiddleware';
import { SystemRoles } from '../types/RoleTypes';

// Require authentication only
router.get('/profile', requireAuth, getProfile);

// Require specific role
router.post('/users', requireRole([SystemRoles.PLATFORM_ADMIN]), createUser);

// Require specific permission
router.post('/documents', requirePermission('documents', 'create'), createDocument);

// Require Platform Admin
router.delete('/system/data', requirePlatformAdmin, deleteSystemData);
```

### Checking Permissions in Services

```typescript
import { roleService } from '../services/roleService';

// Check single permission
const canCreateDocs = await roleService.checkUserPermission(
  userId,
  'documents',
  'create'
);

// Get all user permissions
const permissions = await roleService.getUserPermissions(userId);
```

### Managing Roles

```typescript
// Create custom role
const customRole = await roleService.createRole({
  name: 'Contract Reviewer',
  description: 'Can review and approve contracts',
  permissions: {
    documents: ['read', 'update'],
    clauses: ['read', 'approve']
  }
});

// Assign role to user
await roleService.assignRoleToUser({
  user_id: '123',
  role_id: customRole.id,
  assigned_by: currentUserId
});

// Get user's roles
const userRoles = await roleService.getUserRoles(userId);
```

## Security Considerations

1. **System Role Protection**
   - System roles (is_system_role = true) cannot be deleted
   - System role names cannot be changed
   - Ensures core roles always exist

2. **Assignment Validation**
   - All role assignments are tracked with assigner ID
   - Users cannot escalate their own privileges
   - Department Admins required to assign roles

3. **Cascade Rules**
   - User deletion cascades to role assignments
   - Role deletion blocked if active assignments exist
   - System roles cannot be deleted

4. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Policies require authentication
   - Future enhancement: Fine-grained RLS based on roles

## Testing

Comprehensive test suites are available:

```bash
# Run all tests
npm test

# Run RBAC tests only
npm test -- role.test.ts
npm test -- rbac.test.ts
```

Test coverage includes:
- Role CRUD operations
- User-role assignment/removal
- Permission checking
- Middleware authentication
- Error handling
- Edge cases (system roles, duplicates, etc.)

## Migration

To apply the RBAC schema:

1. Run the migration:
```sql
-- From migrations/002_create_roles_and_user_roles_tables.sql
```

2. The migration automatically:
   - Creates roles and user_roles tables
   - Sets up indexes for performance
   - Enables RLS
   - Seeds four system roles
   - Creates helper functions

## Development Notes

### Mock Authentication
For development/testing, a mock authentication middleware is available:

```typescript
import { mockAuthMiddleware } from '../middlewares/rbacMiddleware';

// Provides mock user with Platform Admin role
router.get('/test', mockAuthMiddleware, requireAuth, handler);
```

### TypeScript Types
All RBAC types are defined in `src/types/RoleTypes.ts`:
- `RoleAttributes`
- `UserRoleAttributes`
- `PermissionsStructure`
- `SystemRoles` enum
- `Permissions` enum
- `Resources` enum

## Future Enhancements

1. **Role Hierarchies** - Implement role inheritance
2. **Temporary Roles** - Time-limited role assignments
3. **Context-Based Permissions** - Department/project-specific access
4. **Permission Groups** - Preset permission bundles
5. **Audit Trail** - Enhanced logging of role changes
6. **Dynamic Permissions** - Runtime permission evaluation

## Support

For issues or questions about the RBAC system:
1. Check this documentation
2. Review test files for usage examples
3. Examine the API endpoints in Swagger UI
4. Contact the development team

## API Documentation

Full API documentation is available at:
```
http://localhost:3000/api-docs
```

When the server is running, visit the Swagger UI for interactive API testing and complete endpoint documentation.
