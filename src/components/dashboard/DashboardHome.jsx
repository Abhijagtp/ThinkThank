"use client"

import React, { useState, useEffect } from "react"
import { Search, Sparkles, MessageCircle, Heart, Bookmark, Share2, Filter, X, ArrowLeft, Send } from "lucide-react"
import Card from "../ui/Card"
import Button from "../ui/Button"
import { fetchPosts, createPost, interactWithPost, fetchComments, createComment } from "../../utils/api"
import { toast } from "react-toastify"

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 p-4">
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

// Inline CSS for animations and UI
const styles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }
  @keyframes expand {
    from { max-height: 0; opacity: 0; }
    to { max-height: 1200px; opacity: 1; }
  }
  @keyframes collapse {
    from { max-height: 1200px; opacity: 1; }
    to { max-height: 0; opacity: 0; }
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  .modal-enter { animation: slideIn 350ms ease-in-out; }
  .modal-exit { animation: slideOut 350ms ease-in-out; }
  .comment-section-enter { animation: expand 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards; overflow: hidden; }
  .comment-section-exit { animation: collapse 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards; overflow: hidden; }
  .pulse-button { animation: pulse 1.5s infinite; }
  .field-enter { animation: slideIn 200ms ease-in-out; }
  .comment { 
    background-color: rgba(255, 255, 255, 0.05); 
    transition: background-color 200ms ease-in-out; 
    border-radius: 0.75rem; 
    padding: 0.75rem 1rem; 
  }
  .comment:hover { background-color: rgba(255, 255, 255, 0.1); }
  .comment-section { 
    border-top: 1px solid rgba(255, 255, 255, 0.15); 
    padding: 1.5rem 1rem; 
    margin-top: 1rem; 
    background: rgba(255, 255, 255, 0.02); 
    border-radius: 0.5rem; 
  }
  .no-comments, .error-message { 
    background: rgba(255, 255, 255, 0.05); 
    border-radius: 0.5rem; 
    padding: 0.75rem; 
    text-align: center; 
    font-size: 0.875rem; 
    color: rgba(255, 255, 255, 0.6); 
    border: 1px solid rgba(255, 255, 255, 0.1); 
  }
  .error-message { 
    color: #ef4444; 
    background: rgba(239, 68, 68, 0.1); 
    border-color: rgba(239, 68, 68, 0.2); 
  }
  .comment-input { 
    transition: all 200ms ease-in-out; 
    border-radius: 0.5rem; 
    background: rgba(31, 41, 55, 0.9); 
  }
  .comment-input:focus { 
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); 
  }
  .avatar-fallback { 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
    color: white; 
    font-weight: 500; 
    font-size: 0.875rem; 
    text-transform: uppercase; 
  }
`

// Helper to generate initials for avatar fallback
const getInitials = (username) => {
  if (!username) return "U"
  const names = username.split(" ")
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`
    : username.slice(0, 2)
}

// Badge component
const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-800/80 text-gray-300 border border-gray-700/50 ${className}`}>
    {children}
  </span>
)

// PostType component
const PostType = ({ type }) => {
  const map = {
    insight: { label: "Insight", color: "from-blue-600 to-purple-600" },
    question: { label: "Question", color: "from-teal-500 to-blue-600" },
    ai: { label: "AI Highlight", color: "from-purple-600 to-pink-600" },
  }
  const cfg = map[type] || map.insight
  return (
    <span className={`text-xs font-semibold text-white rounded-full px-2.5 py-1 bg-gradient-to-r ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

// InteractionBar
const InteractionBar = ({ p, onToggleLike, onToggleSave, onToggleComments }) => (
  <div className="mt-4 flex items-center justify-between text-gray-400 border-t border-gray-700/50 pt-4">
    <div className="flex items-center gap-6">
      <button
        onClick={() => onToggleLike(p.id, p.is_liked ? 'unlike' : 'like')}
        className="flex items-center gap-1.5 text-sm hover:text-white transition-all duration-200 hover:scale-105"
      >
        <Heart className={`w-5 h-5 ${p.is_liked ? 'text-red-500 fill-red-500' : ''}`} />
        <span>{p.likes}</span>
      </button>
      <button
        onClick={() => onToggleComments(p.id)}
        className="flex items-center gap-1.5 text-sm hover:text-white transition-all duration-200 hover:scale-105"
      >
        <MessageCircle className="w-5 h-5" />
        <span>{p.comments_count} {p.comments_count === 1 ? 'response' : 'responses'}</span>
      </button>
      <button className="flex items-center gap-1.5 text-sm hover:text-white transition-all duration-200 hover:scale-105">
        <Share2 className="w-5 h-5" />
        <span>Share</span>
      </button>
    </div>
    <button
      onClick={() => onToggleSave(p.id, p.is_saved ? 'unsave' : 'save')}
      className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${p.is_saved ? "text-blue-400 hover:text-blue-300" : "hover:text-white"} hover:scale-105`}
    >
      <Bookmark className={`w-5 h-5 ${p.is_saved ? 'fill-blue-400' : ''}`} />
      <span>{p.is_saved ? "Saved" : "Save"}</span>
    </button>
  </div>
)

// PulseFeedCard
const PulseFeedCard = ({ p, onToggleLike, onToggleSave, onToggleComments }) => {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [comments, setComments] = useState(p.comments || [])
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentError, setCommentError] = useState(null)

  useEffect(() => {
    if (isCommentsOpen && p.id) {
      const token = localStorage.getItem("access_token")
      if (!token) {
        toast.error("Please log in to view comments")
        setIsCommentsOpen(false)
        return
      }
      setCommentError(null)
      fetchComments(p.id, token)
        .then((response) => {
          const fetchedComments = response.data || []
          setComments(fetchedComments)
          onToggleComments(p.id, null, fetchedComments.length)
        })
        .catch((error) => {
          console.error("Error fetching comments:", error)
          setCommentError("Failed to load comments. Please try again.")
          toast.error("Failed to load comments")
        })
    }
  }, [isCommentsOpen, p.id])

  const handleToggleComments = () => {
    setIsCommentsOpen(!isCommentsOpen)
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!commentText || typeof commentText !== 'string' || !commentText.trim()) {
      toast.error("Please enter a valid comment")
      return
    }
    setIsSubmitting(true)
    setCommentError(null)
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        toast.error("Please log in to comment")
        return
      }
      const payload = { content: commentText.trim() }
      console.log("Sending comment payload:", payload)
      const response = await createComment(p.id, payload, token)
      const newComment = response.data
      setComments((prev) => [...prev, newComment])
      onToggleComments(p.id, newComment)
      setCommentText("")
      toast.success("Comment added!")
    } catch (error) {
      console.error("Error adding comment:", error.response?.data)
      const errorMessage = error.response?.data?.content?.[0] ||
                         error.response?.data?.non_field_errors?.[0] ||
                         "Failed to add comment"
      setCommentError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6 bg-gray-900/90 border border-gray-700/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
      <style>{styles}</style>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {p.user.avatar ? (
            <img
              src={p.user.avatar}
              alt={`${p.user.username} avatar`}
              className="w-10 h-10 rounded-full object-cover border border-gray-600/50"
            />
          ) : (
            <div className="w-10 h-10 rounded-full avatar-fallback">
              {getInitials(p.user.username)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm">{p.user.username}</p>
              <Badge>{p.user.company_name || "User"}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(p.created_at).toLocaleString()}</p>
          </div>
        </div>
        <PostType type={p.post_type} />
      </div>
      <div className="mt-4 text-gray-200 leading-relaxed">
        {p.post_type === "insight" && (
          <div>
            <p className="text-base">{p.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.tags?.map((t) => (
                <Badge key={t} className="border border-blue-600/30 bg-blue-600/20 hover:bg-blue-600/30 transition-all duration-200">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {p.post_type === "question" && (
          <div>
            <p className="text-base font-medium">{p.question}</p>
            <div className="mt-2 text-sm text-gray-400">{p.comments_count} {p.comments_count === 1 ? 'response' : 'responses'}</div>
          </div>
        )}
        {p.post_type === "ai" && (
          <ul className="list-disc pl-5 space-y-1.5 text-base">
            {p.bullets?.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
      <InteractionBar
        p={p}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        onToggleComments={handleToggleComments}
      />
      {/* Comment Section */}
      {isCommentsOpen && (
        <div className={`comment-section comment-section-${isCommentsOpen ? 'enter' : 'exit'}`}>
          <div className="space-y-3">
            {commentError ? (
              <p className="error-message">{commentError}</p>
            ) : comments.length === 0 ? (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3 comment">
                  {c.user?.avatar ? (
                    <img
                      src={c.user.avatar}
                      alt={c.user?.username || "User"}
                      className="w-8 h-8 rounded-full object-cover border border-gray-600/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full avatar-fallback">
                      {getInitials(c.user?.username || "User")}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{c.user?.username || "User"}</p>
                      <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-gray-200 text-sm mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))
            )}
            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="field-enter mt-4">
              <div className="flex gap-3 items-start">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none comment-input h-20"
                  rows={3}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !commentText?.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-50 rounded-lg px-4 py-2.5 h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  )
}

// SidebarFilters
const SidebarFilters = () => {
  const industries = ["FinTech", "Health", "SaaS", "Climate", "AI/ML", "DevTools"]
  const tagPool = ["Pricing", "Growth", "Security", "Onboarding", "Churn", "Product", "Compliance"]
  const trending = ["AI Agents vs RAG", "Seat vs Usage Pricing", "Security as GTM", "SOC2 in Startups"]

  return (
    <div className="space-y-6 lg:sticky lg:top-6">
      <Card className="p-5 bg-gray-900/90 border border-gray-700/30 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-base">Filters</h3>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Industries</p>
            <div className="flex flex-wrap gap-2">
              {industries.map((i) => (
                <Badge key={i} className="hover:bg-gray-700/80 cursor-pointer transition-all duration-200">
                  {i}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tagPool.map((t) => (
                <Badge key={t} className="hover:bg-gray-700/80 cursor-pointer transition-all duration-200">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2 font-medium">Trending</p>
            <ul className="space-y-2">
              {trending.map((t) => (
                <li key={t} className="text-sm text-gray-300 hover:text-white cursor-pointer transition-all duration-200">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
      <Card className="p-5 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-xl shadow-md">
        <h4 className="text-white font-semibold text-base mb-2">What’s New</h4>
        <p className="text-sm text-gray-400 leading-relaxed">Follow topics to tailor your Pulse. Your feed adapts as you engage.</p>
      </Card>
    </div>
  )
}

// PostCreationModal
const PostCreationModal = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState("selectType")
  const [postType, setPostType] = useState(null)
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTypeSelect = (type) => {
    setPostType(type)
    setStep("inputContent")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) {
      toast.error("Content cannot be empty")
      return
    }
    setIsSubmitting(true)
    const data = postType === "insight" ? { summary: content, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) } : { question: content }
    await onSubmit(postType, data)
    setIsSubmitting(false)
    setContent("")
    setTags("")
    setPostType(null)
    setStep("selectType")
    onClose()
  }

  const handleBack = () => {
    setContent("")
    setTags("")
    setPostType(null)
    setStep("selectType")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <style>{styles}</style>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-700/30 shadow-xl modal-enter">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-white">
            {step === "selectType" ? "Choose Post Type" : "Create New Post"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-all duration-200 hover:scale-110">
            <X className="w-5 h-5" />
          </button>
        </div>
        {step === "selectType" ? (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">What would you like to post?</p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleTypeSelect("insight")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 hover:shadow-md transition-all duration-200 active:scale-95"
              >
                Insight
              </Button>
              <Button
                onClick={() => handleTypeSelect("question")}
                className="bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:opacity-90 hover:shadow-md transition-all duration-200 active:scale-95"
              >
                Question
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="field-enter">
              <label className="text-sm text-gray-400 mb-1.5 block font-medium">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={postType === "insight" ? "Share your insight..." : "Ask your question..."}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-28 resize-none comment-input"
              />
            </div>
            {postType === "insight" && (
              <div className="field-enter delay-100">
                <label className="text-sm text-gray-400 mb-1.5 block font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., Pricing, Growth"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 comment-input"
                />
              </div>
            )}
            <div className="flex justify-between gap-3 field-enter delay-200">
              <Button
                variant="secondary"
                onClick={handleBack}
                className="group flex items-center gap-2 bg-gray-800 text-gray-200 hover:bg-gray-700/80 transition-all duration-200 active:scale-95 px-4 py-2.5 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-rotate-10" />
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="bg-gray-800 text-gray-200 hover:bg-gray-700/80 transition-all duration-200 active:scale-95 px-4 py-2.5 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-gradient-to-r ${
                    postType === "insight" ? "from-blue-600 to-purple-600" : "from-teal-500 to-blue-600"
                  } text-white hover:opacity-90 transition-all duration-200 active:scale-95 px-4 py-2.5 rounded-lg ${
                    isSubmitting ? "pulse-button" : ""
                  }`}
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// DashboardHome
const DashboardHome = () => {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      setError("Please log in to view posts")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    fetchPosts(token)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setItems(response.data.map((p) => ({ ...p, comments: p.comments || [] })))
        } else {
          console.error("Expected an array from /api/posts/, got:", response.data)
          setItems([])
          setError("Invalid data format from server")
        }
        setIsLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching posts:", error)
        setItems([])
        setError("Failed to load posts. Please try again.")
        setIsLoading(false)
      })
  }, [])

  const toggleLike = async (postId, action) => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Please log in to interact with posts")
      return
    }

    try {
      const response = await interactWithPost(postId, action, token)
      setItems((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: response.data.likes, is_liked: response.data.is_liked } : p))
      )
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error("Failed to update like status")
    }
  }

  const toggleSave = async (postId, action) => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Please log in to interact with posts")
      return
    }

    try {
      const response = await interactWithPost(postId, action, token)
      setItems((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, is_saved: response.data.is_saved } : p))
      )
    } catch (error) {
      console.error("Error toggling save:", error)
      toast.error("Failed to update save status")
    }
  }

  const handleToggleComments = (postId, newComment = null, newCount = null) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: newComment ? [...(p.comments || []), newComment] : p.comments || [],
              comments_count: newCount !== null ? newCount : newComment ? (p.comments_count || 0) + 1 : p.comments_count,
            }
          : p
      )
    )
  }

  const handlePostSubmit = async (type, data) => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      toast.error("Please log in to create a post")
      return
    }

    try {
      const response = await createPost({ post_type: type, ...data }, token)
      setItems((prev) => [{ ...response.data, comments: [] }, ...prev])
      toast.success("Post created successfully")
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Failed to create post")
    }
  }

  if (isLoading) {
    return <div className="text-gray-400 text-center py-8">Loading posts...</div>
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
        <style>{styles}</style>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Pulse</h1>
              <p className="text-gray-400 text-sm mt-1">Community-driven insights. Minimal, social, and focused.</p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-all duration-200 hover:shadow-md"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">New Post</span>
            </Button>
          </div>
          <div className="w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Pulse..."
                className="w-full pl-10 pr-3 py-2.5 bg-gray-800 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 comment-input"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {items.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No posts available.</div>
            ) : (
              items.map((p) => (
                <PulseFeedCard
                  key={p.id}
                  p={p}
                  onToggleLike={toggleLike}
                  onToggleSave={toggleSave}
                  onToggleComments={handleToggleComments}
                />
              ))
            )}
          </div>
          <SidebarFilters />
        </div>
        <PostCreationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handlePostSubmit}
        />
      </div>
    </ErrorBoundary>
  )
}

export default DashboardHome