import { FileText } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'

export default function ReportsEmptyState() {
  return (
    <EmptyState
      icon={FileText}
      title="No reports yet"
      description="Generate your first report above."
    />
  )
}
