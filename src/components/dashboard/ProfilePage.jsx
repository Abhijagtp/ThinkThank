import { useState, useEffect } from "react"
import { User, Edit2, FileText, Bookmark, File, Heart } from "lucide-react"
import Card from "../ui/Card"
import Button from "../ui/Button"
import { fetchPosts, fetchDocuments, fetchSavedNotes } from "../../utils/api"
import { toast } from "react-toastify"

// Inline CSS (aligned with DashboardHome.jsx)
const styles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .profile-card { 
    background: rgba(255, 255, 255, 0.05); 
    border-radius: 0.75rem; 
    border: 1px solid rgba(255, 255, 255, 0.1); 
  }
  .activity-item:hover { 
    background: rgba(255, 255, 255, 0.08); 
    transition: background 200ms ease-in-out; 
  }
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
  .tab { 
    border-bottom: 2px solid transparent; 
    transition: all 200ms ease-in-out; 
  }
  .tab.active { 
    border-bottom-color: #3b82f6; 
    color: white; 
  }
  .tab:hover { 
    color: white; 
    border-bottom-color: rgba(59, 130, 246, 0.5); 
  }
`

// Helper for initials (same as DashboardHome.jsx)
const getInitials = (username) => {
  if (!username) return "U"
  const names = username.split(" ")
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`
    : username.slice(0, 2)
}

// Badge component (same as DashboardHome.jsx)
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-800/80 text-gray-300 border border-gray-700/50 ${className}`}>
    {children}
  </span>
)

const ProfilePage = ({ user, accessToken, setCurrentPage }) => {
  const [posts, setPosts] = useState([])
  const [documents, setDocuments] = useState([])
  const [savedNotes, setSavedNotes] = useState([])
  const [activeTab, setActiveTab] = useState("posts")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!accessToken || !user) {
      setError("Please log in to view your profile")
      setIsLoading(false)
      setCurrentPage("home")
      return
    }

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch user-specific posts
        const postsResponse = await fetchPosts(accessToken)
        setPosts(postsResponse.data.filter((p) => p.user.id === user.id))

        // Fetch user documents
        const documentsResponse = await fetchDocuments(accessToken)
        setDocuments(documentsResponse.data)

        // Fetch user saved notes
        const notesResponse = await fetchSavedNotes(accessToken)
        setSavedNotes(notesResponse.data)

        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching profile data:", err)
        setError("Failed to load profile data. Please try again.")
        setIsLoading(false)
      }
    }

    fetchData()
  }, [accessToken, user, setCurrentPage])

  if (isLoading) {
    return <div className="text-gray-400 text-center py-8">Loading profile...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <style>{styles}</style>
      {/* Profile Header */}
      <div className="profile-card p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={`${user.username} avatar`}
              className="w-24 h-24 rounded-full object-cover border border-gray-600/50"
            />
          ) : (
            <div className="w-24 h-24 rounded-full avatar-fallback">
              {getInitials(user?.username)}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{user?.username || "User"}</h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
            {user?.company_name && (
              <Badge className="mt-2">{user.company_name}</Badge>
            )}
            <Button
              onClick={() => setCurrentPage("profile-edit")}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all duration-200"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700/50 mb-6 justify-center sm:justify-start">
        {["posts", "documents", "notes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab px-4 py-2 text-sm font-medium text-gray-400 capitalize ${
              activeTab === tab ? "active" : ""
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Activity Content */}
      <div className="space-y-6">
        {activeTab === "posts" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Your Posts</h2>
            {posts.length === 0 ? (
              <p className="text-gray-400 text-center">No posts yet.</p>
            ) : (
              posts.map((p) => (
                <Card key={p.id} className="p-6 bg-gray-900/90 border border-gray-700/30 rounded-xl shadow-md activity-item mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={`${user.username} avatar`}
                          className="w-10 h-10 rounded-full object-cover border border-gray-600/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full avatar-fallback">
                          {getInitials(user?.username)}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold text-sm">{user?.username}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(p.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold text-white rounded-full px-2.5 py-1 bg-gradient-to-r ${
                      p.post_type === "insight" ? "from-blue-600 to-purple-600" :
                      p.post_type === "question" ? "from-teal-500 to-blue-600" :
                      "from-purple-600 to-pink-600"
                    }`}>
                      {p.post_type.charAt(0).toUpperCase() + p.post_type.slice(1)}
                    </span>
                  </div>
                  <div className="mt-4 text-gray-200 text-base">
                    {p.post_type === "insight" && <p>{p.summary}</p>}
                    {p.post_type === "question" && <p className="font-medium">{p.question}</p>}
                    {p.post_type === "ai" && (
                      <ul className="list-disc pl-5 space-y-1.5">
                        {p.bullets?.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                    {p.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.tags.map((t) => (
                          <Badge key={t} className="border border-blue-600/30 bg-blue-600/20 hover:bg-blue-600/30">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-6 text-gray-400">
                    <span className="flex items-center gap-1.5 text-sm">
                      <Heart className="w-5 h-5" />
                      {p.likes}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Your Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-400 text-center">No documents uploaded.</p>
            ) : (
              documents.map((d) => (
                <Card key={d.id} className="p-6 bg-gray-900/90 border border-gray-700/30 rounded-xl shadow-md activity-item mb-4">
                  <div className="flex items-center gap-3">
                    <File className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-white font-semibold text-sm">{d.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {d.file_type.toUpperCase()} • {(d.size / 1024 / 1024).toFixed(2)} MB • {new Date(d.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Your Saved Notes</h2>
            {savedNotes.length === 0 ? (
              <p className="text-gray-400 text-center">No saved notes.</p>
            ) : (
              savedNotes.map((n) => (
                <Card key={n.id} className="p-6 bg-gray-900/90 border border-gray-700/30 rounded-xl shadow-md activity-item mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-sm">{n.title}</p>
                        {n.starred && <Bookmark className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                      <p className="text-gray-200 text-sm mt-1 line-clamp-2">{n.content}</p>
                      {n.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {n.tags.map((t) => (
                            <Badge key={t} className="border border-blue-600/30 bg-blue-600/20 hover:bg-blue-600/30">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {n.source_document ? `From: ${n.source_document}` : `Source: ${n.source_type || "Manual"}`}
                        {" • "}
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage