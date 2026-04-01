import { create } from 'zustand'
import api from '@/lib/axios'

export const useRbacStore = create((set, get) => ({
  // ── Roles ──────────────────────────────────────────────────────────
  roles:       [],
  roleMeta:    null,
  rolesLoading: false,

  // ── Permissions ────────────────────────────────────────────────────
  permissions:       [],
  permissionMeta:    null,
  permissionsLoading: false,

  // ── Grouped permissions (for checkboxes) ──────────────────────────
  groupedPermissions: [],

  // ── Role CRUD ──────────────────────────────────────────────────────
  fetchRoles: async (params = {}) => {
    set({ rolesLoading: true })
    try {
      const { data } = await api.get('/v1/roles', { params })
      set({ roles: data.data, roleMeta: data, rolesLoading: false })
    } catch {
      set({ rolesLoading: false })
      throw new Error('Failed to load roles.')
    }
  },

  createRole: async (payload) => {
    const { data } = await api.post('/v1/roles', payload)
    return data.data
  },

  updateRole: async (id, payload) => {
    const { data } = await api.put(`/v1/roles/${id}`, payload)
    return data.data
  },

  deleteRole: async (id) => {
    await api.delete(`/v1/roles/${id}`)
  },

  // ── Permission assignment ──────────────────────────────────────────
  fetchRolePermissions: async (roleId) => {
    const { data } = await api.get(`/v1/roles/${roleId}/permissions`)
    return data.data
  },

  syncRolePermissions: async (roleId, permissionIds) => {
    const { data } = await api.post(`/v1/roles/${roleId}/permissions/sync`, {
      permissions: permissionIds,
    })
    return data.data
  },

  // ── Permission CRUD ────────────────────────────────────────────────
  fetchPermissions: async (params = {}) => {
    set({ permissionsLoading: true })
    try {
      const { data } = await api.get('/v1/permissions', { params })
      set({ permissions: data.data, permissionMeta: data, permissionsLoading: false })
    } catch {
      set({ permissionsLoading: false })
      throw new Error('Failed to load permissions.')
    }
  },

  /** Loads grouped permissions into the store and returns the same array (for forms/modals). */
  fetchGroupedPermissions: async () => {
    try {
      const { data } = await api.get('/v1/permissions/grouped')
      set({ groupedPermissions: data.data })
      return data.data
    } catch {
      set({ groupedPermissions: [] })
      return []
    }
  },

  createPermission: async (payload) => {
    const { data } = await api.post('/v1/permissions', payload)
    return data.data
  },

  updatePermission: async (id, payload) => {
    const { data } = await api.put(`/v1/permissions/${id}`, payload)
    return data.data
  },

  deletePermission: async (id) => {
    await api.delete(`/v1/permissions/${id}`)
  },

  // ── User role assignment ───────────────────────────────────────────
  fetchUserRoles: async (userId) => {
    const { data } = await api.get(`/v1/users/${userId}/roles`)
    return data.data
  },

  syncUserRoles: async (userId, roleIds) => {
    const { data } = await api.post(`/v1/users/${userId}/roles/sync`, { roles: roleIds })
    return data.data
  },

  fetchUserPermissions: async (userId) => {
    const { data } = await api.get(`/v1/users/${userId}/permissions`)
    return data.data
  },
}))
