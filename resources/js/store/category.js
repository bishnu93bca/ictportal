import { create } from 'zustand'
import api from '@/lib/axios'

export const useCategoryStore = create((set) => ({
  // ── Categories ─────────────────────────────────────────────────────
  categories:       [],
  categoryMeta:     null,
  categoriesLoading: false,

  // ── Sub-categories ─────────────────────────────────────────────────
  subCategories:       [],
  subCategoryMeta:     null,
  subCategoriesLoading: false,

  // ── Dropdown: all active categories ───────────────────────────────
  allCategories:    [],

  // ── Dropdown: sub-categories filtered by category ─────────────────
  allSubCategories: [],

  // ── Category CRUD ──────────────────────────────────────────────────
  fetchCategories: async (params = {}) => {
    set({ categoriesLoading: true })
    try {
      const { data } = await api.get('/v1/categories', { params })
      set({ categories: data.data, categoryMeta: data, categoriesLoading: false })
    } catch {
      set({ categoriesLoading: false })
      throw new Error('Failed to load categories.')
    }
  },

  fetchAllCategories: async () => {
    try {
      const { data } = await api.get('/v1/categories/all')
      set({ allCategories: data.data })
    } catch {
      // silently fail — dropdown will be empty
    }
  },

  /** Load all sub-categories for a given category_id (for dropdowns). */
  fetchSubCategoriesAll: async (categoryId = null) => {
    if (!categoryId) { set({ allSubCategories: [] }); return }
    try {
      const params = { per_page: 100, sort_by: 'name', sort_dir: 'asc', category_id: categoryId }
      const { data } = await api.get('/v1/sub-categories', { params })
      set({ allSubCategories: data.data ?? [] })
    } catch {
      set({ allSubCategories: [] })
    }
  },

  createCategory: async (payload) => {
    const { data } = await api.post('/v1/categories', payload)
    return data.data
  },

  updateCategory: async (id, payload) => {
    const { data } = await api.put(`/v1/categories/${id}`, payload)
    return data.data
  },

  deleteCategory: async (id) => {
    await api.delete(`/v1/categories/${id}`)
  },

  // ── Sub-category CRUD ──────────────────────────────────────────────
  fetchSubCategories: async (params = {}) => {
    set({ subCategoriesLoading: true })
    try {
      const { data } = await api.get('/v1/sub-categories', { params })
      set({ subCategories: data.data, subCategoryMeta: data, subCategoriesLoading: false })
    } catch {
      set({ subCategoriesLoading: false })
      throw new Error('Failed to load sub-categories.')
    }
  },

  createSubCategory: async (payload) => {
    const { data } = await api.post('/v1/sub-categories', payload)
    return data.data
  },

  updateSubCategory: async (id, payload) => {
    const { data } = await api.put(`/v1/sub-categories/${id}`, payload)
    return data.data
  },

  deleteSubCategory: async (id) => {
    await api.delete(`/v1/sub-categories/${id}`)
  },
}))
