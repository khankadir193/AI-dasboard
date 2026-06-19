import { TrendingUp, Users, Target, Package } from 'lucide-react';

export const ANALYSIS_TYPES = [
    {
        text: 'Analyze project completion trends and identify bottlenecks.',
        icon: TrendingUp,
        title: 'Project Performance',
        description: 'Analyze project completion trends, project progress, and delivery performance',
    },
    {
        text: 'Analyze team productivity and workload distribution.',
        icon: Users,
        title: 'Team Productivity',
        description: 'Review team workload, contribution patterns, and productivity metrics',
    },
    {
        text: 'Analyze recent activity logs and highlight key trends.',
        icon: Target,
        title: 'Activity Insights',
        description: 'Review activity logs and identify engagement patterns',
    },
    {
        text: 'Analyze dashboard metrics and identify improvement opportunities.',
        icon: Package,
        title: 'Dashboard Analytics',
        description: 'Summarize dashboard metrics and overall workspace health',
    },
];
