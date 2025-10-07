import { useState, useEffect } from "react"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import LoginPage from "./components/auth/LoginPage"
import SignupPage from "./components/auth/SignupPage"
import Dashboard from "./components/dashboard/Dashboard"
import { handleLogin, handleSignup, handleLogout, checkAuth } from "./utils/auth"

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState("login")

  useEffect(() => {
    checkAuth(setAccessToken, setUser, setCurrentView)
  }, [])

  const onLogin = async (credentials) => {
    setIsLoading(true)
    try {
      await handleLogin(credentials, setAccessToken, setUser, setCurrentView)
    } catch (error) {
      // Error handling in handleLogin
    } finally {
      setIsLoading(false)
    }
  }

  const onSignup = async (userData) => {
    setIsLoading(true)
    try {
      await handleSignup(userData, setAccessToken, setUser, setCurrentView)
    } catch (error) {
      // Error handling in handleSignup
    } finally {
      setIsLoading(false)
    }
  }

  const switchToSignup = () => setIsLogin(false)
  const switchToLogin = () => setIsLogin(true)

  const handleAppLogout = () => {
    handleLogout(accessToken, setAccessToken, setUser, setCurrentView)
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      {currentView === "dashboard" ? (
        <Dashboard
          user={user}
          onLogout={handleAppLogout}
          accessToken={accessToken}
          isLoading={isLoading}
        />
      ) : (
        <div className="">
          {isLogin ? (
            <LoginPage
              onLogin={onLogin}
              onSwitchToSignup={switchToSignup}
              isLoading={isLoading}
            />
          ) : (
            <SignupPage
              onSignup={onSignup}
              onSwitchToLogin={switchToLogin}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </>
  )
}

export default App