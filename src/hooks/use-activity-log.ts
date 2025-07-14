
"use client";

import useLocalStorage from './use-local-storage';
import type { ActivityLog, ActivityLogType } from '@/types';

const MAX_LOG_ENTRIES = 200;

export function useActivityLog() {
    const [activityLog, setActivityLog] = useLocalStorage<ActivityLog[]>("mangamarks-activity-log", []);

    const addLogEntry = (type: ActivityLogType, description: string, bookmarkId?: string, bookmarkTitle?: string) => {
        const newLog: ActivityLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            type,
            description,
            bookmarkId,
            bookmarkTitle,
        };

        setActivityLog(prev => [newLog, ...prev].slice(0, MAX_LOG_ENTRIES));
    };
    
    const clearLog = () => {
        setActivityLog([]);
    };

    return { activityLog, setActivityLog, addLogEntry, clearLog };
}
