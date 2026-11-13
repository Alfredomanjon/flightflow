import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Aircraft } from './pages/Aircraft'
import { Flights } from './pages/Flights'
import { Overview } from './pages/Overview'
import { Service } from './pages/Service'

export default function App() {
  return (
    <BrowserRouter basename="/analytics">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="flights" element={<Flights />} />
          <Route path="aircraft" element={<Aircraft />} />
          <Route path="status" element={<Service />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
