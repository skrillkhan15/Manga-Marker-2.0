
"use client";

import { ActivityLog } from "@/types";
import { History, Trash2, BookOpenCheck, Edit, Trash, Star, Move, PlusCircle } from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

interface ActivityLogViewProps {
    logs: ActivityLog[];
    onClearLog: () => void;
}

const logIcons = {
    CREATE: <PlusCircle className="w-5 h-5 text-green-500" />,
    UPDATE: <Edit className="w-5 h-5 text-blue-500" />,
    DELETE: <Trash className="w-5 h-5 text-red-500" />,
    FAVORITE: <Star className="w-5 h-5 text-yellow-500" />,
    STATUS: <BookOpenCheck className="w-5 h-5 text-indigo-500" />,
    MOVE: <Move className="w-5 h-5 text-purple-500" />,
};


export default function ActivityLogView({ logs, onClearLog }: ActivityLogViewProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Activity Log</h1>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={logs.length === 0}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear Log
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Clear Activity Log?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete all activity log entries. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onClearLog}>Clear Log</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Actions</CardTitle>
                    <CardDescription>A timeline of all changes made in the app.</CardDescription>
                </CardHeader>
                <CardContent>
                    {logs.length > 0 ? (
                        <ScrollArea className="h-[60vh]">
                            <div className="relative pl-6">
                                {/* Vertical line */}
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 ml-3"></div>
                                
                                {logs.map(log => (
                                    <div key={log.id} className="relative flex items-start gap-4 mb-6">
                                        <div className="absolute left-0 top-1.5 w-6 h-6 bg-background border-2 border-primary rounded-full flex items-center justify-center -translate-x-1/2">
                                            {logIcons[log.type] || <History className="w-4 h-4 text-primary"/>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">{log.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-64 bg-muted/20">
                            <History className="w-16 h-16 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold">No Activity Yet</h2>
                            <p className="text-muted-foreground">Start using the app and your actions will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
