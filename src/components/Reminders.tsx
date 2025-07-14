
"use client";

import { Bookmark } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { BellRing, X } from "lucide-react";

interface RemindersProps {
    reminders: Bookmark[];
    onDismiss: (bookmarkId: string) => void;
}

export function Reminders({ reminders, onDismiss }: RemindersProps) {
    if (reminders.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2 mb-6">
            {reminders.map(bookmark => (
                <Alert key={bookmark.id} className="flex items-center justify-between animate-fade-in">
                   <div className="flex items-center gap-4">
                     <BellRing className="h-5 w-5 text-primary" />
                     <div>
                        <AlertTitle>Reminder: Time to read!</AlertTitle>
                        <AlertDescription>
                           It's time to check for a new chapter of <strong>{bookmark.title}</strong>.
                        </AlertDescription>
                     </div>
                   </div>
                   <div className="flex gap-2">
                        <Button asChild size="sm">
                            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">Read</a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onDismiss(bookmark.id)}>
                            <X className="h-4 w-4" />
                        </Button>
                   </div>
                </Alert>
            ))}
        </div>
    );
}
