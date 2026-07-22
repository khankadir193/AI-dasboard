import { useState, useCallback, useRef } from 'react'
import { GripVertical, Eye, EyeOff, RotateCcw, X } from 'lucide-react'
import ToggleSwitch from '../../../components/ui/ToggleSwitch'
import { DEFAULT_WIDGET_ORDER } from '../services/dashboardPreferencesService'

/**
 * Widget definitions for the reorder panel.
 * slotId  — the ID stored in widget_order (orderable unit)
 * widgetId — the ID stored in hidden_widgets (individual hide/show)
 * label   — display name shown in the panel
 * isChild — true if this widget is a sub-item of a slot (not independently orderable)
 */
const WIDGET_DEFS = [
  { slotId: 'kpi_section', widgetId: 'kpi_section', label: 'KPI Section', isChild: false },
  {
    slotId: 'charts_row', widgetId: null, label: 'Charts Row', isChild: false,
    children: [
      { widgetId: 'activity_timeline', label: 'Activity Timeline' },
      { widgetId: 'project_status', label: 'Project Status' },
    ],
  },
  { slotId: 'event_distribution', widgetId: 'event_distribution', label: 'Event Distribution', isChild: false },
  { slotId: 'recent_activity_feed', widgetId: 'recent_activity_feed', label: 'Recent Activity Feed', isChild: false },
]

/**
 * WidgetReorderPanel
 *
 * Slide-in panel for managing dashboard widget visibility and order.
 * - Drag-to-reorder via HTML5 native draggable (no external DnD library).
 *   Justification: the list has 4 orderable slots — native drag is fully
 *   sufficient and avoids adding @dnd-kit, react-beautiful-dnd, etc.
 * - Individual child widgets (activity_timeline, project_status) can be
 *   independently hidden within the charts_row slot.
 * - "Reset to defaults" restores DEFAULT_WIDGET_ORDER + clears hidden list.
 *
 * Props:
 *   widgetOrder    — current string[] from useDashboardPreferences
 *   hiddenWidgets  — current string[] from useDashboardPreferences
 *   isSaving       — boolean (mutation in flight)
 *   onUpdate       — (newOrder: string[], newHidden: string[]) => void
 *   onReset        — () => void
 *   onClose        — () => void
 */
export default function WidgetReorderPanel({
  widgetOrder,
  hiddenWidgets,
  isSaving,
  onUpdate,
  onReset,
  onClose,
}) {
  // Local order state (list of slotIds in user's sequence)
  const [localOrder, setLocalOrder] = useState(() => widgetOrder ?? DEFAULT_WIDGET_ORDER)
  const [localHidden, setLocalHidden] = useState(() => hiddenWidgets ?? [])

  const dragSlot = useRef(null)
  const dragOverSlot = useRef(null)

  // ── Drag handlers (HTML5 native) ──────────────────────────────────────────
  const handleDragStart = useCallback((slotId) => {
    dragSlot.current = slotId
  }, [])

  const handleDragEnter = useCallback((slotId) => {
    dragOverSlot.current = slotId
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!dragSlot.current || dragSlot.current === dragOverSlot.current) return
    const newOrder = [...localOrder]
    const fromIdx = newOrder.indexOf(dragSlot.current)
    const toIdx = newOrder.indexOf(dragOverSlot.current)
    if (fromIdx === -1 || toIdx === -1) return
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragSlot.current)
    setLocalOrder(newOrder)
    dragSlot.current = null
    dragOverSlot.current = null
  }, [localOrder])

  // ── Visibility toggles ────────────────────────────────────────────────────
  const toggleWidget = useCallback((widgetId) => {
    setLocalHidden((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    )
  }, [])

  // ── Save / Reset ──────────────────────────────────────────────────────────
  const handleSave = () => onUpdate(localOrder, localHidden)

  const handleReset = () => {
    setLocalOrder(DEFAULT_WIDGET_ORDER)
    setLocalHidden([])
    onReset()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Customize dashboard layout"
        className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              Customize Dashboard
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Drag to reorder · toggle to show/hide
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Widget list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {localOrder.map((slotId) => {
            const def = WIDGET_DEFS.find((d) => d.slotId === slotId)
            if (!def) return null

            const isSlotHidden =
              def.widgetId ? localHidden.includes(def.widgetId) : false

            return (
              <div
                key={slotId}
                draggable
                onDragStart={() => handleDragStart(slotId)}
                onDragEnter={() => handleDragEnter(slotId)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing"
              >
                {/* Slot row */}
                <div className="flex items-center gap-3 px-3 py-3">
                  <GripVertical
                    size={15}
                    className="text-gray-400 dark:text-gray-500 flex-none"
                  />
                  <span
                    className={`flex-1 text-sm font-medium ${
                      isSlotHidden
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {def.label}
                  </span>
                  {/* Toggle for non-compound slots */}
                  {def.widgetId && (
                    <ToggleSwitch
                      checked={!isSlotHidden}
                      onChange={() => toggleWidget(def.widgetId)}
                      label={`Toggle ${def.label}`}
                    />
                  )}
                  {/* Visibility icon for compound slots (no slot-level toggle) */}
                  {!def.widgetId && (
                    <span title="Manage sub-widgets below">
                      {def.children?.some((c) => !localHidden.includes(c.widgetId)) ? (
                        <Eye size={14} className="text-gray-400 dark:text-gray-500" />
                      ) : (
                        <EyeOff size={14} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </span>
                  )}
                </div>

                {/* Child widgets (only for charts_row) */}
                {def.children && (
                  <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60">
                    {def.children.map((child) => {
                      const childHidden = localHidden.includes(child.widgetId)
                      return (
                        <div
                          key={child.widgetId}
                          className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800"
                        >
                          <span
                            className={`flex-1 text-xs ${
                              childHidden
                                ? 'text-gray-400 dark:text-gray-500 line-through'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {child.label}
                          </span>
                          <ToggleSwitch
                            checked={!childHidden}
                            onChange={() => toggleWidget(child.widgetId)}
                            label={`Toggle ${child.label}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-4 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}
