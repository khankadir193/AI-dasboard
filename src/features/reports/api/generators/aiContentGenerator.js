import { getAIInsight } from '../../../../lib/apiClient'
import { safeLabel } from './reportGeneratorUtils'

function generateInsights(kpiData, growthData, projectCount, activityCount, type) {
  const insights = []
  const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)

  if (totalEvents === 0 && activityCount === 0 && projectCount === 0) {
    insights.push('Your workspace is ready for action. Create projects, log activities, and track metrics to generate meaningful insights over time.')
    return insights
  }

  const topEvent = Object.entries(kpiData).sort((a, b) => b[1] - a[1])[0]
  if (topEvent && topEvent[1] > 0) {
    insights.push(`${safeLabel(topEvent[0])} was the most frequent activity with ${topEvent[1]} events tracked.`)
  }

  Object.entries(growthData).forEach(([key, growth]) => {
    if (growth > 20) {
      insights.push(`${safeLabel(key)} increased by ${growth}% compared to the previous period.`)
    } else if (growth < -20) {
      insights.push(`${safeLabel(key)} decreased by ${Math.abs(growth)}% compared to the previous period.`)
    }
  })

  if (projectCount > 0) {
    insights.push(`${projectCount} project(s) were active during this period.`)
  }

  if (activityCount > 50) {
    insights.push('High level of team activity detected across the workspace.')
  } else if (activityCount > 0 && activityCount < 10) {
    insights.push('Team activity is relatively low. Consider engaging team members to increase collaboration.')
  }

  if (type === 'weekly' && totalEvents > 0) {
    const avgPerDay = Math.round(totalEvents / 7)
    insights.push(`Average of ${avgPerDay} events per day this week.`)
  }

  if (type === 'monthly' && totalEvents > 0) {
    const avgPerDay = Math.round(totalEvents / 30)
    insights.push(`Sustained activity with an average of ${avgPerDay} events per day over the past month.`)
  }

  if (type === 'executive_summary' && totalEvents > 0) {
    const avgPerDay = Math.round(totalEvents / 90)
    insights.push(`Average of ${avgPerDay} events per day over the 90-day reporting period.`)
    if (projectCount > 0) {
      insights.push(`Portfolio of ${projectCount} project(s) managed during this period, reflecting ongoing business operations.`)
    }
  }

  if (type === 'team_productivity' && activityCount > 0) {
    insights.push(`Team generated ${activityCount} activity log entries over the reporting period, indicating active collaboration across the workspace.`)
  }

  if (insights.length === 0 && totalEvents > 0) {
    insights.push('Activity levels are stable with no significant changes detected.')
  }

  return insights
}

function generateRecommendations(kpiData, growthData, projectCount, activityCount, type) {
  const recommendations = []
  const totalEvents = Object.values(kpiData).reduce((a, b) => a + b, 0)

  if (projectCount === 0) {
    recommendations.push('Start creating projects to track your team\'s work effectively and unlock detailed analytics.')
  }

  if (totalEvents === 0 && activityCount === 0) {
    if (projectCount > 0) {
      recommendations.push('Your projects are set up but no activity has been recorded yet. Encourage your team to start logging their work.')
    }
    recommendations.push('Use the dashboard regularly to build up activity data, enabling more detailed future reports.')
    return recommendations
  }

  if (kpiData.projectsCreated === 0 && kpiData.projectsUpdated === 0 && projectCount > 0) {
    recommendations.push('No recent project modifications detected. Schedule a project review to ensure everything is on track.')
  }

  if (kpiData.activeUsers === 0) {
    recommendations.push('No user logins recorded in this period. Review access permissions and encourage team members to engage with the platform.')
  }

  if (growthData.activeUsers < -30) {
    recommendations.push('Significant drop in user activity. Investigate potential issues with onboarding, engagement, or access.')
  }

  if (projectCount > 0 && activityCount < 20 && totalEvents > 0) {
    recommendations.push('Projects exist but activity is low. Schedule a team check-in to identify blockers and re-prioritize workloads.')
  }

  if (kpiData.dashboardViews > 100) {
    recommendations.push('High dashboard usage indicates a strong data-driven culture. Consider expanding metrics and sharing insights across the organization.')
  }

  if (type === 'weekly' && kpiData.projectsCreated > 0) {
    recommendations.push('Strong project creation momentum this week. Plan the next sprint based on current velocity and team capacity.')
  } else if (type === 'weekly') {
    recommendations.push('Review this week\'s accomplishments and set clear priorities for the upcoming week to maintain momentum.')
  }

  if (type === 'monthly' && growthData.activeUsers > 0) {
    recommendations.push('User engagement is growing month-over-month. Invest in onboarding resources and feature adoption to sustain the trend.')
  } else if (type === 'monthly') {
    recommendations.push('Conduct a monthly retrospective to evaluate what worked well and identify areas for improvement in the coming month.')
  }

  if (type === 'team_productivity' && activityCount > 0) {
    recommendations.push('Recognize top contributors to maintain morale and encourage continued high performance across the team.')
    if (activityCount < 50) {
      recommendations.push('Consider implementing team-building activities or collaborative sessions to boost overall productivity.')
    }
  }

  if (type === 'executive_summary') {
    recommendations.push('Schedule a strategic review session to align on next quarter\'s priorities based on these insights and performance data.')
    if (projectCount > 5) {
      recommendations.push('With a growing project portfolio, consider delegating oversight and implementing scalable management processes.')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Current metrics are healthy. Continue monitoring for any significant changes and maintain consistent team engagement.')
  }

  return recommendations
}

async function generateAIReportContent(data, type) {
  const {
    kpiData, growthData, projectCount, activeProjects, completionRate,
    activityCount, totalEvents, avgDailyEvents, dateRange, projectStatusData,
    timelineData, teamActivity,
  } = data

  const kpiLines = [
    `- User Logins: ${kpiData?.activeUsers ?? 0}`,
    `- Projects Created: ${kpiData?.projectsCreated ?? 0}`,
    `- Projects Updated: ${kpiData?.projectsUpdated ?? 0}`,
    `- Projects Deleted: ${kpiData?.projectsDeleted ?? 0}`,
    `- Dashboard Views: ${kpiData?.dashboardViews ?? 0}`,
  ].join('\n')

  const growthLines = growthData && Object.keys(growthData).length > 0
    ? 'Growth vs Previous Period:\n' + Object.entries(growthData)
        .map(([k, v]) => `- ${safeLabel(k)}: ${v > 0 ? '+' : ''}${v}%`)
        .join('\n')
    : ''

  const statusLines = projectStatusData?.length
    ? 'Project Status:\n' + projectStatusData.map(p => `- ${p.name}: ${p.value}`).join('\n')
    : ''

  const teamLines = teamActivity?.length
    ? 'Top Team Contributors:\n' + teamActivity.slice(0, 5).map(m => `- ${m.name}: ${m.totalActions} actions (projects created: ${m.projectsCreated}, logins: ${m.logins})`).join('\n')
    : ''

  const typeLabels = {
    weekly: 'Weekly Report',
    monthly: 'Monthly Report',
    team_productivity: 'Team Productivity Report',
    executive_summary: 'Executive Summary',
  }

  const prompt = [
    `Generate a ${typeLabels[type] || 'Business Report'}.`,
    '',
    `Period: ${dateRange?.startDate || 'N/A'} to ${dateRange?.endDate || 'N/A'}`,
    '',
    'KPI Snapshot:',
    kpiLines,
    '',
    growthLines,
    '',
    `Projects: ${projectCount ?? 0} total, ${activeProjects ?? 0} active, ${completionRate ?? 0}% active rate`,
    `Total Analytics Events: ${totalEvents ?? 0}`,
    `Avg Daily Events: ${avgDailyEvents ?? 0}`,
    `Activity Log Entries: ${activityCount ?? 0}`,
    '',
    statusLines,
    teamLines ? '\n' + teamLines : '',
    '',
    'Return your analysis with two sections:',
    '',
    'INSIGHTS',
    '• 3-5 bullet points analyzing trends, anomalies, and patterns in the data above. Highlight key metrics with **bold**.',
    '',
    'RECOMMENDATIONS',
    '• 2-4 actionable next steps based on the data.',
  ].filter(Boolean).join('\n')

  try {
    const response = await getAIInsight(prompt, { maxTokens: 800, temperature: 0.3 })
    if (!response || response.length < 20) throw new Error('Empty AI response')

    const lines = response.split('\n')
    let recIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^recommendations?:?/i.test(lines[i].trim()) && lines[i].trim().length < 40) {
        recIdx = i
        break
      }
    }

    const extract = (sectionLines) => sectionLines
      .map(l => l.replace(/^[\s]*[•\-\*\d\.]+[\s\)]*/, '').trim())
      .filter(l => l.length > 10)
      .filter(l => !/^(insight|recommendation|analysis|data|based on|here |sure|according|the |this )/i.test(l))

    const insightLines = recIdx >= 0 ? lines.slice(0, recIdx) : lines
    const recLines = recIdx >= 0 ? lines.slice(recIdx + 1) : []
    const insights = extract(insightLines)
    const recommendations = extract(recLines)

    if (insights.length >= 1 || recommendations.length >= 1) {
      return {
        insights: insights.length >= 1 ? insights : ['Activity levels are stable with no significant anomalies detected.'],
        recommendations: recommendations.length >= 1 ? recommendations : ['Continue monitoring current metrics and maintain consistent team engagement.'],
      }
    }
  } catch (err) {
    console.warn('[Reports] AI generation failed, falling back to rule-based:', err.message)
  }

  return {
    insights: generateInsights(kpiData || {}, growthData || {}, projectCount || 0, activityCount || 0, type),
    recommendations: generateRecommendations(kpiData || {}, growthData || {}, projectCount || 0, activityCount || 0, type),
  }
}

export { generateAIReportContent }
