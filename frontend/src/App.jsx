import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Expenses from './pages/Expenses'
import Maintenance from './pages/Maintenance'
import Billing from './pages/Billing'
import Payments from './pages/Payments'
import Reminders from './pages/Reminders'
import Clients from './pages/Clients'
import Analytics from './pages/Analytics'
import Compliance from './pages/Compliance'
import Trips from './pages/Trips'
import Tyres from './pages/Tyres'
import Inventory from './pages/Inventory'
import DriverAdvances from './pages/DriverAdvances'
import VehicleProfile from './pages/VehicleProfile'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id" element={<VehicleProfile />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="trips" element={<Trips />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="tyres" element={<Tyres />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="billing" element={<Billing />} />
          <Route path="payments" element={<Payments />} />
          <Route path="advances" element={<DriverAdvances />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="clients" element={<Clients />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="compliance" element={<Compliance />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
