
"use client";

import { useState, useMemo, useEffect } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Bookmark, View } from "@/types";
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent, SidebarTrigger, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { BookMarked, LayoutDashboard, List, Loader2, Settings } from 'lucide-react';
import BookmarkList from '@/components/BookmarkList';
import Dashboard from '@/components/Dashboard';
import SettingsView from '@/components/SettingsView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BookmarkDialog } from '@/components/BookmarkDialog';


export default function Home() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>("manga-bookmarks", []);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const addOrUpdateBookmark = (bookmark: Omit<Bookmark, 'id' | 'lastUpdated' | 'isFavorite'>, id?: string) => {
    setBookmarks(prev => {
      const now = new Date().toISOString();
      if (id) { // Editing
        return prev.map(b => b.id === id ? { ...b, ...bookmark, lastUpdated: now } : b);
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

  const deleteBookmarks = (ids: string[]) => {
    setBookmarks(prev => prev.filter(b => !ids.includes(b.id)));
  };

  const toggleFavorite = (id: string) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b));
  };
  
  const updateChapter = (id: string, newChapter: number) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, chapter: newChapter >= 0 ? newChapter : 0, lastUpdated: new Date().toISOString() } : b));
  };

  const updateBookmarkStatus = (ids: string[], status: Bookmark['status']) => {
    const now = new Date().toISOString();
    setBookmarks(prev => prev.map(b => ids.includes(b.id) ? { ...b, status, lastUpdated: now } : b));
  }

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
              <SidebarMenuButton onClick={() => setActiveView('list')} isActive={activeView === 'list'} tooltip="All Bookmarks">
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
            {!isMounted ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {activeView === 'dashboard' && <Dashboard bookmarks={bookmarks} />}
                    {activeView === 'list' && (
                    <BookmarkList 
                        bookmarks={bookmarks}
                        onDelete={deleteBookmarks}
                        onEdit={handleEdit}
                        onToggleFavorite={toggleFavorite}
                        onUpdateChapter={updateChapter}
                        onUpdateStatus={updateBookmarkStatus}
                        allTags={allTags}
                    />
                    )}
                    {activeView === 'settings' && <SettingsView bookmarks={bookmarks} setBookmarks={setBookmarks} />}
                </>
            )}
        </main>
      </SidebarInset>
      <BookmarkDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={addOrUpdateBookmark}
        bookmark={editingBookmark}
      />
    </SidebarProvider>
  );
}
