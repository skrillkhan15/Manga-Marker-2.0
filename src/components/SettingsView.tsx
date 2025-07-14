
"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Bookmark, ReadingStatus, BackupData, ThemeName, SortPreset, AuthProps, Folder } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Download, Upload, Trash2, Edit, Check, X, Plus, Tag, Palette, Text, Sun, Moon, Laptop, History, Lock, KeyRound, HelpCircle, Flame } from "lucide-react";
import { format } from 'date-fns';
import { Input } from './ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ColorPicker } from './ColorPicker';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { useTheme } from 'next-themes';
import * as CryptoJS from 'crypto-js';
import { Switch } from './ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface SettingsViewProps {
    bookmarks: Bookmark[];
    setBookmarks: (bookmarks: Bookmark[] | ((prev: Bookmark[]) => Bookmark[])) => void;
    readingStatuses: ReadingStatus[];
    setReadingStatuses: (statuses: ReadingStatus[] | ((prev: ReadingStatus[]) => ReadingStatus[])) => void;
    sortPresets: SortPreset[];
    setSortPresets: (presets: SortPreset[] | ((prev: SortPreset[]) => SortPreset[])) => void;
    allTags: string[];
    onRenameTag: (oldName: string, newName: string) => void;
    onDeleteTag: (tagName: string) => void;
    auth: AuthProps;
    folders: Folder[];
    setFolders: (folders: Folder[] | ((prev: Folder[]) => Folder[])) => void;
    onResetStreak: () => void;
}

const themes: { name: ThemeName, label: string, icon: React.FC<any> }[] = [
    { name: 'system', label: 'System', icon: Laptop },
    { name: 'light', label: 'Light', icon: Sun },
    { name: 'dark', label: 'Dark', icon: Moon },
    { name: 'mint', label: 'Mint', icon: Palette },
    { name: 'sunset', label: 'Sunset', icon: Palette },
    { name: 'ocean', label: 'Ocean', icon: Palette },
];

export default function SettingsView({ 
    bookmarks, 
    setBookmarks, 
    readingStatuses, 
    setReadingStatuses, 
    sortPresets,
    setSortPresets,
    allTags, 
    onRenameTag, 
    onDeleteTag,
    auth,
    folders,
    setFolders,
    onResetStreak
}: SettingsViewProps) {
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [editingStatus, setEditingStatus] = useState<ReadingStatus | null>(null);
    const [newStatusLabel, setNewStatusLabel] = useState('');
    const [newStatusColor, setNewStatusColor] = useState('#888888');
    const [newStatusIcon, setNewStatusIcon] = useState('');
    const [editingTag, setEditingTag] = useState<{ oldName: string; newName: string } | null>(null);
    const [fontSize, setFontSize] = useState(16);
    const [autoBackupTimestamp, setAutoBackupTimestamp] = useState<string | null>(null);
    const [exportPassword, setExportPassword] = useState('');
    const [importPassword, setImportPassword] = useState('');
    const [isEncryptedExportOpen, setIsEncryptedExportOpen] = useState(false);
    const [isEncryptedImportOpen, setIsEncryptedImportOpen] = useState(false);
    const [isChangePinOpen, setIsChangePinOpen] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');

    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const storedFontSize = localStorage.getItem('mangamarks-font-size');
        const initialSize = storedFontSize ? parseInt(storedFontSize, 10) : 16;
        setFontSize(initialSize);
        document.documentElement.style.setProperty('--font-size-base', `${initialSize}px`);

        const backupTime = localStorage.getItem('mangamarks-autobackup-timestamp');
        if (backupTime) {
            setAutoBackupTimestamp(new Date(parseInt(backupTime, 10)).toLocaleString());
        }
    }, []);

    const handleFontSizeChange = (value: number[]) => {
        const newSize = value[0];
        setFontSize(newSize);
        document.documentElement.style.setProperty('--font-size-base', `${newSize}px`);
        localStorage.setItem('mangamarks-font-size', newSize.toString());
    };

    const handleThemeChange = (newTheme: ThemeName) => {
        const currentThemeName = document.body.dataset.themeName;
        if (currentThemeName) {
            document.body.classList.remove(`theme-${currentThemeName}`);
        }
        if (newTheme !== 'system' && newTheme !== 'light' && newTheme !== 'dark') {
            document.body.classList.add(`theme-${newTheme}`);
            document.body.dataset.themeName = newTheme;
            localStorage.setItem('mangamarks-app-theme', newTheme);
        } else {
            delete document.body.dataset.themeName;
            localStorage.removeItem('mangamarks-app-theme');
        }
        setTheme(newTheme);
    };

    const tagCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const tag of allTags) {
            counts[tag] = 0;
        }
        for (const bookmark of bookmarks) {
            bookmark.tags?.forEach(tag => {
                if (counts[tag] !== undefined) {
                    counts[tag]++;
                }
            });
        }
        return counts;
    }, [bookmarks, allTags]);

    const handleExport = (password?: string) => {
        if (bookmarks.length === 0) {
            toast({ title: "No Bookmarks", description: "There's nothing to export yet.", variant: "destructive" });
            return;
        }
        const dataToExport: BackupData = {
            bookmarks,
            readingStatuses,
            sortPresets,
            folders
        };
        let jsonString = JSON.stringify(dataToExport, null, 2);

        if(password) {
            jsonString = CryptoJS.AES.encrypt(jsonString, password).toString();
        }

        const blob = new Blob([jsonString], {type: "text/json;charset=utf-8"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
        link.download = `MangaMarks_Backup_${timestamp}${password ? '_encrypted' : ''}.json`;
        link.click();
        URL.revokeObjectURL(link.href);

        toast({ title: "Export Successful", description: `Your data has been downloaded${password ? ' and encrypted' : ''}.`});
        if(isEncryptedExportOpen) setIsEncryptedExportOpen(false);
        setExportPassword('');
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

            if(text.includes('U2FsdGVkX1')) { // Basic check for an encrypted file
                setIsEncryptedImportOpen(true);
                 // We need to store the file content to be used after password input
                reader.onload = () => {
                    handleEncryptedImport(text, importPassword)
                };
                return; // Stop here, wait for password
            }

            parseAndLoadData(text);

          } catch (error) {
            handleImportError(error);
          } finally {
            if(event.target) event.target.value = '';
          }
        };

        const handleEncryptedImport = (encryptedData: string, password: string) => {
            if (!password) {
                toast({ title: "Import Failed", description: "Password is required for encrypted files.", variant: "destructive" });
                return;
            }
            try {
                const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
                const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
                if (!decryptedText) {
                    throw new Error("Invalid password or corrupted file.");
                }
                parseAndLoadData(decryptedText);
                setIsEncryptedImportOpen(false);
                setImportPassword('');
            } catch (error) {
                handleImportError(error);
            }
        }
        
        // This is a bit of a hack to re-use the reader with a new onload
        const originalOnload = reader.onload;
        const tempReader = new FileReader();
        tempReader.onload = (e) => {
             const text = e.target?.result as string;
             if(text.includes('U2FsdGVkX1')) {
                setIsEncryptedImportOpen(true);
                const importBtn = document.getElementById('confirm-encrypted-import');
                importBtn?.addEventListener('click', () => {
                    const password = (document.getElementById('import-password-input') as HTMLInputElement)?.value;
                    handleEncryptedImport(text, password);
                }, { once: true });
             } else {
                 if(originalOnload) originalOnload.call(reader, e);
             }
        }
        tempReader.readAsText(file);
    };

    const parseAndLoadData = (jsonData: string) => {
        const importedData = JSON.parse(jsonData);
        
        const { bookmarks, readingStatuses, sortPresets, folders } = importedData;

        if (Array.isArray(bookmarks) && Array.isArray(readingStatuses)) {
            setBookmarks(bookmarks);
            setReadingStatuses(readingStatuses);
            setSortPresets(sortPresets || []); // Handle presets, even if they don't exist in old backups
            setFolders(folders || []); // Handle folders
            toast({ title: "Import Successful", description: "Your data has been loaded." });
        } else {
            throw new Error("Invalid backup file format.");
        }
    }

    const handleImportError = (error: unknown) => {
        const description = error instanceof Error ? error.message : "Could not import data. File may be corrupt or in the wrong format.";
        toast({ title: "Import Failed", description, variant: "destructive" });
    }
    
    const handleRestoreAutoBackup = () => {
        const backupDataString = localStorage.getItem('mangamarks-autobackup');
        if (backupDataString) {
            try {
                const backupData: BackupData = JSON.parse(backupDataString);
                setBookmarks(backupData.bookmarks);
                setReadingStatuses(backupData.readingStatuses);
                setSortPresets(backupData.sortPresets || []);
                setFolders(backupData.folders || []);
                toast({ title: "Auto-Backup Restored", description: "Your data has been restored from the latest automatic backup." });
            } catch (error) {
                toast({ title: "Restore Failed", description: "The automatic backup data seems to be corrupted.", variant: "destructive" });
            }
        } else {
            toast({ title: "No Auto-Backup Found", description: "There is no automatic backup to restore from.", variant: "destructive" });
        }
    };

    const handleAddNewStatus = () => {
        if (!newStatusLabel.trim()) {
            toast({ title: "Invalid Label", description: "Status label cannot be empty.", variant: "destructive" });
            return;
        }
        setReadingStatuses(prev => [
            ...prev,
            { id: Date.now().toString(), label: newStatusLabel, color: newStatusColor, icon: newStatusIcon }
        ]);
        setNewStatusLabel('');
        setNewStatusColor('#888888');
        setNewStatusIcon('');
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
        const bookmarksWithStatus = bookmarks.some(b => b.statusId === statusId);
        if (bookmarksWithStatus) {
            toast({ title: "Cannot Delete", description: "This status is in use by one or more bookmarks. Reassign them before deleting.", variant: "destructive" });
            return;
        }
        setReadingStatuses(prev => prev.filter(s => s.id !== statusId));
    };

    const handleRenameTag = () => {
        if (!editingTag) return;
        const { oldName, newName } = editingTag;
        if (!newName.trim()) {
             toast({ title: "Invalid Name", description: "Tag name cannot be empty.", variant: "destructive" });
             return;
        }
        if (allTags.includes(newName.trim()) && newName.trim() !== oldName) {
            // This is a merge operation
            const existingCount = tagCounts[newName.trim()];
            toast({ title: "Tags Merged", description: `Tag "${oldName}" was merged into "${newName}". ${existingCount + tagCounts[oldName]} bookmarks now have this tag.` });
        } else if (newName.trim() !== oldName) {
            toast({ title: "Tag Renamed", description: `Tag "${oldName}" was successfully renamed to "${newName}".`});
        }
        onRenameTag(oldName, newName.trim());
        setEditingTag(null);
    };

    const startEditingTag = (tagName: string) => {
        setEditingTag({ oldName: tagName, newName: tagName });
    };

    const handleChangePin = async () => {
        if (!auth.isPinSet) return;
        
        const isCurrentPinValid = await auth.checkPin(currentPin);
        if (!isCurrentPinValid) {
            toast({ title: "Error", description: "Current PIN is incorrect.", variant: "destructive" });
            return;
        }
        if (newPin.length < 4) {
            toast({ title: "Error", description: "New PIN must be at least 4 digits.", variant: "destructive" });
            return;
        }
        if (newPin !== confirmNewPin) {
            toast({ title: "Error", description: "New PINs do not match.", variant: "destructive" });
            return;
        }

        auth.changePin(newPin);
        toast({ title: "Success", description: "Your PIN has been changed." });
        setCurrentPin('');
        setNewPin('');
        setConfirmNewPin('');
        setIsChangePinOpen(false);
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            
             <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Theme</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                           {themes.map(t => (
                                <Button key={t.name} variant={theme === t.name ? 'default' : 'outline'} onClick={() => handleThemeChange(t.name)}>
                                   <t.icon className="mr-2 h-4 w-4" />
                                   {t.label}
                                </Button>
                           ))}
                        </div>
                    </div>
                    <div>
                       <Label htmlFor="font-size-slider" className="block mb-2">Font Size</Label>
                        <div className="flex items-center gap-4">
                           <Text className="h-5 w-5" />
                           <Slider
                                id="font-size-slider"
                                min={12}
                                max={20}
                                step={1}
                                value={[fontSize]}
                                onValueChange={handleFontSizeChange}
                            />
                           <Text className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your application lock settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <KeyRound className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <h3 className="font-semibold">Enable PIN Lock</h3>
                                <p className="text-sm text-muted-foreground">
                                    Secure the app with a PIN code.
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={auth.isLockEnabled}
                            onCheckedChange={(checked) => auth.setIsLockEnabled(checked)}
                        />
                    </div>
                    {auth.isLockEnabled && auth.isPinSet && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <h3 className="font-semibold">PIN Actions</h3>
                            <div className="flex gap-2">
                                <AlertDialog open={isChangePinOpen} onOpenChange={setIsChangePinOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="secondary">Change PIN</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Change PIN</AlertDialogTitle>
                                        </AlertDialogHeader>
                                        <div className="space-y-2">
                                            <Input type="password" placeholder="Current PIN" value={currentPin} onChange={e => setCurrentPin(e.target.value)} />
                                            <Input type="password" placeholder="New PIN" value={newPin} onChange={e => setNewPin(e.target.value)} />
                                            <Input type="password" placeholder="Confirm New PIN" value={confirmNewPin} onChange={e => setConfirmNewPin(e.target.value)} />
                                        </div>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleChangePin}>Save Changes</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                         <Button variant="destructive">Reset App</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete all your bookmarks, statuses, presets, and settings, and remove the PIN lock.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => auth.resetApp()}>Reset App</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Import or export your bookmarks. Importing will overwrite your current lists.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button onClick={() => handleExport()} disabled={bookmarks.length === 0} className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Export to JSON
                        </Button>
                        <AlertDialog open={isEncryptedExportOpen} onOpenChange={setIsEncryptedExportOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="secondary" disabled={bookmarks.length === 0} className="w-full">
                                    <Lock className="mr-2 h-4 w-4" /> Encrypt & Export
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Set Export Password</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter a password to encrypt your backup file. You will need this password to import it later.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Input 
                                    id="export-password-input"
                                    type="password"
                                    placeholder="Enter password..."
                                    value={exportPassword}
                                    onChange={(e) => setExportPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleExport(exportPassword)}
                                />
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleExport(exportPassword)} disabled={!exportPassword}>Confirm & Export</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button onClick={handleImportClick} variant="outline" className="w-full col-span-1 sm:col-span-2">
                            <Upload className="mr-2 h-4 w-4" /> Import from JSON
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                         <AlertDialog open={isEncryptedImportOpen} onOpenChange={setIsEncryptedImportOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Encrypted File Detected</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Please enter the password to decrypt and import your backup file.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <Input 
                                    id="import-password-input"
                                    type="password"
                                    placeholder="Enter password..."
                                    value={importPassword}
                                    onChange={(e) => setImportPassword(e.target.value)}
                                />
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setImportPassword('')}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction id="confirm-encrypted-import" disabled={!importPassword}>Decrypt & Import</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <History className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1">
                            <h3 className="font-semibold">Automatic Local Backup</h3>
                            <p className="text-sm text-muted-foreground">
                                Last backup: {autoBackupTimestamp || 'Never'}
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="secondary" disabled={!autoBackupTimestamp}>Restore</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Restore from Auto-Backup?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                       This will overwrite your current bookmarks and settings with the data from the last automatic backup created on {autoBackupTimestamp}. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRestoreAutoBackup}>Restore</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <Flame className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1">
                            <h3 className="font-semibold">Reading Streak</h3>
                            <p className="text-sm text-muted-foreground">
                                Reset your current reading streak.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="secondary">Reset Streak</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Reading Streak?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                       Are you sure you want to reset your reading streak back to zero?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={onResetStreak}>Reset</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
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
                                        <Input
                                            value={editingStatus.icon || ''}
                                            onChange={(e) => setEditingStatus(s => s ? {...s, icon: e.target.value.slice(0, 2)} : null)}
                                            placeholder="🔥"
                                            className="h-8 w-12 text-center"
                                        />
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
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateStatus()}
                                            className="h-8 flex-1"
                                        />
                                        <Button size="icon" className="h-8 w-8" onClick={handleUpdateStatus}><Check className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingStatus(null)}><X className="w-4 h-4" /></Button>
                                    </>
                                ) : (
                                    <>
                                        {status.icon && <span className="text-lg w-5 text-center">{status.icon}</span>}
                                        <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: status.color }}></div>
                                        <span className="flex-1 font-medium">{status.label}</span>
                                        <Button variant="ghost" size="icon" onClick={() => setEditingStatus({...status})} className="w-8 h-8">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" disabled={bookmarks.some(b => b.statusId === status.id)}>
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
                        <Input
                            placeholder="🔥"
                            value={newStatusIcon}
                            onChange={(e) => setNewStatusIcon(e.target.value.slice(0, 2))}
                            className="h-8 w-12 text-center"
                        />
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
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNewStatus()}
                            className="h-8 flex-1"
                        />
                        <Button size="icon" className="h-8 w-8" onClick={handleAddNewStatus} disabled={!newStatusLabel.trim()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Tags</CardTitle>
                    <CardDescription>Rename, merge, or delete tags across all your bookmarks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {allTags.length > 0 ? allTags.map(tag => (
                       <div key={tag} className="flex items-center gap-2 p-2 border rounded-lg">
                            {editingTag?.oldName === tag ? (
                                <>
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <Input 
                                        value={editingTag.newName}
                                        onChange={(e) => setEditingTag(t => t ? {...t, newName: e.target.value} : null)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRenameTag()}
                                        className="h-8"
                                    />
                                    <Button size="icon" className="h-8 w-8" onClick={handleRenameTag}><Check className="w-4 h-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTag(null)}><X className="w-4 h-4" /></Button>
                                </>
                            ) : (
                                <>
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <span className="flex-1 font-medium">{tag}</span>
                                    <Badge variant="secondary">{tagCounts[tag]}</Badge>
                                    <Button variant="ghost" size="icon" onClick={() => startEditingTag(tag)} className="w-8 h-8">
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
                                                    This will permanently remove the "{tag}" tag from all {tagCounts[tag]} bookmarks. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteTag(tag)}>Delete Tag</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                       </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No tags yet. Add tags to your bookmarks to manage them here.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Help & FAQ</CardTitle>
                    <CardDescription>Find answers to common questions about using MangaMarks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>How do I add a new bookmark?</AccordionTrigger>
                            <AccordionContent>
                                Click the "Add New Bookmark" button in the top header. You can paste a URL and click the sparkle icon ✨ to try and automatically fill in the title and chapter number. You can also fill in all the details manually, including uploading a custom cover image.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>How do I edit multiple bookmarks?</AccordionTrigger>
                            <AccordionContent>
                                On desktop, you can use the checkboxes to select multiple bookmarks. On mobile, you can long-press a bookmark to enter selection mode. Once you have items selected, a new toolbar will appear at the top of the list allowing you to delete, move to a folder, or update the status of the selected bookmarks all at once.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>How do swipe gestures work on mobile?</AccordionTrigger>
                            <AccordionContent>
                                In the bookmark list on a mobile device, you can swipe a bookmark to the left to reveal quick actions. Swiping will show buttons to quickly toggle a bookmark as a favorite or to delete it.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>What if I forget my PIN?</AccordionTrigger>
                            <AccordionContent>
                                For security, there is no way to recover a forgotten PIN. You will need to click the "Forgot PIN?" link on the lock screen. This will trigger a full app reset, which will permanently delete all your bookmarks and settings. Be sure to make regular backups.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger>What is the Bookmark History feature?</AccordionTrigger>
                            <AccordionContent>
                                Every time you save a change to a bookmark, the app saves a snapshot of its previous state. In the "History" tab of the edit form, you can view these previous versions and revert the bookmark back to an older state if you made a mistake.
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-6">
                            <AccordionTrigger>What are folders?</AccordionTrigger>
                            <AccordionContent>
                                Folders are a way to manually group your bookmarks into collections, like a bookshelf. You can create, rename, and delete folders from the sidebar. A bookmark can only be in one folder at a time. This is different from tags, where a bookmark can have multiple tags.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

        </div>
    );
}
