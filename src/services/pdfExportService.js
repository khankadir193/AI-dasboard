import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function sanitizeText(text) {
  if (!text) return ''
  return String(text)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim()
}

function getStatusColor(status) {
  switch (status) {
    case 'active': return [16, 185, 129]
    case 'inactive': return [245, 158, 11]
    case 'archived': return [239, 68, 68]
    default: return [107, 114, 128]
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function formatPeriodLabel(dateRange) {
  if (!dateRange || !dateRange.startDate || !dateRange.endDate) return null
  const start = new Date(dateRange.startDate)
  const end = new Date(dateRange.endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  const shortOpts = { month: 'short', day: 'numeric' }
  const fullOpts = { month: 'short', day: 'numeric', year: 'numeric' }
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', shortOpts)} – ${end.getDate()}, ${end.getFullYear()}`
  }
  return `${start.toLocaleDateString('en-US', shortOpts)} – ${end.toLocaleDateString('en-US', fullOpts)}`
}

function isEffectivelyEmpty(content) {
  if (!content || typeof content !== 'object') return true
  if (content.projectCount > 0) return false
  if (content.totalEvents > 0) return false
  if (content.activityCount > 0) return false
  if (content.kpiData && typeof content.kpiData === 'object' && Object.values(content.kpiData).some(v => v > 0)) return false
  return true
}

export function exportReportToPDF(report, company) {
  if (!report) throw new Error('Report data is required')

  if (!report.content) {
    console.warn('[PDF Export] Report content is null/undefined, using empty data', {
      reportId: report?.id,
      reportType: report?.report_type,
    })
    report = { ...report, content: {} }
  } else if (typeof report.content === 'string') {
    try {
      const parsed = JSON.parse(report.content)
      report = { ...report, content: parsed && typeof parsed === 'object' ? parsed : {} }
    } catch {
      console.warn('[PDF Export] Report content is a string that could not be parsed as JSON, using empty data', {
        reportId: report?.id,
        contentType: typeof report.content,
      })
      report = { ...report, content: {} }
    }
  }

  const content = report.content
  content.generatedAt = content.generatedAt || report.created_at || new Date().toISOString()
  content.dateRange = content.dateRange || null
  content.kpiData = content.kpiData || {}
  content.growthData = content.growthData || {}
  content.timelineData = content.timelineData || []
  content.projectStatusData = content.projectStatusData || []
  content.projectCount = content.projectCount ?? 0
  content.activeProjects = content.activeProjects ?? 0
  content.completionRate = content.completionRate ?? 0
  content.activityCount = content.activityCount ?? 0
  content.totalEvents = content.totalEvents ?? 0
  content.avgDailyEvents = content.avgDailyEvents ?? 0
  content.insights = content.insights || []
  content.recommendations = content.recommendations || []
  content.reportSummary = content.reportSummary || ''
  content.teamSummary = content.teamSummary || ''

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const companyName = sanitizeText(company?.name || 'InsightAI')

  const addHeader = () => {
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(companyName, margin, 10)
    doc.text(`Generated: ${formatDate(report.content?.generatedAt)}`, pageWidth - margin, 10, { align: 'right' })
    y = 22
  }

  const addFooter = () => {
    const footerY = pageHeight - 10
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, footerY, pageWidth - margin, footerY)
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7)
    doc.text(`${companyName} — Report`, margin, footerY + 5)
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, footerY + 5, { align: 'right' })
  }

  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - 15) {
      addFooter()
      doc.addPage()
      addHeader()
    }
  }

  addHeader()

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  const title = sanitizeText(report.title || 'Report')
  const titleLines = doc.splitTextToSize(title, contentWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 7 + 3

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Report Type: ${sanitizeText(report.report_type || 'N/A')}`, margin, y)
  y += 5
  const periodLabel = report.content?.dateRange
    ? formatPeriodLabel(report.content.dateRange) || 'N/A'
    : 'N/A'
  doc.text(`Period: ${periodLabel}`, margin, y)
  y += 8

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  if (content.teamSummary) {
    checkPageBreak(12)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Executive Summary', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(80, 80, 80)
    const summaryLines = doc.splitTextToSize(sanitizeText(content.teamSummary), contentWidth)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 5 + 4
  }

  const kpiLabels = {
    activeUsers: 'User Logins',
    projectsCreated: 'Projects Created',
    projectsUpdated: 'Projects Updated',
    projectsDeleted: 'Projects Deleted',
    dashboardViews: 'Dashboard Views',
  }

  if (content.reportSummary) {
    checkPageBreak(14)
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(90, 90, 90)
    const summaryLines = doc.splitTextToSize(sanitizeText(content.reportSummary), contentWidth)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 5 + 6
  }

  if (content.kpiData && Object.values(content.kpiData).some(v => v > 0)) {
    checkPageBreak(30)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Key Metrics', margin, y)
    y += 7

    const kpiRows = Object.entries(content.kpiData)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => {
        const label = kpiLabels[key] || key
        const growth = content.growthData?.[key]
        const growthStr = growth !== undefined ? `${growth > 0 ? '+' : ''}${growth}%` : '—'
        return [sanitizeText(label), String(value), growthStr]
      })

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Count', 'Change']],
      body: kpiRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.5 },
        1: { cellWidth: contentWidth * 0.25, halign: 'center' },
        2: { cellWidth: contentWidth * 0.25, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (content.insights && content.insights.length > 0) {
    checkPageBreak(content.insights.length * 6 + 14)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Insights', margin, y)
    y += 7

    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)

    content.insights.forEach((insight) => {
      checkPageBreak(6)
      const lines = doc.splitTextToSize(`• ${sanitizeText(insight)}`, contentWidth - 4)
      doc.text(lines, margin + 2, y)
      y += lines.length * 5 + 1
    })
    y += 4
  }

  if (content.recommendations && content.recommendations.length > 0) {
    checkPageBreak(content.recommendations.length * 12 + 14)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Recommendations', margin, y)
    y += 7

    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)

    content.recommendations.forEach((rec) => {
      const lines = doc.splitTextToSize(`• ${sanitizeText(rec)}`, contentWidth - 4)
      checkPageBreak(lines.length * 5 + 1)
      doc.text(lines, margin + 2, y)
      y += lines.length * 5 + 1
    })
    y += 4
  }

  if (content.projectStatusData && content.projectStatusData.length > 0) {
    checkPageBreak(content.projectStatusData.length * 8 + 14)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Project Statistics', margin, y)
    y += 7

    const statusRows = content.projectStatusData.map((item) => {
      return [sanitizeText(item.name || 'Unknown'), String(item.value || 0)]
    })

    autoTable(doc, {
      startY: y,
      head: [['Status', 'Count']],
      body: statusRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (content.teamActivity && content.teamActivity.length > 0) {
    checkPageBreak(content.teamActivity.length * 8 + 14)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(30, 30, 30)
    doc.text('Team Activity', margin, y)
    y += 7

    const teamRows = content.teamActivity.map((member) => [
      sanitizeText(member.name || 'Unknown'),
      String(member.totalActions || 0),
      String(member.projectsCreated || 0),
      String(member.logins || 0),
    ])

    autoTable(doc, {
      startY: y,
      head: [['Team Member', 'Actions', 'Projects Created', 'Logins']],
      body: teamRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.4 },
        1: { cellWidth: contentWidth * 0.2, halign: 'center' },
        2: { cellWidth: contentWidth * 0.2, halign: 'center' },
        3: { cellWidth: contentWidth * 0.2, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  {
    checkPageBreak(14)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    if (isEffectivelyEmpty(content)) {
      doc.setFontSize(10)
      doc.setTextColor(140, 140, 140)
      doc.text('No activity recorded in this period.', margin, y)
      y += 6
    } else {
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(`Total Projects: ${content.projectCount || 0}`, margin, y)
      y += 4
      if (content.activeProjects !== undefined) {
        doc.text(`Active Projects: ${content.activeProjects}`, margin, y)
        y += 4
      }
      if (content.completionRate !== undefined) {
        doc.text(`Completion Rate: ${content.completionRate}%`, margin, y)
        y += 4
      }
      doc.text(`Total Events Tracked: ${content.totalEvents || 0}`, margin, y)
      y += 4
      doc.text(`Avg Daily Events: ${content.avgDailyEvents || 0}`, margin, y)
      y += 4
      doc.text(`Activity Log Entries: ${content.activityCount || 0}`, margin, y)
      y += 4
    }
    doc.text(`Report Generated: ${formatDate(content.generatedAt)}`, margin, y)
  }

  addFooter()

  return doc
}

export function downloadPDF(doc, filename) {
  const safeName = `${filename || 'report'}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
  doc.save(safeName)
}

export function openPDFInNewTab(doc) {
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
