import { useEffect } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { CompareProvider } from './lib/CompareContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import CompareBar from './components/CompareBar'
import Home from './pages/Home'
import Listings from './pages/Listings'
import PackageDetail from './pages/PackageDetail'
import Compare from './pages/Compare'
import BuyingGuide from './pages/BuyingGuide'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import PackagesList from './admin/PackagesList'
import PackageEditor from './admin/PackageEditor'
import Leads from './admin/Leads'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

function PublicLayout() {
  return (
    <>
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CompareBar />
    </>
  )
}

export default function App() {
  return (
    <CompareProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/packages" element={<Listings />} />
          <Route path="/packages/:slug" element={<PackageDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/buying-guide" element={<BuyingGuide />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="packages" element={<PackagesList />} />
          <Route path="packages/new" element={<PackageEditor />} />
          <Route path="packages/:id" element={<PackageEditor />} />
          <Route path="leads" element={<Leads />} />
        </Route>
      </Routes>
    </CompareProvider>
  )
}
