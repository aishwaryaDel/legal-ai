import { Request, Response, NextFunction } from 'express';
import { userRoleRepository } from '../repository/userRoleRepository';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: Array<{
      id: string;
      name: string;
      permissions: any;
    }>;
  };
}

export const checkRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: No user information found',
        });
        return;
      }

      const userId = req.user.id;
      const userRoles = await userRoleRepository.findByUserId(userId);

      if (!userRoles || userRoles.length === 0) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: User has no roles assigned',
        });
        return;
      }

      const userRoleNames = userRoles.map((ur: any) => ur.role.name);
      const hasRequiredRole = allowedRoles.some((role) => userRoleNames.includes(role));

      if (!hasRequiredRole) {
        res.status(403).json({
          success: false,
          error: `Forbidden: User does not have required role. Required: ${allowedRoles.join(', ')}`,
        });
        return;
      }

      req.user.roles = userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions,
      }));

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };
};

export const checkPermission = (resource: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: No user information found',
        });
        return;
      }

      const userId = req.user.id;
      const userRoles = await userRoleRepository.findByUserId(userId);

      if (!userRoles || userRoles.length === 0) {
        res.status(403).json({
          success: false,
          error: 'Forbidden: User has no roles assigned',
        });
        return;
      }

      let hasPermission = false;

      for (const userRole of userRoles) {
        const role: any = userRole;
        const permissions = role.role?.permissions || {};

        if (permissions[resource] && permissions[resource][action] === true) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: `Forbidden: User does not have permission to ${action} ${resource}`,
        });
        return;
      }

      req.user.roles = userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions,
      }));

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  };
};

export const attachUserRoles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.id) {
      next();
      return;
    }

    const userId = req.user.id;
    const userRoles = await userRoleRepository.findByUserId(userId);

    if (userRoles && userRoles.length > 0) {
      req.user.roles = userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.permissions,
      }));
    }

    next();
  } catch (error) {
    next(error);
  }
};
