
"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Bookmark, ReadingStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Download, Upload, Trash2, Edit, Check, X, Plus } from "lucide-react";
import { format } from 'date-fns';
import { Input } from './ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ColorPicker } from './ColorPicker';

interface SettingsViewProps {
    bookmarks: Bookmark[];
    setBookmarks: (bookmarks: Bookmark[] | ((prev: Bookmark[]) => Bookmark[])) => void;
    readingStatuses: ReadingStatus[];
    setReadingStatuses: (statuses: ReadingStatus[] | ((prev: ReadingStatus[]) => ReadingStatus[])) => void;
}

export default function SettingsView({ bookmarks, setBookmarks, readingStatuses, setReadingStatuses }: SettingsViewProps) {
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [editingStatus, setEditingStatus] = useState<ReadingStatus | null>(null);
    const [newStatusLabel, setNewStatusLabel] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#888888');

    const handleExport = () => {
        if (bookmarks.length === 0) {
            toast({ title: "No Bookmarks", description: "There's nothing to export yet.", variant: "destructive" });
            return;
        }
        const dataToExport = {
            bookmarks,
            readingStatuses,
        };
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(dataToExport, null, 2)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const timestamp = format(new Date(), 'yyyy-MM-dd');
        link.download = `mangamarks_backup_${timestamp}.json`;
        link.click();
        toast({ title: "Export Successful", description: "Your bookmarks and statuses have been downloaded."});
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
            const importedData = JSON.parse(text);
            
            const importedBookmarks = importedData.bookmarks;
            const importedStatuses = importedData.readingStatuses;

            if (Array.isArray(importedBookmarks) && importedBookmarks.every(b => b.id && b.title && b.url && b.lastUpdated) && Array.isArray(importedStatuses)) {
              setBookmarks(importedBookmarks);
              setReadingStatuses(importedStatuses);
              toast({ title: "Import Successful", description: "Your bookmarks and statuses have been loaded." });
            } else {
              throw new Error("Invalid backup file format.");
            }
          } catch (error) {
            const description = error instanceof Error ? error.message : "Could not import data. File may be corrupt or in the wrong format.";
            toast({ title: "Import Failed", description, variant: "destructive" });
          } finally {
            if(event.target) event.target.value = '';
          }
        };
        reader.readAsText(file);
    };

    const handleAddNewStatus = () => {
        if (!newStatusLabel.trim()) {
            toast({ title: "Invalid Label", description: "Status label cannot be empty.", variant: "destructive" });
            return;
        }
        setReadingStatuses(prev => [
            ...prev,
            { id: Date.now().toString(), label: newStatusLabel, color: newStatusColor }
        ]);
        setNewStatusLabel('');
        setNewStatusColor('#888888');
    };

    const handleUpdateStatus = () => {
        if (!editingStatus || !editingStatus.label.trim()) {
            toast({ title: "Invalid Label", description: "Status label cannot be empty.", variant: "destructive" });
            return;
        }
        setReadingStatuses(prev => prev.map(s => s.id === editingStatus.id ? editingStatus : s));
        setEditingStatus(null);
    };

    const handleDeleteStatus = (statusId: string) => {
        const statusToDelete = readingStatuses.find(s => s.id === statusId);
        if (statusToDelete && statusToDelete.id.startsWith("default-")) {
            toast({ title: "Cannot Delete", description: "Default statuses cannot be deleted.", variant: "destructive" });
            return;
        }
        
        const bookmarksWithStatus = bookmarks.some(b => b.statusId === statusId);
        if (bookmarksWithStatus) {
            toast({ title: "Cannot Delete", description: "This status is currently in use by one or more bookmarks.", variant: "destructive" });
            return;
        }
        setReadingStatuses(prev => prev.filter(s => s.id !== statusId));
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Import or export your bookmarks and custom statuses. Importing will overwrite your current lists.</CardDescription>
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

            <Card>
                <CardHeader>
                    <CardTitle>Manage Reading Statuses</CardTitle>
                    <CardDescription>Create, edit, or delete your custom reading statuses.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {readingStatuses.map(status => (
                            <div key={status.id} className="flex items-center gap-2 p-2 border rounded-lg">
                                {editingStatus?.id === status.id ? (
                                    <>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="icon" style={{ backgroundColor: editingStatus.color }} className="w-8 h-8 shrink-0">
                                                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: editingStatus.color }}></div>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <ColorPicker color={editingStatus.color} onChange={(color) => setEditingStatus(s => s ? {...s, color} : null)} />
                                            </PopoverContent>
                                        </Popover>
                                        <Input
                                            value={editingStatus.label}
                                            onChange={(e) => setEditingStatus(s => s ? {...s, label: e.target.value} : null)}
                                            className="h-8"
                                        />
                                        <Button size="icon" className="h-8 w-8" onClick={handleUpdateStatus}><Check className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingStatus(null)}><X className="w-4 h-4" /></Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: status.color }}></div>
                                        <span className="flex-1 font-medium">{status.label}</span>
                                        <Button variant="ghost" size="icon" onClick={() => setEditingStatus({...status})} className="w-8 h-8">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently delete the "{status.label}" status. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteStatus(status.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 p-2 border rounded-lg border-dashed">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" style={{ backgroundColor: newStatusColor }} className="w-8 h-8 shrink-0">
                                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: newStatusColor }}></div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <ColorPicker color={newStatusColor} onChange={setNewStatusColor} />
                            </PopoverContent>
                        </Popover>
                        <Input
                            placeholder="New status label..."
                            value={newStatusLabel}
                            onChange={(e) => setNewStatusLabel(e.target.value)}
                            className="h-8"
                        />
                        <Button size="icon" className="h-8 w-8" onClick={handleAddNewStatus} disabled={!newStatusLabel.trim()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
