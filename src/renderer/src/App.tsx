import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'

import React from 'react'

import CreateTablePage from './components/CreateTable'
import Sidebar from './components/Sidebar'
import TablePage from './components/TablePage'
import { Toaster } from './components/ui/toaster'
import DashboardPage from './pages/DashboardPage'

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex w-full">
        <Sidebar />
        <div className="content w-full px-6 ">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/databases/:dbId/tables/:tableId" element={<TablePage />} />
            <Route path="/databases/create-table/:dbId" element={<CreateTablePage />} />
          </Routes>
        </div>
      </div>
      <Toaster />
    </Router>
  )
}

export default App
