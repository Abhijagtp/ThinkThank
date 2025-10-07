import { useState, useEffect } from "react"
import { User, Save, X, Upload } from "lucide-react"
import Card from "../ui/Card"
import Button from "../ui/Button"
import { updateUser, fetchUser } from "../../utils/api"
import { toast } from "react-toastify"

// Inline CSS (aligned with DashboardHome.jsx)
const styles = `
  .avatar-fallback { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
    color: white; 
    font-weight: 500; 
    font-size: 1.5rem; 
    text-transform: uppercase; 
  }
  .avatar-preview {
    position: relative;
    cursor: pointer;
    transition: opacity 200ms ease-in-out;
  }
  .avatar-preview:hover {
    opacity: 0.8;
  }
`

const getInitials = (username) => {
  if (!username) return "U"
  const names = username.split(" ")
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`
    : username.slice(0, 2)
}

const ProfileEditPage = ({ user, accessToken, setCurrentPage }) => {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    company_name: user?.company_name || "",
    avatar: null,
  })
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }))
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await updateUser(formData, accessToken)
      toast.success("Profile updated successfully")
      // Refresh user data
      const updatedUser = await fetchUser(accessToken)
      setCurrentPage("profile")
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview !== user?.avatar) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview, user?.avatar])

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <style>{styles}</style>
      <Card className="p-6 bg-gray-900/90 border border-gray-700/30 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Profile</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="avatar-preview">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border border-gray-600/50"
                />
              ) : (
                <div className="w-24 h-24 rounded-full avatar-fallback">
                  {getInitials(formData.username)}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                id="avatar-upload"
              />
            </div>
            <label htmlFor="avatar-upload" className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Profile Image
            </label>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="company_name"
              id="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              onClick={() => setCurrentPage("profile")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-all duration-200"
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all duration-200"
              disabled={isLoading}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ProfileEditPage