
"use client";

import * as React from 'react';
import { Calendar } from './ui/calendar';
import type { ActivityLog } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { isSameDay, parseISO } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';

interface ReadingCalendarProps {
  activityLog: ActivityLog[];
}

export function ReadingCalendar({ activityLog }: ReadingCalendarProps) {
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>();

  const activityDays = React.useMemo(() => {
    const days = new Set<string>();
    activityLog.forEach(log => days.add(parseISO(log.timestamp).toDateString()));
    return Array.from(days).map(dayString => new Date(dayString));
  }, [activityLog]);

  const selectedDayActivities = React.useMemo(() => {
    if (!selectedDay) return [];
    return activityLog.filter(log => isSameDay(parseISO(log.timestamp), selectedDay));
  }, [selectedDay, activityLog]);

  const modifiers = {
    activity: activityDays,
  };

  const modifiersStyles = {
    activity: {
      position: 'relative' as React.CSSProperties['position'],
      '&::after': {
        content: '""',
        display: 'block',
        position: 'absolute' as React.CSSProperties['position'],
        bottom: '4px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: 'hsl(var(--primary))',
      },
    },
  };

  // The style object for react-day-picker is a bit tricky, we need to inject styles.
  // This is a common pattern for libraries that don't directly support tailwind.
  const style = `
    .rdp-day_activity::after {
      content: '';
      display: block;
      position: absolute;
      bottom: 4px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: hsl(var(--primary));
    }
  `;

  return (
    <>
      <style>{style}</style>
      <Popover>
        <PopoverTrigger asChild>
            <div>
                <Calendar
                    mode="single"
                    selected={selectedDay}
                    onSelect={(day) => {
                        // Only trigger popover if the day has activity
                        if (day && activityDays.some(d => isSameDay(d, day))) {
                             setSelectedDay(day);
                        } else {
                            setSelectedDay(undefined);
                        }
                    }}
                    modifiers={modifiers}
                    modifiersClassNames={{ activity: 'activity' }}
                    className="rounded-md border"
                    />
            </div>
        </PopoverTrigger>
        {selectedDay && selectedDayActivities.length > 0 && (
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Activity on {selectedDay.toLocaleDateString()}</h4>
                        <p className="text-sm text-muted-foreground">
                            You made {selectedDayActivities.length} update(s).
                        </p>
                    </div>
                    <ScrollArea className="h-48">
                        <div className="grid gap-2 pr-4">
                            {selectedDayActivities.map((log) => (
                                <div key={log.id} className="text-xs p-2 bg-muted/50 rounded-md">
                                    <p>{log.description}</p>
                                    <p className="text-muted-foreground/80">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </PopoverContent>
        )}
      </Popover>
    </>
  );
}
