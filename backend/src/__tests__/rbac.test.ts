import { Request, Response, NextFunction } from 'express';
import {
  requireAuth,
  requireRole,
  requirePermission,
  AuthRequest,
} from '../middlewares/rbacMiddleware';
import { roleService } from '../services/roleService';
import { SystemRoles } from '../types/RoleTypes';

jest.mock('../services/roleService');

describe('RBAC Middleware Tests', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
      },
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('requireAuth middleware', () => {
    it('should call next() when user is authenticated', () => {
      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = undefined;

      requireAuth(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should call next() when user has required role', async () => {
      const mockUserRoles = [
        {
          role: { name: SystemRoles.PLATFORM_ADMIN },
        },
      ];

      (roleService.getUserRoles as jest.Mock).mockResolvedValue(mockUserRoles);

      const middleware = requireRole([SystemRoles.PLATFORM_ADMIN]);
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', async () => {
      const mockUserRoles = [
        {
          role: { name: SystemRoles.DEPARTMENT_USER },
        },
      ];

      (roleService.getUserRoles as jest.Mock).mockResolvedValue(mockUserRoles);

      const middleware = requireRole([SystemRoles.PLATFORM_ADMIN]);
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      const middleware = requireRole([SystemRoles.PLATFORM_ADMIN]);
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission middleware', () => {
    it('should call next() when user has required permission', async () => {
      (roleService.checkUserPermission as jest.Mock).mockResolvedValue(true);

      const middleware = requirePermission('documents', 'read');
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have required permission', async () => {
      (roleService.checkUserPermission as jest.Mock).mockResolvedValue(false);

      const middleware = requirePermission('documents', 'delete');
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      const middleware = requirePermission('documents', 'read');
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (roleService.checkUserPermission as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const middleware = requirePermission('documents', 'read');
      await middleware(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
