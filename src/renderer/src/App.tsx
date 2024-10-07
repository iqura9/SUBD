import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import React from 'react'

import { Center } from './components/Center'
import Sidebar from './components/Sidebar'
import { Toaster } from './components/ui/toaster'
import DashboardPage from './pages/DashboardPage'
import DayReviewPage from './pages/DayReviewPage'
import TimeTrackerPage from './pages/TimeTrackerPage'

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
