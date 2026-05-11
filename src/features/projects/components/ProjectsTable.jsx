import { Activity, Loader2, Calendar, Edit, Trash2 } from 'lucide-react'
import EmptyState from '../../../components/common/EmptyState'
import GuardedIconButton from '../../../components/common/GuardedIconButton'
import Pagination from './Pagination'
import { useSelector } from 'react-redux'

/**
 * ProjectsTable - Displays projects in a table format
 * Presentational component - receives all data/handlers as props
 * Uses common EmptyState and GuardedIconButton
 */
export default function ProjectsTable({
  projects,
  deletingId,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
  updateTooltip,
  deleteTooltip,
  pagination,
  onPageChange,
  changingPage
}) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const { user } = useSelector((state) => state.auth);
  const displayName = user?.email?.split('@')[0] || 'User'; 

  const getCreatorName = (project) => {
    if(displayName) return displayName
    return 'Unknown'
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850">
            <tr>
              <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {changingPage ? (
              <tr>
                <td colSpan="5" className="px-6 py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8">
                    <EmptyState
                      icon={Activity}
                      title="No projects found"
                      description={null}
                    />
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="even:bg-gray-50 dark:even:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {getInitials(getCreatorName(project))}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {/* TODO: Use actual project creator name if available in project.created_by_name or project.created_by_email */}
                        {getCreatorName(project)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(project.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <GuardedIconButton
                        onClick={() => onEdit(project)}
                        isAllowed={canUpdate}
                        tooltip={updateTooltip}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        ariaLabel={`Edit project ${project.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </GuardedIconButton>
                      <GuardedIconButton
                        onClick={() => onDelete(project.id, project.name)}
                        disabled={deletingId === project.id}
                        isAllowed={canDelete}
                        tooltip={deleteTooltip}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        ariaLabel={`Delete project ${project.name}`}
                      >
                        {deletingId === project.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </GuardedIconButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
}
