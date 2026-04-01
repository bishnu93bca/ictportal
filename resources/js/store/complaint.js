import { create } from 'zustand'
import api from '@/lib/axios'

export const useComplaintStore = create((set) => ({
  complaints: [],
  meta: null,
  isLoading: false,
  error: null,

  fetchComplaints: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/v1/complaints', { params })
      set({ complaints: data.data, meta: data, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.message ?? 'Failed to load complaints.',
      })
    }
  },

  /** POST with multipart/form-data to support file attachments */
  createComplaint: async (fields, files = []) => {
    const formData = new FormData()
    Object.entries(fields).forEach(([k, v]) => {
      if (v != null && v !== '') formData.append(k, v)
    })
    files.forEach((f) => formData.append('attachments[]', f))

    const { data } = await api.post('/v1/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.complaint
  },

  /** PUT text fields only (JSON) */
  updateComplaint: async (id, payload) => {
    const { data } = await api.put(`/v1/complaints/${id}`, payload)
    return data.complaint
  },

  /** POST additional attachments for an existing complaint */
  uploadAttachments: async (id, files) => {
    const formData = new FormData()
    files.forEach((f) => formData.append('attachments[]', f))
    const { data } = await api.post(`/v1/complaints/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.attachments
  },

  /** DELETE a single attachment */
  deleteAttachment: async (complaintId, attachmentId) => {
    await api.delete(`/v1/complaints/${complaintId}/attachments/${attachmentId}`)
  },

  updateStatus: async (id, payload) => {
    const { data } = await api.patch(`/v1/complaints/${id}/status`, payload)
    return data.complaint
  },

  deleteComplaint: async (id) => {
    await api.delete(`/v1/complaints/${id}`)
    set((state) => ({
      complaints: state.complaints.filter((c) => c.id !== id),
    }))
  },
}))

/** Standalone UDISE lookup — returns school_name string or null */
export async function lookupUdise(code) {
  if (!code?.trim()) return null
  try {
    const { data } = await api.get('/v1/udise/lookup', { params: { code } })
    return data.school_name ?? null
  } catch {
    return null
  }
}
