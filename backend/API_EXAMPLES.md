# RBAC API Examples

This document provides practical examples for testing the RBAC API endpoints using curl commands.

## Prerequisites

- Backend server running on `http://localhost:3000` (adjust port as needed)
- Valid authentication token (if authentication is implemented)
- PostgreSQL database with migrations applied

## Role Management APIs

### 1. Get All Roles

```bash
curl -X GET http://localhost:3000/api/roles \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "Platform Administrator",
      "description": "Full system access...",
      "permissions": {...},
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 4
}
```

### 2. Get Role by ID

```bash
curl -X GET http://localhost:3000/api/roles/{role-id} \
  -H "Content-Type: application/json"
```

### 3. Get Role by Name

```bash
curl -X GET http://localhost:3000/api/roles/name/Platform%20Administrator \
  -H "Content-Type: application/json"
```

### 4. Create New Role (Platform Admin Only)

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contract Reviewer",
    "description": "Specialized role for contract review",
    "permissions": {
      "documents": {
        "create": false,
        "read": true,
        "update": true,
        "delete": false
      },
      "analytics": {
        "view": true
      }
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "Contract Reviewer",
    "description": "Specialized role for contract review",
    "permissions": {...},
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Role created successfully"
}
```

### 5. Update Role (Platform Admin Only)

```bash
curl -X PUT http://localhost:3000/api/roles/{role-id} \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "permissions": {
      "documents": {
        "create": true,
        "read": true,
        "update": true,
        "delete": false
      }
    }
  }'
```

### 6. Delete Role (Platform Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/roles/{role-id} \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

## User-Role Management APIs

### 1. Get All User-Role Mappings (Admin Only)

```bash
curl -X GET http://localhost:3000/api/user-roles \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mapping-uuid",
      "user_id": "user-uuid",
      "role_id": "role-uuid",
      "assigned_by": "admin-uuid",
      "assigned_at": "2024-01-01T00:00:00Z",
      "expires_at": null,
      "is_active": true,
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "John Doe"
      },
      "role": {
        "id": "role-uuid",
        "name": "Department User",
        "description": "Basic user access",
        "permissions": {...}
      }
    }
  ],
  "count": 10
}
```

### 2. Get User-Role Mapping by ID (Admin Only)

```bash
curl -X GET http://localhost:3000/api/user-roles/{mapping-id} \
  -H "Content-Type: application/json"
```

### 3. Get Roles for Specific User (Admin Only)

```bash
curl -X GET http://localhost:3000/api/user-roles/user/{user-id} \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mapping-uuid",
      "user_id": "user-uuid",
      "role_id": "role-uuid",
      "assigned_at": "2024-01-01T00:00:00Z",
      "expires_at": null,
      "is_active": true,
      "role": {
        "id": "role-uuid",
        "name": "Department User",
        "description": "Basic user access",
        "permissions": {...}
      }
    }
  ],
  "count": 2
}
```

### 4. Get User with Roles (Admin Only)

```bash
curl -X GET http://localhost:3000/api/user-roles/user/{user-id}/with-roles \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "roles": [
      {
        "id": "role-uuid",
        "name": "Department User",
        "description": "Basic user access",
        "permissions": {...},
        "assigned_at": "2024-01-01T00:00:00Z",
        "expires_at": null,
        "is_active": true
      }
    ]
  }
}
```

### 5. Get Users by Role ID (Admin Only)

```bash
curl -X GET http://localhost:3000/api/user-roles/role/{role-id} \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mapping-uuid",
      "user_id": "user-uuid",
      "role_id": "role-uuid",
      "assigned_at": "2024-01-01T00:00:00Z",
      "is_active": true,
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "John Doe"
      }
    }
  ],
  "count": 5
}
```

### 6. Assign Role to User (Admin Only)

```bash
curl -X POST http://localhost:3000/api/user-roles \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid-here",
    "role_id": "role-uuid-here",
    "assigned_by": "admin-uuid-here"
  }'
```

**With Expiration Date:**
```bash
curl -X POST http://localhost:3000/api/user-roles \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid-here",
    "role_id": "role-uuid-here",
    "assigned_by": "admin-uuid-here",
    "expires_at": "2024-12-31T23:59:59Z"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-mapping-uuid",
    "user_id": "user-uuid",
    "role_id": "role-uuid",
    "assigned_by": "admin-uuid",
    "assigned_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-12-31T23:59:59Z",
    "is_active": true
  },
  "message": "Role assigned to user successfully"
}
```

### 7. Update User-Role Mapping (Admin Only)

```bash
curl -X PUT http://localhost:3000/api/user-roles/{mapping-id} \
  -H "Content-Type: application/json" \
  -d '{
    "expires_at": "2025-12-31T23:59:59Z",
    "is_active": true
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "mapping-uuid",
    "user_id": "user-uuid",
    "role_id": "role-uuid",
    "expires_at": "2025-12-31T23:59:59Z",
    "is_active": true,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "User-Role mapping updated successfully"
}
```

### 8. Remove Role from User by Mapping ID (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/user-roles/{mapping-id} \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Role removed from user successfully"
}
```

### 9. Remove Role from User by User ID and Role ID (Admin Only)

```bash
curl -X DELETE http://localhost:3000/api/user-roles/user/{user-id}/role/{role-id} \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Role removed from user successfully"
}
```

## User Management APIs (Updated)

### 1. Create User (Without Role Field)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepassword123",
    "name": "Jane Smith"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-user-uuid",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "User created successfully"
}
```

### 2. Get All Users

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Content-Type: application/json"
```

### 3. Get User by ID

```bash
curl -X GET http://localhost:3000/api/users/{user-id} \
  -H "Content-Type: application/json"
```

### 4. Update User

```bash
curl -X PUT http://localhost:3000/api/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  }'
```

### 5. Delete User

```bash
curl -X DELETE http://localhost:3000/api/users/{user-id} \
  -H "Content-Type: application/json"
```

## Complete Workflow Example

### Scenario: Creating a new user and assigning them the Department Admin role

#### Step 1: Create a new user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dept.admin@example.com",
    "password": "SecurePass123!",
    "name": "Department Admin User"
  }'
```

Save the returned `user_id`.

#### Step 2: Get the Department Admin role
```bash
curl -X GET http://localhost:3000/api/roles/name/Department%20Admin \
  -H "Content-Type: application/json"
```

Save the returned `role_id`.

#### Step 3: Assign the role to the user
```bash
curl -X POST http://localhost:3000/api/user-roles \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid-from-step-1",
    "role_id": "role-uuid-from-step-2",
    "assigned_by": "admin-user-uuid"
  }'
```

#### Step 4: Verify the assignment
```bash
curl -X GET http://localhost:3000/api/user-roles/user/{user-uuid}/with-roles \
  -H "Content-Type: application/json"
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Role ID is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized: No user information found"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden: User does not have required role. Required: Platform Administrator"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Role not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create role"
}
```

## Testing Tips

1. **Use Variables**: Store UUIDs in shell variables for easier testing:
   ```bash
   USER_ID="uuid-here"
   ROLE_ID="uuid-here"
   curl -X GET http://localhost:3000/api/user-roles/user/$USER_ID
   ```

2. **Pretty Print JSON**: Use `jq` for better readability:
   ```bash
   curl -X GET http://localhost:3000/api/roles | jq
   ```

3. **Save Tokens**: If using authentication, save your token:
   ```bash
   TOKEN="your-auth-token"
   curl -X GET http://localhost:3000/api/roles \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Test Scripts**: Create bash scripts for common workflows:
   ```bash
   #!/bin/bash
   # create-user-with-role.sh

   USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{"email":"'$1'","password":"'$2'","name":"'$3'"}')

   USER_ID=$(echo $USER_RESPONSE | jq -r '.data.id')
   echo "Created user: $USER_ID"

   # Assign role...
   ```

## Postman Collection

For easier testing, consider importing these endpoints into Postman:

1. Create a new collection named "Legal AI RBAC"
2. Add environment variables:
   - `base_url`: http://localhost:3000
   - `user_id`: (set after creating a user)
   - `role_id`: (set after fetching a role)
3. Import all endpoints from this document
4. Set up pre-request scripts for authentication if needed

## Notes

- Replace `{user-id}`, `{role-id}`, `{mapping-id}` with actual UUIDs
- Adjust the base URL (`http://localhost:3000`) to match your server configuration
- Add authentication headers if your API requires authentication
- All timestamps are in ISO 8601 format
- The `password` field is never returned in responses for security
