import axios from 'axios'
import { getItem, removeItem } from '@/utils/secureStorage'

const fallbackBase = 'http://localhost:5050/api/v1'

const API_BASE_URL = import.meta.env.VITE_APPLICANT_API_BASE_URL || fallbackBase

export const APPLICANT_TOKEN_KEY = 'fcc_applicant_access_token'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

http.interceptors.request.use((config) => {
  const token = getItem(APPLICANT_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.headers['x-access-token'] = token
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/auth/')) {
        removeItem(APPLICANT_TOKEN_KEY)
        removeItem('fcc_applicant_user')
        removeItem('fcc_applicant_profile')
        window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
      }
    }
    return Promise.reject(error)
  }
)

export default http
