import axios from "axios"
import { API_ENDPOINTS } from "../constants/apiEndpoints"
import { toast } from "react-toastify"

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Interceptor for handling 401 errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem("refresh_token")
        const response = await axios.post(API_ENDPOINTS.REFRESH, { refresh: refreshToken })
        const newAccessToken = response.data.access
        localStorage.setItem("access_token", newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        toast.error("Session expired. Please log in again.")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export const login = (credentials) => apiClient.post(API_ENDPOINTS.LOGIN, credentials)
export const signup = (userData) => apiClient.post(API_ENDPOINTS.REGISTER, userData)
export const fetchUser = (token) =>
  apiClient.get(API_ENDPOINTS.USER, {
    headers: { Authorization: `Bearer ${token}` },
  })
export const logoutRequest = (accessToken, refreshToken) =>
  apiClient.post(API_ENDPOINTS.LOGOUT, { refresh: refreshToken }, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

export const uploadDocuments = (files, token) => {
  const formData = new FormData()
  files.forEach((fileObj) => {
    console.log("Appending file:", fileObj.file.name)
    formData.append("files", fileObj.file)
  })
  return apiClient.post("/documents/upload/", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  })
}
export const fetchDocuments = (token) =>
  apiClient.get("/documents/", {
    headers: { Authorization: `Bearer ${token}` },
  })

export const analyzeDocument = (documentId, query, chatHistory, token, extraData = {}) =>
  apiClient.post(
    "/analyze/",
    { document_id: documentId, query, chat_history: chatHistory, ...extraData },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

export const fetchChatHistory = (documentId, token) =>
  apiClient.get(`/chat-history/${documentId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const compareDocuments = (document1Id, document2Id, token, extraData = {}) =>
  apiClient.post(
    "/compare/",
    { document1_id: document1Id, document2_id: document2Id, ...extraData },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

export const fetchComparisonHistory = (token) =>
  apiClient.get("/comparison-history/", {
    headers: { Authorization: `Bearer ${token}` },
  })

export const fetchSavedNotes = (token) =>
  apiClient.get("/notes/", {
    headers: { Authorization: `Bearer ${token}` },
  })

export const saveNote = (data, token) =>
  apiClient.post("/notes/", data, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const updateNote = (noteId, data, token) =>
  apiClient.put(`/notes/${noteId}/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const deleteNote = (noteId, token) =>
  apiClient.delete(`/notes/${noteId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const fetchPosts = (token) =>
  apiClient.get("/posts/", {
    headers: { Authorization: `Bearer ${token}` },
  })

export const createPost = (data, token) =>
  apiClient.post("/posts/", data, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const interactWithPost = (postId, action, token) =>
  apiClient.post(`/posts/${postId}/interact/`, { action }, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const fetchComments = (postId, token) =>
  apiClient.get(`/posts/${postId}/comments/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const createComment = (postId, content, token) => {
  console.log("createComment payload:", content)
  return apiClient.post(`/posts/${postId}/comments/`, content, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// New function for user-specific comments
export const fetchUserComments = (token) =>
  apiClient.get("/comments/", {
    headers: { Authorization: `Bearer ${token}` },
  })


export const updateUser = (data, token) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value)
    }
  })
  return apiClient.put("/users/me/", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  })
}


export default apiClient