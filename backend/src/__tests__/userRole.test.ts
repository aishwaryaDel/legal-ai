import request from 'supertest';
import app from '../app';
import { UserRole } from '../models/UserRole';
import { userRoleRepository } from '../repository/userRoleRepository';
import { roleRepository } from '../repository/roleRepository';
import { userRepository } from '../repository/userRepository';

jest.mock('../repository/userRoleRepository');
jest.mock('../repository/roleRepository');
jest.mock('../repository/userRepository');

describe('UserRole API Endpoints', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockRoleId = '123e4567-e89b-12d3-a456-426614174001';

  const mockUserRole = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    user_id: mockUserId,
    role_id: mockRoleId,
    assigned_by: null,
    assigned_at: new Date(),
    expires_at: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    role: {
      id: mockRoleId,
      name: 'Test Role',
      permissions: { users: { read: true } }
    },
    user: {
      id: mockUserId,
      email: 'test@example.com',
      name: 'Test User'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user-roles', () => {
    it('should return all user-role mappings', async () => {
      (userRoleRepository.findAll as jest.Mock).mockResolvedValue([mockUserRole]);

      const response = await request(app).get('/api/user-roles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].user_id).toBe(mockUserId);
    });

    it('should handle errors', async () => {
      (userRoleRepository.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/user-roles');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user-roles/:id', () => {
    it('should return a user-role mapping by ID', async () => {
      (userRoleRepository.findById as jest.Mock).mockResolvedValue(mockUserRole);

      const response = await request(app).get(`/api/user-roles/${mockUserRole.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(mockUserId);
    });

    it('should return 404 if mapping not found', async () => {
      (userRoleRepository.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/user-roles/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user-roles/user/:userId', () => {
    it('should return all roles for a user', async () => {
      (userRoleRepository.findByUserId as jest.Mock).mockResolvedValue([mockUserRole]);

      const response = await request(app).get(`/api/user-roles/user/${mockUserId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(userRoleRepository.findByUserId).toHaveBeenCalledWith(mockUserId, false);
    });

    it('should include inactive mappings when specified', async () => {
      (userRoleRepository.findByUserId as jest.Mock).mockResolvedValue([mockUserRole]);

      const response = await request(app).get(`/api/user-roles/user/${mockUserId}?include_inactive=true`);

      expect(response.status).toBe(200);
      expect(userRoleRepository.findByUserId).toHaveBeenCalledWith(mockUserId, true);
    });
  });

  describe('GET /api/user-roles/role/:roleId', () => {
    it('should return all users with a specific role', async () => {
      (userRoleRepository.findByRoleId as jest.Mock).mockResolvedValue([mockUserRole]);

      const response = await request(app).get(`/api/user-roles/role/${mockRoleId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(userRoleRepository.findByRoleId).toHaveBeenCalledWith(mockRoleId, false);
    });
  });

  describe('POST /api/user-roles', () => {
    it('should assign a role to a user', async () => {
      const newMapping = {
        user_id: mockUserId,
        role_id: mockRoleId,
      };

      (userRepository.findById as jest.Mock).mockResolvedValue({ id: mockUserId });
      (roleRepository.findById as jest.Mock).mockResolvedValue({ id: mockRoleId });
      (userRoleRepository.findByUserAndRole as jest.Mock).mockResolvedValue(null);
      (userRoleRepository.create as jest.Mock).mockResolvedValue(mockUserRole);

      const response = await request(app)
        .post('/api/user-roles')
        .send(newMapping);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(mockUserId);
    });

    it('should return 400 if user_id is missing', async () => {
      const response = await request(app)
        .post('/api/user-roles')
        .send({ role_id: mockRoleId });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if role_id is missing', async () => {
      const response = await request(app)
        .post('/api/user-roles')
        .send({ user_id: mockUserId });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user-roles')
        .send({ user_id: mockUserId, role_id: mockRoleId });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should handle role not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue({ id: mockUserId });
      (roleRepository.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/user-roles')
        .send({ user_id: mockUserId, role_id: mockRoleId });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/user-roles/:id', () => {
    it('should update a user-role mapping', async () => {
      const updates = { is_active: false };

      (userRoleRepository.update as jest.Mock).mockResolvedValue(1);
      (userRoleRepository.findById as jest.Mock).mockResolvedValue({ ...mockUserRole, ...updates });

      const response = await request(app)
        .put(`/api/user-roles/${mockUserRole.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBe(false);
    });

    it('should return 404 if mapping not found', async () => {
      (userRoleRepository.update as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .put('/api/user-roles/nonexistent-id')
        .send({ is_active: false });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if no update data provided', async () => {
      const response = await request(app)
        .put(`/api/user-roles/${mockUserRole.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/user-roles/:id', () => {
    it('should soft delete a user-role mapping', async () => {
      (userRoleRepository.findById as jest.Mock).mockResolvedValue(mockUserRole);
      (userRoleRepository.softDelete as jest.Mock).mockResolvedValue(1);

      const response = await request(app).delete(`/api/user-roles/${mockUserRole.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(userRoleRepository.softDelete).toHaveBeenCalledWith(mockUserRole.id);
    });

    it('should hard delete when soft=false', async () => {
      (userRoleRepository.findById as jest.Mock).mockResolvedValue(mockUserRole);
      (userRoleRepository.delete as jest.Mock).mockResolvedValue(1);

      const response = await request(app).delete(`/api/user-roles/${mockUserRole.id}?soft=false`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(userRoleRepository.delete).toHaveBeenCalledWith(mockUserRole.id);
    });

    it('should return 404 if mapping not found', async () => {
      (userRoleRepository.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete('/api/user-roles/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/user-roles/user/:userId/role/:roleId', () => {
    it('should remove a role from a user', async () => {
      (userRoleRepository.findByUserAndRole as jest.Mock).mockResolvedValue(mockUserRole);
      (userRoleRepository.softDelete as jest.Mock).mockResolvedValue(1);

      const response = await request(app).delete(`/api/user-roles/user/${mockUserId}/role/${mockRoleId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 if mapping not found', async () => {
      (userRoleRepository.findByUserAndRole as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete(`/api/user-roles/user/${mockUserId}/role/${mockRoleId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
