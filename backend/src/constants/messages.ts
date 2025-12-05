export const AUTH_MESSAGES = {
  EMAIL_PASSWORD_REQUIRED: 'Email and password are required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  LOGIN_ERROR: 'Internal server error during login',
  LOGIN_SUCCESS: 'Login successful',
};

export const USER_MESSAGES = {
  ID_REQUIRED: 'User ID is required',
  NOT_FOUND: 'User not found',
  FETCH_ERROR: 'Failed to fetch user',
  FETCH_ALL_ERROR: 'Failed to fetch users',
  CREATED_SUCCESS: 'User created successfully',
  CREATE_ERROR: 'Failed to create user',
  UPDATED_SUCCESS: 'User updated successfully',
  UPDATE_ERROR: 'Failed to update user',
  NO_UPDATE_DATA: 'No update data provided',
  DELETED_SUCCESS: 'User deleted successfully',
  DELETE_ERROR: 'Failed to delete user',
};

export const USE_CASE_MESSAGES = {
  ID_REQUIRED: 'Use case ID is required',
  NOT_FOUND: 'Use case not found',
  FETCH_ERROR: 'Failed to fetch use case',
  FETCH_ALL_ERROR: 'Failed to fetch use cases',
  CREATED_SUCCESS: 'Use case created successfully',
  CREATE_ERROR: 'Failed to create use case',
  UPDATED_SUCCESS: 'Use case updated successfully',
  UPDATE_ERROR: 'Failed to update use case',
  NO_UPDATE_DATA: 'No update data provided',
  DELETED_SUCCESS: 'Use case deleted successfully',
  DELETE_ERROR: 'Failed to delete use case',
};

export const VALIDATION_MESSAGES = {
  TITLE_REQUIRED: 'Title is required',
  SHORT_DESCRIPTION_REQUIRED: 'Short description is required',
  FULL_DESCRIPTION_REQUIRED: 'Full description is required',
  INVALID_DEPARTMENT: 'Invalid department. Must be one of:',
  INVALID_STATUS: 'Invalid status. Must be one of:',
  OWNER_NAME_REQUIRED: 'Owner name is required',
  OWNER_EMAIL_REQUIRED: 'Valid owner email is required',
  TECHNOLOGY_STACK_ARRAY: 'Technology stack must be an array',
  TAGS_ARRAY: 'Tags must be an array',
  INTERNAL_LINKS_OBJECT: 'Internal links must be an object',
  EMAIL_REQUIRED: 'Valid email is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
  NAME_REQUIRED: 'Name is required',
  ROLE_REQUIRED: 'Role is required',
  INVALID_EMAIL: 'Invalid email format',
  NAME_EMPTY: 'Name cannot be empty',
  ROLE_EMPTY: 'Role cannot be empty',
};

export const ROLE_MESSAGES = {
  ID_REQUIRED: 'Role ID is required',
  NOT_FOUND: 'Role not found',
  FETCH_ERROR: 'Failed to fetch role',
  FETCH_ALL_ERROR: 'Failed to fetch roles',
  CREATED_SUCCESS: 'Role created successfully',
  CREATE_ERROR: 'Failed to create role',
  UPDATED_SUCCESS: 'Role updated successfully',
  UPDATE_ERROR: 'Failed to update role',
  NO_UPDATE_DATA: 'No update data provided',
  DELETED_SUCCESS: 'Role deleted successfully',
  DELETE_ERROR: 'Failed to delete role',
  SYSTEM_ROLE_DELETE: 'Cannot delete system roles',
  ROLE_HAS_ASSIGNMENTS: 'Cannot delete role with active user assignments',
  ASSIGNMENT_SUCCESS: 'Role assigned to user successfully',
  ASSIGNMENT_ERROR: 'Failed to assign role to user',
  UNASSIGNMENT_SUCCESS: 'Role removed from user successfully',
  UNASSIGNMENT_ERROR: 'Failed to remove role from user',
  ASSIGNMENT_NOT_FOUND: 'Role assignment not found',
  USER_ROLES_FETCH_ERROR: 'Failed to fetch user roles',
  ROLE_USERS_FETCH_ERROR: 'Failed to fetch users for role',
  PERMISSION_DENIED: 'Permission denied',
  INVALID_PERMISSIONS: 'Invalid permissions structure',
};

export const RBAC_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  INVALID_TOKEN: 'Invalid authentication token',
  TOKEN_REQUIRED: 'Authentication token is required',
};
