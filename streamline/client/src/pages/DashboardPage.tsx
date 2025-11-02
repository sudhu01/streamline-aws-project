import { useUser } from '@clerk/clerk-react'
import QuickStats from '../components/dashboard/QuickStats'
import RecentWorkflows from '../components/dashboard/RecentWorkflows'
import RecentExecutions from '../components/dashboard/RecentExecutions'
import QuickActions from '../components/dashboard/QuickActions'

export default function DashboardPage() {
  const { user } = useUser()
  return (
    <div className="px-4 py-6 max-w-6xl mx-auto pt-24">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="opacity-70">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}</p>
      </div>
      <QuickStats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 space-y-4">
          <RecentWorkflows />
          <RecentExecutions />
        </div>
        <div className="space-y-4">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

