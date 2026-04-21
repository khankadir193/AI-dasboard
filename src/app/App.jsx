import { Outlet } from 'react-router-dom'
import Layout from '../components/layout/Layout.jsx'

export default function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
