import request from 'supertest';
import app from '../app';
import { Role } from '../models/Role';
import { UserRole } from '../models/UserRole';
import { User } from '../models/User';
import { sequelize } from '../repository/sequelize';

describe('Role API Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/roles', () => {
    it('should return all roles', async () => {
      const response = await request(app).get('/api/roles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/roles', () => {
    it('should create a new role', async () => {
      const newRole = {
        name: 'Test Role',
        description: 'A test role for unit testing',
        permissions: {
          documents: ['read', 'create'],
          users: ['read'],
        },
      };

      const response = await request(app).post('/api/roles').send(newRole);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newRole.name);
      expect(response.body.data.description).toBe(newRole.description);
    });

    it('should fail to create a role with duplicate name', async () => {
      const duplicateRole = {
        name: 'Test Role',
        description: 'Duplicate role',
        permissions: {
          documents: ['read'],
        },
      };

      const response = await request(app).post('/api/roles').send(duplicateRole);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should fail without required fields', async () => {
      const invalidRole = {
        description: 'Missing name and permissions',
      };

      const response = await request(app).post('/api/roles').send(invalidRole);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/roles/:id', () => {
    it('should return a role by id', async () => {
      const role = await Role.create({
        name: 'Fetch Test Role',
        description: 'Role for testing fetch by ID',
        permissions: { documents: ['read'] },
        is_system_role: false,
      });

      const response = await request(app).get(`/api/roles/${role.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(role.id);
      expect(response.body.data.name).toBe('Fetch Test Role');
    });

    it('should return 404 for non-existent role', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await request(app).get(`/api/roles/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/roles/:id', () => {
    it('should update a role', async () => {
      const role = await Role.create({
        name: 'Update Test Role',
        description: 'Role for testing updates',
        permissions: { documents: ['read'] },
        is_system_role: false,
      });

      const updates = {
        description: 'Updated description',
        permissions: {
          documents: ['read', 'create', 'update'],
        },
      };

      const response = await request(app)
        .put(`/api/roles/${role.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updates.description);
    });

    it('should return 404 when updating non-existent role', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440099';
      const response = await request(app)
        .put(`/api/roles/${fakeId}`)
        .send({ description: 'Update' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/roles/:id', () => {
    it('should delete a non-system role without assignments', async () => {
      const role = await Role.create({
        name: 'Delete Test Role',
        description: 'Role for testing deletion',
        permissions: { documents: ['read'] },
        is_system_role: false,
      });

      const response = await request(app).delete(`/api/roles/${role.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail to delete a system role', async () => {
      const systemRole = await Role.create({
        name: 'System Role Test',
        description: 'Cannot delete this',
        permissions: { documents: ['read'] },
        is_system_role: true,
      });

      const response = await request(app).delete(`/api/roles/${systemRole.id}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('User Role Assignment', () => {
    let testUser: User;
    let testRole: Role;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user',
      });

      testRole = await Role.create({
        name: 'Assignment Test Role',
        description: 'Role for testing assignments',
        permissions: { documents: ['read'] },
        is_system_role: false,
      });
    });

    it('should assign a role to a user', async () => {
      const response = await request(app)
        .post(`/api/users/${testUser.id}/roles`)
        .send({ role_id: testRole.id });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should get all roles for a user', async () => {
      await UserRole.create({
        user_id: testUser.id,
        role_id: testRole.id,
        is_active: true,
      });

      const response = await request(app).get(`/api/users/${testUser.id}/roles`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should remove a role from a user', async () => {
      await UserRole.create({
        user_id: testUser.id,
        role_id: testRole.id,
        is_active: true,
      });

      const response = await request(app).delete(
        `/api/users/${testUser.id}/roles/${testRole.id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should get all users with a specific role', async () => {
      await UserRole.create({
        user_id: testUser.id,
        role_id: testRole.id,
        is_active: true,
      });

      const response = await request(app).get(`/api/roles/${testRole.id}/users`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get user permissions', async () => {
      await UserRole.create({
        user_id: testUser.id,
        role_id: testRole.id,
        is_active: true,
      });

      const response = await request(app).get(
        `/api/users/${testUser.id}/permissions`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
