
"use client";

import { useEffect } from 'react';
import useLocalStorage from './use-local-storage';
import type { DailySummary } from '@/types';
import { isToday, startOfToday } from 'date-fns';

const getInitialSummary = (): DailySummary => ({
    chaptersRead: 0,
    date: startOfToday().toISOString(),
});

export function useDailySummary() {
    const [dailySummary, setDailySummary] = useLocalStorage<DailySummary>("mangamarks-daily-summary", getInitialSummary());

    useEffect(() => {
        const checkAndResetSummary = () => {
            if (!isToday(new Date(dailySummary.date))) {
                setDailySummary(getInitialSummary());
            }
        };

        checkAndResetSummary();
        // This effect runs on mount, which is sufficient for this purpose.
        // It will reset if the last visit was not today.
    }, []); 

    const incrementChaptersToday = (count: number) => {
        setDailySummary(prev => {
             // Double check if the date is still today before incrementing
            if (!isToday(new Date(prev.date))) {
                return {
                    chaptersRead: count,
                    date: startOfToday().toISOString(),
                };
            }
            return {
                ...prev,
                chaptersRead: prev.chaptersRead + count,
            };
        });
    };

    return { dailySummary, incrementChaptersToday };
}
