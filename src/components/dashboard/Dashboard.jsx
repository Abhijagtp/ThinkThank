import { useState } from "react"
import Sidebar from "./Sidebar"
import TopNav from "./TopNav"
import DashboardHome from "./DashboardHome"
import UploadPage from "./UploadPage"
import AnalysisPage from "./AnalysisPage"
import ComparisonPage from "./ComparisonPage"
import SavedNotesPage from "./SavedNotesPage"
import ProfilePage from "./ProfilePage"
import ProfileEditPage from "./ProfileEditPage"

const Dashboard = ({ user, onLogout, accessToken, isLoading }) => {
  const [currentPage, setCurrentPage] = useState("home")

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "pulse":
        return <DashboardHome accessToken={accessToken} />
      case "upload":
        return <UploadPage accessToken={accessToken} />
      case "analysis":
        return <AnalysisPage accessToken={accessToken} />
      case "comparison":
        return <ComparisonPage accessToken={accessToken} />
      case "notes":
        return <SavedNotesPage accessToken={accessToken} />
      case "profile":
        return <ProfilePage user={user} accessToken={accessToken} setCurrentPage={setCurrentPage} />
      case "profile-edit":
        return <ProfileEditPage user={user} accessToken={accessToken} setCurrentPage={setCurrentPage} />
      default:
        return <DashboardHome accessToken={accessToken} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav user={user} onLogout={onLogout} isLoading={isLoading} setCurrentPage={setCurrentPage} />
        <main className="flex-1 overflow-auto p-6">{renderCurrentPage()}</main>
      </div>
    </div>
  )
}

export default Dashboard