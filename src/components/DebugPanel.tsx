
"use client";

import { useEffect, useState } from "react";
import type { Bookmark, CurrentFilterState } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Download, Database, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

interface DebugPanelProps {
    bookmarks: Bookmark[];
    currentFilterState: CurrentFilterState | null;
}

export function DebugPanel({ bookmarks, currentFilterState }: DebugPanelProps) {
    const [localStorageSize, setLocalStorageSize] = useState(0);
    const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null);

    useEffect(() => {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('mangamarks-')) {
                const value = localStorage.getItem(key);
                if (value) {
                    total += new Blob([value]).size;
                }
            }
        }
        setLocalStorageSize(total);
    }, [bookmarks]); // Re-calculate when bookmarks change

    const selectedBookmark = bookmarks.find(b => b.id === selectedBookmarkId);

    const handleExportFilterState = () => {
        if (!currentFilterState) return;
        const jsonString = JSON.stringify(currentFilterState, null, 2);
        const blob = new Blob([jsonString], { type: "text/json;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "MangaMarks_FilterState.json";
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <Card className="border-primary/50 animate-fade-in">
            <CardHeader>
                <CardTitle>Developer Debug Panel</CardTitle>
                <CardDescription>Advanced tools and information for power users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <Database className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <h3 className="font-semibold">Local Storage Usage</h3>
                            <p className="text-sm text-muted-foreground">
                                Total size of app data stored in your browser.
                            </p>
                        </div>
                    </div>
                    <p className="font-mono text-lg font-semibold">{(localStorageSize / 1024).toFixed(2)} KB</p>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                     <h3 className="font-semibold">Inspect Bookmark JSON</h3>
                     <Select onValueChange={setSelectedBookmarkId} value={selectedBookmarkId || ""}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a bookmark to inspect" />
                        </SelectTrigger>
                        <SelectContent>
                            {bookmarks.map(bookmark => (
                                <SelectItem key={bookmark.id} value={bookmark.id}>
                                    {bookmark.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedBookmark && (
                        <Textarea
                            readOnly
                            value={JSON.stringify(selectedBookmark, null, 2)}
                            className="h-64 resize-y font-mono text-xs"
                        />
                    )}
                </div>

                 <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <Filter className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <h3 className="font-semibold">Export Current Filter State</h3>
                            <p className="text-sm text-muted-foreground">
                                Download a JSON file of the current view settings.
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleExportFilterState} disabled={!currentFilterState}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
