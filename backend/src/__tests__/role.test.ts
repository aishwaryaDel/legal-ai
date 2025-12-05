import request from 'supertest';
import app from '../app';
import { Role } from '../models/Role';
import { roleRepository } from '../repository/roleRepository';

jest.mock('../repository/roleRepository');

describe('Role API Endpoints', () => {
  const mockRole = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Role',
    description: 'Test role description',
    permissions: {
      users: { create: true, read: true, update: false, delete: false },
      documents: { create: true, read: true, update: true, delete: false }
    },
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/roles', () => {
    it('should return all active roles', async () => {
      (roleRepository.findAll as jest.Mock).mockResolvedValue([mockRole]);

      const response = await request(app).get('/api/roles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Role');
      expect(roleRepository.findAll).toHaveBeenCalledWith(false);
    });

    it('should return all roles including inactive when specified', async () => {
      (roleRepository.findAll as jest.Mock).mockResolvedValue([mockRole]);

      const response = await request(app).get('/api/roles?include_inactive=true');

      expect(response.status).toBe(200);
      expect(roleRepository.findAll).toHaveBeenCalledWith(true);
    });

    it('should handle errors', async () => {
      (roleRepository.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/roles');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/roles/:id', () => {
    it('should return a role by ID', async () => {
      (roleRepository.findById as jest.Mock).mockResolvedValue(mockRole);

      const response = await request(app).get(`/api/roles/${mockRole.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Role');
    });

    it('should return 404 if role not found', async () => {
      (roleRepository.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/roles/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/roles/name/:name', () => {
    it('should return a role by name', async () => {
      (roleRepository.findByName as jest.Mock).mockResolvedValue(mockRole);

      const response = await request(app).get('/api/roles/name/Test Role');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Role');
    });

    it('should return 404 if role not found', async () => {
      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/roles/name/Nonexistent Role');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/roles', () => {
    it('should create a new role', async () => {
      const newRoleData = {
        name: 'New Role',
        description: 'New role description',
        permissions: {
          users: { create: true, read: true, update: true, delete: false }
        },
      };

      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);
      (roleRepository.create as jest.Mock).mockResolvedValue({ ...mockRole, ...newRoleData });

      const response = await request(app)
        .post('/api/roles')
        .send(newRoleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Role');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/roles')
        .send({ description: 'No name provided' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate role names', async () => {
      (roleRepository.findByName as jest.Mock).mockResolvedValue(mockRole);

      const response = await request(app)
        .post('/api/roles')
        .send({ name: 'Test Role' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/roles/:id', () => {
    it('should update a role', async () => {
      const updates = { description: 'Updated description' };

      (roleRepository.findByName as jest.Mock).mockResolvedValue(null);
      (roleRepository.update as jest.Mock).mockResolvedValue(1);
      (roleRepository.findById as jest.Mock).mockResolvedValue({ ...mockRole, ...updates });

      const response = await request(app)
        .put(`/api/roles/${mockRole.id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should return 404 if role not found', async () => {
      (roleRepository.update as jest.Mock).mockResolvedValue(0);

      const response = await request(app)
        .put('/api/roles/nonexistent-id')
        .send({ description: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if no update data provided', async () => {
      const response = await request(app)
        .put(`/api/roles/${mockRole.id}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/roles/:id', () => {
    it('should soft delete a role', async () => {
      (roleRepository.findById as jest.Mock).mockResolvedValue(mockRole);
      (roleRepository.softDelete as jest.Mock).mockResolvedValue([1]);

      const response = await request(app).delete(`/api/roles/${mockRole.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(roleRepository.softDelete).toHaveBeenCalledWith(mockRole.id);
    });

    it('should hard delete a role when soft=false', async () => {
      (roleRepository.findById as jest.Mock).mockResolvedValue(mockRole);
      (roleRepository.delete as jest.Mock).mockResolvedValue(1);

      const response = await request(app).delete(`/api/roles/${mockRole.id}?soft=false`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(roleRepository.delete).toHaveBeenCalledWith(mockRole.id);
    });

    it('should return 404 if role not found', async () => {
      (roleRepository.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).delete('/api/roles/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
