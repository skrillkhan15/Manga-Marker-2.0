
"use client";

import { useState, useMemo, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Bookmark, View, ReadingStatus, BackupData, BookmarkHistory, SortPreset, Folder } from "@/types";
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarTrigger, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { BookMarked, LayoutDashboard, List, Loader2, Settings, Folder as FolderIcon, Plus, Edit2, Trash2, X, MoreVertical, FolderPlus, Check } from 'lucide-react';
import BookmarkList from '@/components/BookmarkList';
import Dashboard from '@/components/Dashboard';
import SettingsView from '@/components/SettingsView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BookmarkDialog } from '@/components/BookmarkDialog';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useAuthLock } from '@/hooks/use-auth-lock';
import LockScreen from '@/components/LockScreen';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Reminders } from '@/components/Reminders';
import { isPast, isToday, isYesterday, startOfDay } from 'date-fns';

const defaultStatuses: ReadingStatus[] = [
    { id: 'reading', label: 'Reading', color: '#3b82f6', icon: '📖' },
    { id: 'completed', label: 'Completed', color: '#22c55e', icon: '✅' },
    { id: 'on-hold', label: 'On Hold', color: '#eab308', icon: '⏸️' },
    { id: 'dropped', label: 'Dropped', color: '#ef4444', icon: '🗑️' },
    { id: 'plan-to-read', label: 'Plan to Read', color: '#6b7280', icon: '🗓️' }
];

const MAX_HISTORY = 5;

export default function Home() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>("manga-bookmarks", []);
  const [readingStatuses, setReadingStatuses] = useLocalStorage<ReadingStatus[]>("manga-statuses", defaultStatuses);
  const [sortPresets, setSortPresets] = useLocalStorage<SortPreset[]>("manga-presets", []);
  const [folders, setFolders] = useLocalStorage<Folder[]>("manga-folders", []);
  const [readingStreak, setReadingStreak] = useLocalStorage<number>("mangamarks-streak-count", 0);
  const [lastStreakUpdate, setLastStreakUpdate] = useLocalStorage<string>("mangamarks-streak-last-update", "");
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  
  const {
    isLocked,
    isLockEnabled,
    setIsLockEnabled,
    unlockApp,
    setPin,
    changePin,
    resetApp,
    isPinSet,
    checkPin,
  } = useAuthLock();

  useEffect(() => {
    setIsMounted(true);
    // Auto-backup logic
    const lastBackup = localStorage.getItem('mangamarks-autobackup-timestamp');
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (!lastBackup || (now - parseInt(lastBackup, 10)) > threeDays) {
      if (bookmarks.length > 0) {
        const backupData: BackupData = { bookmarks, readingStatuses, sortPresets, folders };
        localStorage.setItem('mangamarks-autobackup', JSON.stringify(backupData));
        localStorage.setItem('mangamarks-autobackup-timestamp', now.toString());
        console.log('MangaMarks: Performed automatic backup.');
      }
    }
  }, [bookmarks, readingStatuses, sortPresets, folders]);
  
  const dueReminders = useMemo(() => {
    const now = new Date();
    return bookmarks.filter(b => b.reminderDate && isPast(new Date(b.reminderDate)));
  }, [bookmarks]);

  const dismissReminder = (bookmarkId: string) => {
    setBookmarks(prev => 
      prev.map(b => b.id === bookmarkId ? { ...b, reminderDate: undefined } : b)
    );
  };

  const updateReadingStreak = () => {
    const today = new Date();
    const lastUpdateDate = lastStreakUpdate ? new Date(lastStreakUpdate) : null;

    if (!lastUpdateDate || !isToday(lastUpdateDate)) {
        if (lastUpdateDate && isYesterday(lastUpdateDate)) {
            // Consecutive day
            setReadingStreak(prev => prev + 1);
        } else {
            // Not a consecutive day, reset to 1
            setReadingStreak(1);
        }
        setLastStreakUpdate(startOfDay(today).toISOString());
    }
    // If it's the same day, do nothing.
  };

  const addFolder = (name: string) => {
    const newFolder: Folder = { id: Date.now().toString(), name };
    setFolders(prev => [...prev, newFolder]);
    toast({ title: "Folder Created", description: `"${name}" has been added.` });
  };

  const renameFolder = (id: string, newName: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
    toast({ title: "Folder Renamed" });
  };

  const deleteFolder = (id: string) => {
    // Unassign bookmarks from the folder being deleted
    setBookmarks(prev => prev.map(b => b.folderId === id ? { ...b, folderId: undefined } : b));
    // Delete the folder
    setFolders(prev => prev.filter(f => f.id !== id));
    if (selectedFolderId === id) {
      setSelectedFolderId(null);
    }
    toast({ title: "Folder Deleted" });
  };

  const addOrUpdateBookmark = (bookmark: Omit<Bookmark, 'id' | 'lastUpdated' | 'isFavorite' | 'history'>, id?: string) => {
    updateReadingStreak();
    setBookmarks(prev => {
      const now = new Date().toISOString();
      if (id) { // Editing
        const existingBookmark = prev.find(b => b.id === id);
        if (!existingBookmark) return prev;

        // Create a history entry from the current state before updating
        const { history, ...currentState } = existingBookmark;
        const newHistoryEntry: BookmarkHistory = { state: currentState, date: now };
        const updatedHistory = [newHistoryEntry, ...(history || [])].slice(0, MAX_HISTORY);

        return prev.map(b => b.id === id ? { ...b, ...bookmark, history: updatedHistory, lastUpdated: now } : b);
      } else { // Adding new
        const newBookmark: Bookmark = {
          ...bookmark,
          id: Date.now().toString(),
          lastUpdated: now,
          isFavorite: false,
        };
        // Check for duplicates based on URL
        const existing = prev.find(b => b.url === newBookmark.url);
        if (existing) {
          // If a bookmark with the same title but different chapter exists, replace it
          const titleRoot = newBookmark.title.replace(/ chapter .*/i, '');
          const existingTitleRoot = existing.title.replace(/ chapter .*/i, '');
          if (titleRoot === existingTitleRoot) {
            return prev.map(b => b.id === existing.id ? { ...newBookmark, id: existing.id } : b);
          }
        }
        return [newBookmark, ...prev];
      }
    });
  };

  const revertBookmark = (bookmarkId: string, historyEntry: BookmarkHistory) => {
    setBookmarks(prev => {
        return prev.map(b => {
            if (b.id === bookmarkId) {
                // The state from history becomes the new bookmark state
                // We keep the existing history but remove the one we are reverting to
                const newHistory = b.history?.filter(h => h.date !== historyEntry.date) || [];
                return { ...historyEntry.state, history: newHistory };
            }
            return b;
        });
    });
    toast({
        title: "Bookmark Reverted",
        description: `"${historyEntry.state.title}" has been restored to a previous version.`,
    });
  };

  const deleteBookmarks = (ids: string[]) => {
    const bookmarksToDelete = bookmarks.filter(b => ids.includes(b.id));
    const remainingBookmarks = bookmarks.filter(b => !ids.includes(b.id));
    
    setBookmarks(remainingBookmarks);

    toast({
      title: `${bookmarksToDelete.length} bookmark(s) deleted`,
      description: "You can undo this action.",
      action: (
        <ToastAction altText="Undo" onClick={() => {
            setBookmarks(currentBookmarks => [...bookmarksToDelete, ...currentBookmarks].sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()));
        }}>Undo</ToastAction>
      ),
    });
  };

  const toggleFavorite = (id: string) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
  };
  
  const updateChapter = (id: string, newChapter: number) => {
    // This is a quick update, let's also add a history entry for it
    const bookmarkToUpdate = bookmarks.find(b => b.id === id);
    if (bookmarkToUpdate) {
        addOrUpdateBookmark({ ...bookmarkToUpdate, chapter: newChapter >= 0 ? newChapter : 0 }, id);
    }
  };

  const updateBookmarkStatus = (ids: string[], statusId: string) => {
    updateReadingStreak();
    const now = new Date().toISOString();
    setBookmarks(prev => prev.map(b => {
        if (ids.includes(b.id)) {
            const { history, ...currentState } = b;
            const newHistoryEntry: BookmarkHistory = { state: currentState, date: now };
            const updatedHistory = [newHistoryEntry, ...(history || [])].slice(0, MAX_HISTORY);
            return { ...b, statusId, lastUpdated: now, history: updatedHistory };
        }
        return b;
    }));
  }

  const moveBookmarksToFolder = (ids: string[], folderId: string | null) => {
    const now = new Date().toISOString();
    setBookmarks(prev => prev.map(b => {
        if (ids.includes(b.id)) {
            return { ...b, folderId: folderId ?? undefined, lastUpdated: now };
        }
        return b;
    }));
  };

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setDialogOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingBookmark(null);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingBookmark(null);
    }
    setDialogOpen(open);
  }

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach(b => b.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [bookmarks]);

  const renameTag = (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    setBookmarks(prev => 
      prev.map(bookmark => {
        if (bookmark.tags?.includes(oldName)) {
          // Filter out the old tag, add the new one, and remove duplicates
          const newTags = Array.from(new Set([...(bookmark.tags.filter(t => t !== oldName)), newName]));
          return { ...bookmark, tags: newTags };
        }
        return bookmark;
      })
    );
  };

  const deleteTag = (tagName: string) => {
    setBookmarks(prev => 
      prev.map(bookmark => {
        if (bookmark.tags?.includes(tagName)) {
          return { ...bookmark, tags: bookmark.tags.filter(t => t !== tagName) };
        }
        return bookmark;
      })
    );
  };

  const resetStreak = () => {
    setReadingStreak(0);
    setLastStreakUpdate("");
    toast({ title: "Reading Streak Reset" });
  };

  const FolderList = () => {
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [folderName, setFolderName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleStartAdd = () => {
      setIsAdding(true);
      setFolderName('');
    };

    const handleStartEdit = (folder: Folder) => {
      setEditingFolderId(folder.id);
      setFolderName(folder.name);
    };

    const handleCancel = () => {
      setEditingFolderId(null);
      setIsAdding(false);
      setFolderName('');
    };

    const handleSave = () => {
      if (!folderName.trim()) return;
      if (editingFolderId) {
        renameFolder(editingFolderId, folderName);
      } else if (isAdding) {
        addFolder(folderName);
      }
      handleCancel();
    };

    return (
      <SidebarGroup>
        <SidebarGroupLabel>Folders</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {folders.map(folder =>
              editingFolderId === folder.id ? (
                <div key={folder.id} className="flex items-center gap-1 p-1">
                  <Input value={folderName} onChange={e => setFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} className="h-7" autoFocus />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}><Check className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    onClick={() => {
                        setSelectedFolderId(folder.id);
                        setActiveView('list');
                    }}
                    isActive={activeView === 'list' && selectedFolderId === folder.id}
                    tooltip={folder.name}
                    size="sm"
                  >
                    <FolderIcon />
                    <span>{folder.name}</span>
                  </SidebarMenuButton>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-6 w-6 opacity-50 hover:opacity-100">
                           <MoreVertical className="w-4 h-4"/>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleStartEdit(folder)}>
                           <Edit2 className="mr-2 h-4 w-4"/> Rename
                        </DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete the folder "{folder.name}"? Bookmarks within it will not be deleted.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteFolder(folder.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                   </DropdownMenu>
                </SidebarMenuItem>
              )
            )}
            {isAdding && (
              <div className="flex items-center gap-1 p-1">
                <Input placeholder="New folder name" value={folderName} onChange={e => setFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} className="h-7" autoFocus />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}><Check className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}><X className="w-4 h-4" /></Button>
              </div>
            )}
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleStartAdd} size="sm" className="text-muted-foreground hover:text-foreground">
                    <FolderPlus />
                    <span>Add Folder</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  const bookmarksInView = useMemo(() => {
    if (activeView !== 'list') return bookmarks;
    if (selectedFolderId) {
      return bookmarks.filter(b => b.folderId === selectedFolderId);
    }
    return bookmarks;
  }, [bookmarks, activeView, selectedFolderId]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLockEnabled && isLocked) {
    return <LockScreen isPinSet={isPinSet} onPinSubmit={unlockApp} onPinSet={setPin} onReset={resetApp} />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center gap-2">
             <BookMarked className="w-8 h-8 text-primary" />
             <h1 className="text-2xl font-bold tracking-tighter text-foreground group-data-[collapsible=icon]:hidden">
                MangaMarks
             </h1>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('dashboard')} isActive={activeView === 'dashboard'} tooltip="Dashboard">
                <LayoutDashboard />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => {
                    setSelectedFolderId(null);
                    setActiveView('list');
                }} 
                isActive={activeView === 'list' && !selectedFolderId} 
                tooltip="All Bookmarks">
                <List />
                <span className="group-data-[collapsible=icon]:hidden">All Bookmarks</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveView('settings')} isActive={activeView === 'settings'} tooltip="Settings">
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarSeparator />
          <FolderList />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
           <SidebarTrigger />
           <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={handleAddNew}>Add New Bookmark</Button>
           </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Reminders reminders={dueReminders} onDismiss={dismissReminder} />
            <>
                {activeView === 'dashboard' && <Dashboard bookmarks={bookmarks} readingStatuses={readingStatuses} readingStreak={readingStreak} />}
                {activeView === 'list' && (
                <BookmarkList 
                    bookmarks={bookmarksInView}
                    readingStatuses={readingStatuses}
                    sortPresets={sortPresets}
                    setSortPresets={setSortPresets}
                    onDelete={deleteBookmarks}
                    onToggleFavorite={toggleFavorite}
                    onUpdateChapter={updateChapter}
                    onUpdateStatus={updateBookmarkStatus}
                    allTags={allTags}
                    onEditSubmit={addOrUpdateBookmark}
                    onRevert={revertBookmark}
                    folders={folders}
                    onMoveToFolder={moveBookmarksToFolder}
                    activeFolder={selectedFolderId ? folders.find(f => f.id === selectedFolderId) : undefined}
                    onClearFolderFilter={() => setSelectedFolderId(null)}
                />
                )}
                {activeView === 'settings' && (
                  <SettingsView 
                    bookmarks={bookmarks} 
                    setBookmarks={setBookmarks} 
                    readingStatuses={readingStatuses} 
                    setReadingStatuses={setReadingStatuses}
                    sortPresets={sortPresets}
                    setSortPresets={setSortPresets}
                    allTags={allTags}
                    onRenameTag={renameTag}
                    onDeleteTag={deleteTag}
                    auth={{ isLockEnabled, setIsLockEnabled, changePin, isPinSet, checkPin, resetApp }}
                    folders={folders}
                    setFolders={setFolders}
                    onResetStreak={resetStreak}
                  />
                )}
            </>
        </main>
      </SidebarInset>
      <BookmarkDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={addOrUpdateBookmark}
        onRevert={revertBookmark}
        bookmark={editingBookmark}
        readingStatuses={readingStatuses}
        folders={folders}
      />
    </SidebarProvider>
  );
}
