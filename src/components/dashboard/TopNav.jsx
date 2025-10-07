import { useState } from "react"
import { Search, Bell, User, LogOut, Settings } from "lucide-react"

const TopNav = ({ user, onLogout, isLoading, setCurrentPage }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Helper for profile image fallback (same as DashboardHome.jsx)
  const getInitials = (username) => {
    if (!username) return "U"
    const names = username.split(" ")
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`
      : username.slice(0, 2)
  }

  return (
    <header className="bg-gray-900/90 border-b border-gray-700/30 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents, insights, or ask AI..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4 ml-4">
          {/* Notifications */}
          <button
            disabled={isLoading}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-800/80 rounded-lg transition-all duration-200"
              disabled={isLoading}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.username} avatar`}
                  className="w-8 h-8 rounded-full object-cover border border-gray-600/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-medium uppercase">
                  {getInitials(user?.username)}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-white">{user?.username || "User"}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800/90 border border-gray-700/30 rounded-lg shadow-xl z-50">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setCurrentPage("profile")
                      setShowProfileMenu(false)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all duration-200"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <button
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700/80 transition-all duration-200"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                  <hr className="my-2 border-gray-600/50" />
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-700/80 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNav