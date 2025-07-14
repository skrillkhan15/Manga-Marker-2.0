"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Bookmark } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Download, Upload } from "lucide-react";

interface SettingsViewProps {
    bookmarks: Bookmark[];
    setBookmarks: (bookmarks: Bookmark[]) => void;
}

export default function SettingsView({ bookmarks, setBookmarks }: SettingsViewProps) {
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (bookmarks.length === 0) {
            toast({ title: "No Bookmarks", description: "There's nothing to export yet.", variant: "destructive" });
            return;
        }
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(bookmarks, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "mangamarks_backup.json";
        link.click();
        toast({ title: "Export Successful", description: "Your bookmarks have been downloaded."});
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
              throw new Error("File content is not valid text.");
            }
            const importedBookmarks: Bookmark[] = JSON.parse(text);
            
            // Basic validation
            if (Array.isArray(importedBookmarks) && importedBookmarks.every(b => b.id && b.title && b.url && b.lastUpdated)) {
              setBookmarks(importedBookmarks);
              toast({ title: "Import Successful", description: "Your bookmarks have been loaded." });
            } else {
              throw new Error("Invalid bookmark file format.");
            }
          } catch (error) {
            const description = error instanceof Error ? error.message : "Could not import bookmarks. File may be corrupt or in the wrong format.";
            toast({ title: "Import Failed", description, variant: "destructive" });
          } finally {
            if(event.target) event.target.value = '';
          }
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Import or export your bookmarks data. Importing will overwrite your current list.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleImportClick} variant="outline" className="w-full">
                        <Upload className="mr-2 h-4 w-4" /> Import from JSON
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                    <Button onClick={handleExport} disabled={bookmarks.length === 0} className="w-full">
                        <Download className="mr-2 h-4 w-4" /> Export to JSON
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
