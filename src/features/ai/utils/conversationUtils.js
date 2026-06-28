import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

export function groupConversations(conversations) {
    const groups = {
        today: [],
        yesterday: [],
        last7Days: [],
        last30Days: [],
        older: [],
    };

    const now = new Date();

    conversations.forEach((conv) => {
        const updatedAt = conv.updated_at ? new Date(conv.updated_at) : null;
        if (!updatedAt) {
            groups.older.push(conv);
            return;
        }

        if (isToday(updatedAt)) {
            groups.today.push(conv);
        } else if (isYesterday(updatedAt)) {
            groups.yesterday.push(conv);
        } else if (differenceInDays(now, updatedAt) <= 7) {
            groups.last7Days.push(conv);
        } else if (differenceInDays(now, updatedAt) <= 30) {
            groups.last30Days.push(conv);
        } else {
            groups.older.push(conv);
        }
    });

    return groups;
}

export function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const daysDiff = differenceInDays(now, date);

    if (daysDiff === 0) {
        return format(date, 'h:mm a');
    } else if (daysDiff === 1) {
        return 'Yesterday';
    } else if (daysDiff < 7) {
        return format(date, 'EEE');
    } else {
        return format(date, 'MMM d');
    }
}
