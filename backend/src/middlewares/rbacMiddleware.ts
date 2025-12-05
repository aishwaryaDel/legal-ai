import { Request, Response, NextFunction } from 'express';
import { userRoleRepository } from '../repository/userRoleRepository';
import { RolePermissions } from '../types/RoleTypes';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  userPermissions?: RolePermissions;
}

export const checkPermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User not authenticated',
        });
        return;
      }

      const userRoles = await userRoleRepository.findByUserId(userId, false);

      if (!userRoles || userRoles.length === 0) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: User has no roles assigned',
        });
        return;
      }

      let hasPermission = false;
      const mergedPermissions: RolePermissions = {};

      for (const userRole of userRoles) {
        const role = (userRole as any).role;
        if (role && role.permissions) {
          Object.keys(role.permissions).forEach(key => {
            if (!mergedPermissions[key]) {
              mergedPermissions[key] = {};
            }
            Object.assign(mergedPermissions[key], role.permissions[key]);
          });

          if (role.permissions[resource] && role.permissions[resource][action] === true) {
            hasPermission = true;
          }
        }
      }

      req.userPermissions = mergedPermissions;

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: `Forbidden: User does not have permission to ${action} ${resource}`,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };
};

export const checkRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: User not authenticated',
        });
        return;
      }

      const userRoles = await userRoleRepository.findByUserId(userId, false);

      if (!userRoles || userRoles.length === 0) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: User has no roles assigned',
        });
        return;
      }

      const userRoleNames = userRoles.map((ur: any) => ur.role?.name).filter(Boolean);
      const hasAllowedRole = userRoleNames.some(roleName => allowedRoles.includes(roleName));

      if (!hasAllowedRole) {
        res.status(403).json({
          success: false,
          error: `Forbidden: User must have one of these roles: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };
};

export const isPlatformAdmin = () => {
  return checkRole(['Platform Administrator']);
};

export const isLegalAdmin = () => {
  return checkRole(['Platform Administrator', 'Legal Admin']);
};

export const isDepartmentAdmin = () => {
  return checkRole(['Platform Administrator', 'Legal Admin', 'Department Admin']);
};

export const attachUserPermissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      next();
      return;
    }

    const userRoles = await userRoleRepository.findByUserId(userId, false);

    if (!userRoles || userRoles.length === 0) {
      next();
      return;
    }

    const mergedPermissions: RolePermissions = {};

    for (const userRole of userRoles) {
      const role = (userRole as any).role;
      if (role && role.permissions) {
        Object.keys(role.permissions).forEach(key => {
          if (!mergedPermissions[key]) {
            mergedPermissions[key] = {};
          }
          Object.assign(mergedPermissions[key], role.permissions[key]);
        });
      }
    }

    req.userPermissions = mergedPermissions;
    next();
  } catch (error) {
    next();
  }
};
