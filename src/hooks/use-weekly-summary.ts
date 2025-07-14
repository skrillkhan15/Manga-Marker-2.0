
"use client";

import { useEffect } from 'react';
import useLocalStorage from './use-local-storage';
import type { WeeklySummary } from '@/types';
import { startOfWeek, addDays, isBefore } from 'date-fns';

const getInitialSummary = (): WeeklySummary => ({
    chaptersRead: 0,
    seriesUpdated: [],
    startDate: startOfWeek(new Date()).toISOString(),
});

export function useWeeklySummary() {
    const [weeklySummary, setWeeklySummary] = useLocalStorage<WeeklySummary>("mangamarks-weekly-summary", getInitialSummary());

    useEffect(() => {
        const checkAndResetSummary = () => {
            const now = new Date();
            const weekEndDate = addDays(new Date(weeklySummary.startDate), 7);
            
            if (isBefore(weekEndDate, now)) {
                // It's a new week
                setWeeklySummary(getInitialSummary());
            }
        };

        checkAndResetSummary();
        // Check once per day or on app load
    }, []); // This simple check on load is sufficient for this use case.

    const incrementChapters = (count: number) => {
        setWeeklySummary(prev => ({
            ...prev,
            chaptersRead: prev.chaptersRead + count,
        }));
    };

    const addSeriesUpdate = (bookmarkId: string) => {
        setWeeklySummary(prev => {
            if (prev.seriesUpdated.includes(bookmarkId)) {
                return prev; // Already updated this week
            }
            return {
                ...prev,
                seriesUpdated: [...prev.seriesUpdated, bookmarkId],
            };
        });
    };
    
    const resetSummary = () => {
        setWeeklySummary(getInitialSummary());
    };

    return { weeklySummary, incrementChapters, addSeriesUpdate, resetSummary };
}

    