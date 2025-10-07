"use client"
import { Home, Upload, BarChart3, GitCompare, BookOpen, Settings, HelpCircle } from "lucide-react"

const Sidebar = ({ currentPage, onPageChange }) => {
  const menuItems = [
    { id: "pulse", label: "Pulse", icon: Home },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "analysis", label: "Analysis", icon: BarChart3 },
    { id: "comparison", label: "Comparison", icon: GitCompare },
    { id: "notes", label: "Saved Notes", icon: BookOpen },
  ]

  const bottomItems = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help", icon: HelpCircle },
  ]

  const MenuItem = ({ item, isActive, onClick }) => (
    <button
      onClick={() => onClick(item.id)}
      className={`
        w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200
        ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
            : "text-gray-300 hover:text-white hover:bg-gray-800"
        }
      `}
    >
      <item.icon className="w-5 h-5 mr-3" />
      <span className="font-medium">{item.label}</span>
    </button>
  )

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-white">AI</span>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-white">Research</h1>
            <p className="text-xs text-gray-400">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <MenuItem key={item.id} item={item} isActive={currentPage === item.id} onClick={onPageChange} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        {bottomItems.map((item) => (
          <MenuItem key={item.id} item={item} isActive={currentPage === item.id} onClick={onPageChange} />
        ))}
      </div>
    </div>
  )
}

export default Sidebar
