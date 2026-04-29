import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { AnnouncementBarContainer } from './announcement-bar'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Announcement bar fetches CMS-driven messages; falls back to defaults if API fails */}
      <AnnouncementBarContainer variant="dark" />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}