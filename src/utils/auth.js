import { toast } from "react-toastify";
import { login, signup, logoutRequest, fetchUser } from "./api";

// Helper function to extract and format DRF serializer errors
const getErrorMessage = (errorData) => {
  if (errorData && typeof errorData === 'object') {
    // If it's a serializer error object (e.g., {"email": ["error msg"]})
    if (Object.keys(errorData).some(key => Array.isArray(errorData[key]))) {
      // Extract the first error message for simplicity (or join all for more detail)
      const firstError = Object.values(errorData)[0];
      return Array.isArray(firstError) ? firstError[0] : firstError;
    }
    // If it's a simple {"error": "msg"} object
    if (errorData.error) {
      return errorData.error;
    }
  }
  return null;
};

export const handleLogin = async (credentials, setAccessToken, setUser, setCurrentView) => {
  try {
    console.log("Login payload:", credentials);
    const response = await login(credentials);
    console.log("Login response:", response.data);
    const { access, refresh, user } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    setAccessToken(access);
    setUser(user);
    setCurrentView("dashboard");
    toast.success("Login successful!");
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    const errorMsg = getErrorMessage(error.response?.data);
    toast.error(errorMsg || "Login failed. Please try again.");
    throw error;
  }
};

export const handleSignup = async (userData, setAccessToken, setUser, setCurrentView) => {
  try {
    console.log("Signup payload:", userData);
    const response = await signup(userData);
    console.log("Signup response:", response.data);
    const { email } = response.data;
    await handleLogin({ email: email.toLowerCase(), password: userData.password }, setAccessToken, setUser, setCurrentView);
    toast.success("Signup successful!");
  } catch (error) {
    console.error("Signup failed:", error.response?.data || error.message);
    const errorMsg = getErrorMessage(error.response?.data);
    toast.error(errorMsg || "Signup failed. Please try again.");
    throw error;
  }
};

export const handleLogout = async (accessToken, setAccessToken, setUser, setCurrentView) => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    await logoutRequest(accessToken, refreshToken);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setUser(null);
    setCurrentView("login");
    toast.success("Logged out successfully!");
  } catch (error) {
    console.error("Logout failed:", error.response?.data || error.message);
    const errorMsg = getErrorMessage(error.response?.data);
    toast.error(errorMsg || "Logout failed. Please try again.");
    throw error;
  }
};

export const checkAuth = async (setAccessToken, setUser, setCurrentView) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    try {
      const response = await fetchUser(token);
      setAccessToken(token);
      setUser(response.data);
      setCurrentView("dashboard");
    } catch (error) {
      console.error("Check auth failed:", error.response?.data || error.message);
      const errorMsg = getErrorMessage(error.response?.data);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setCurrentView("login");
      toast.error(errorMsg || "Session expired. Please log in again.");
    }
  }
};