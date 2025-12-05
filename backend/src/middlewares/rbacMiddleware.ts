import { Request, Response, NextFunction } from 'express';
import { roleService } from '../services/roleService';
import { RBAC_MESSAGES } from '../constants/messages';
import { SystemRoles } from '../types/RoleTypes';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: string[];
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !req.user.id) {
    res.status(401).json({
      success: false,
      error: RBAC_MESSAGES.UNAUTHORIZED,
    });
    return;
  }
  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: RBAC_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      const userRoles = await roleService.getUserRoles(req.user.id);
      const roleNames = userRoles.map((ur: any) => ur.role?.name).filter(Boolean);

      const hasRequiredRole = allowedRoles.some(role => roleNames.includes(role));

      if (!hasRequiredRole) {
        res.status(403).json({
          success: false,
          error: RBAC_MESSAGES.INSUFFICIENT_PERMISSIONS,
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      req.user.roles = roleNames;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Permission check failed',
      });
    }
  };
};

export const requirePermission = (resource: string, permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: RBAC_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      const hasPermission = await roleService.checkUserPermission(
        req.user.id,
        resource,
        permission
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: RBAC_MESSAGES.INSUFFICIENT_PERMISSIONS,
          message: `You do not have permission to ${permission} ${resource}`,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Permission check failed',
      });
    }
  };
};

export const requireAnyPermission = (permissions: Array<{ resource: string; permission: string }>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: RBAC_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      let hasAnyPermission = false;
      for (const { resource, permission } of permissions) {
        const hasPermission = await roleService.checkUserPermission(
          req.user.id,
          resource,
          permission
        );
        if (hasPermission) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        res.status(403).json({
          success: false,
          error: RBAC_MESSAGES.INSUFFICIENT_PERMISSIONS,
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Permission check failed',
      });
    }
  };
};

export const requireAllPermissions = (permissions: Array<{ resource: string; permission: string }>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: RBAC_MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      for (const { resource, permission } of permissions) {
        const hasPermission = await roleService.checkUserPermission(
          req.user.id,
          resource,
          permission
        );
        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: RBAC_MESSAGES.INSUFFICIENT_PERMISSIONS,
            message: `You do not have permission to ${permission} ${resource}`,
          });
          return;
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Permission check failed',
      });
    }
  };
};

export const requirePlatformAdmin = requireRole([SystemRoles.PLATFORM_ADMIN]);

export const requireLegalAdmin = requireRole([
  SystemRoles.PLATFORM_ADMIN,
  SystemRoles.LEGAL_ADMIN,
]);

export const requireDepartmentAdmin = requireRole([
  SystemRoles.PLATFORM_ADMIN,
  SystemRoles.LEGAL_ADMIN,
  SystemRoles.DEPARTMENT_ADMIN,
]);

export const mockAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  req.user = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@example.com',
    roles: [SystemRoles.PLATFORM_ADMIN],
  };
  next();
};
