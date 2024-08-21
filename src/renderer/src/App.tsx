import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'

import React from 'react'

import DashboardPage from './pages/DashboardPage'
import DayReviewPage from './pages/DayReviewPage'
import TimeTrackerPage from './pages/TimeTrackerPage'
import { Center } from './components/Center'
import { Toaster } from './components/ui/toaster'

function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-xl font-bold">IquraTime</div>
      <nav className="flex-grow">
        <ul className="space-y-4 p-4">
          <li>
            <Link to="/" className="block p-2 rounded hover:bg-gray-700 transition-colors">
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/day-review"
              className="block p-2 rounded hover:bg-gray-700 transition-colors"
            >
              Day Review
            </Link>
          </li>
          <li>
            <Link
              to="/time-tracker"
              className="block p-2 rounded hover:bg-gray-700 transition-colors"
            >
              Time Tracker
            </Link>
          </li>
          <li>
            <Link to="/settings" className="block p-2 rounded hover:bg-gray-700 transition-colors">
              Settings
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4">Footer</div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex w-full">
        <Sidebar />
        <div className="content w-full px-6 ">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/day-review"
              element={
                <div className=" py-6">
                  <DayReviewPage />
                </div>
              }
            />
            <Route
              path="/time-tracker"
              element={
                <Center>
                  <TimeTrackerPage />
                </Center>
              }
            />
            <Route path="/settings" element={<>Settings</>} />
          </Routes>
        </div>
      </div>
      <Toaster />
    </Router>
  )
}

export default App
