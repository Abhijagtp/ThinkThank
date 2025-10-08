const API_URL = process.env.REACT_APP_API_BASE_URL;

export const API_ENDPOINTS = {
  LOGIN: `${API_URL}/login/`,
  REGISTER: `${API_URL}/register/`,
  USER: `${API_URL}/user/`,
  LOGOUT: `${API_URL}/logout/`,
   DOCUMENT_UPLOAD: `${API_URL}/documents/upload/`,
  DOCUMENT_LIST: `${API_URL}/documents/`,
};