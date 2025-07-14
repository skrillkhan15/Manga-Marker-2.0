
"use client";
import React, { useState, useMemo } from 'react';
import type { Bookmark, SortOrder, ViewLayout, ReadingStatus } from "@/types";
import BookmarkCard from "./BookmarkCard";
import BookmarkListItem from './BookmarkListItem';
import { BookOpenCheck, SearchX, Trash2, CheckCircle2, ChevronDown, Filter, LayoutGrid, List, Star, Tags, Book, ChevronsUpDown } from "lucide-react";
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (ids: string[]) => void;
  onEdit: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateChapter: (id: string, newChapter: number) => void;
  onUpdateStatus: (ids: string[], status: ReadingStatus) => void;
  allTags: string[];
}

const readingStatuses: ReadingStatus[] = ['reading', 'completed', 'on-hold', 'dropped', 'plan-to-read'];
const statusLabels: Record<ReadingStatus, string> = {
  'reading': 'Reading',
  'completed': 'Completed',
  'on-hold': 'On Hold',
  'dropped': 'Dropped',
  'plan-to-read': 'Plan to Read',
};

export default function BookmarkList({ bookmarks, onDelete, onEdit, onToggleFavorite, onUpdateChapter, onUpdateStatus, allTags }: BookmarkListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastUpdatedDesc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all');
  const [layout, setLayout] = useState<ViewLayout>('grid');

  const handleSelectionChange = (id: string, isSelected: boolean) => {
    setSelectedBookmarks(prev => 
      isSelected ? [...prev, id] : prev.filter(bid => bid !== id)
    );
  };
  
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = bookmarks;

    if (showFavorites) {
        filtered = filtered.filter(b => b.isFavorite);
    }
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(bookmark =>
            bookmark.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (selectedTags.length > 0) {
        filtered = filtered.filter(bookmark =>
            selectedTags.every(tag => bookmark.tags?.includes(tag))
        );
    }
    
    return filtered.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      switch (sortOrder) {
        case "titleAsc":
          return a.title.localeCompare(b.title);
        case "titleDesc":
          return b.title.localeCompare(a.title);
        case "chapterDesc":
          return (b.chapter || 0) - (a.chapter || 0);
        case "chapterAsc":
            return (a.chapter || 0) - (b.chapter || 0);
        case "lastUpdatedAsc":
          return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        case "lastUpdatedDesc":
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });
  }, [bookmarks, searchTerm, sortOrder, selectedTags, showFavorites, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedBookmarks.length === filteredAndSortedBookmarks.length) {
      setSelectedBookmarks([]);
    } else {
      setSelectedBookmarks(filteredAndSortedBookmarks.map(b => b.id));
    }
  };
  
  const handleTagSelection = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const handleUpdateStatus = (status: ReadingStatus) => {
    onUpdateStatus(selectedBookmarks, status);
    setSelectedBookmarks([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setShowFavorites(false);
    setStatusFilter('all');
  }

  const isAnyFilterActive = showFavorites || statusFilter !== 'all' || selectedTags.length > 0;

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <Input
                type="search"
                placeholder="Search by title..."
                className="w-full sm:w-auto sm:min-w-64 bg-background/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center gap-2 flex-wrap">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setShowFavorites(!showFavorites)}>
                           <Checkbox checked={showFavorites} className="mr-2" />
                           Show Favorites Only
                        </DropdownMenuItem>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between px-2">
                                    <div className="flex items-center">
                                     <Tags className="mr-2 h-4 w-4" />
                                     Tags
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0">
                                <ScrollArea className="h-48">
                                <div className="p-4 space-y-2">
                                    {allTags.map(tag => (
                                    <div key={tag} className="flex items-center space-x-2">
                                        <Checkbox 
                                        id={`tag-${tag}`} 
                                        checked={selectedTags.includes(tag)}
                                        onCheckedChange={() => handleTagSelection(tag)}
                                        />
                                        <label htmlFor={`tag-${tag}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {tag}
                                        </label>
                                    </div>
                                    ))}
                                </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="w-full justify-between px-2">
                                    <div className="flex items-center">
                                      <Book className="mr-2 h-4 w-4" />
                                      Status
                                    </div>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-0">
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReadingStatus | 'all')}>
                                    <SelectTrigger className="w-full border-0 focus:ring-0">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        {readingStatuses.map(status => (
                                            <SelectItem key={status} value={status}>
                                                {statusLabels[status]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </PopoverContent>
                        </Popover>
                    </DropdownMenuContent>
                </DropdownMenu>


                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                    <SelectTrigger className="w-full sm:w-[220px] bg-background/50">
                        <ChevronsUpDown className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="lastUpdatedDesc">Last Updated (Newest)</SelectItem>
                        <SelectItem value="lastUpdatedAsc">Last Updated (Oldest)</SelectItem>
                        <SelectItem value="titleAsc">Title (A-Z)</SelectItem>
                        <SelectItem value="titleDesc">Title (Z-A)</SelectItem>
                        <SelectItem value="chapterDesc">Chapter (High-Low)</SelectItem>
                        <SelectItem value="chapterAsc">Chapter (Low-High)</SelectItem>
                    </SelectContent>
                </Select>
                 <ToggleGroup type="single" value={layout} onValueChange={(value) => value && setLayout(value as ViewLayout)} aria-label="View layout">
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                        <LayoutGrid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List view">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>
        </div>

      {isAnyFilterActive && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg border">
          <span className="text-sm font-medium mr-2">Active filters:</span>
          {showFavorites && (
              <Badge variant="secondary" className="pl-2 pr-1">
                <Star className="w-3 h-3 mr-1" /> Favorites
                <button onClick={() => setShowFavorites(false)} className="ml-1 rounded-full hover:bg-background/50 p-0.5">
                    <X className="w-3 h-3"/>
                </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
              <Badge variant="secondary" className="pl-2 pr-1">
                {statusLabels[statusFilter]}
                <button onClick={() => setStatusFilter('all')} className="ml-1 rounded-full hover:bg-background/50 p-0.5">
                    <X className="w-3 h-3"/>
                </button>
            </Badge>
          )}
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="pl-2 pr-1">
              {tag}
              <button onClick={() => handleTagSelection(tag)} className="ml-1 rounded-full hover:bg-background/50 p-0.5">
                <X className="w-3 h-3"/>
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto px-2 py-1 text-xs ml-auto">Clear all</Button>
        </div>
      )}

       {bookmarks.length > 0 && (
         <div className="flex items-center gap-4 py-2 px-3 bg-muted/30 rounded-lg border">
           <Button variant="outline" size="sm" onClick={toggleSelectAll}>
             {selectedBookmarks.length === filteredAndSortedBookmarks.length ? 'Deselect All' : `Select All (${filteredAndSortedBookmarks.length})`}
           </Button>
           <span className="text-sm text-muted-foreground">{selectedBookmarks.length} selected</span>
           {selectedBookmarks.length > 0 && (
             <div className="flex items-center gap-2">
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete {selectedBookmarks.length} bookmark(s). This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => { onDelete(selectedBookmarks); setSelectedBookmarks([]); }}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Update Status
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {readingStatuses.map(status => (
                            <DropdownMenuItem key={status} onSelect={() => handleUpdateStatus(status)}>
                                {statusLabels[status]}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
           )}
         </div>
       )}

      {filteredAndSortedBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg h-64 bg-muted/20">
          {bookmarks.length > 0 ? (
             <>
                <SearchX className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Results Found</h2>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
             </>
          ) : (
            <>
                <BookOpenCheck className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No Bookmarks Yet</h2>
                <p className="text-muted-foreground">Add a manga or manhwa to get started!</p>
            </>
          )}
        </div>
      ) : layout === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkCard 
              key={bookmark.id} 
              bookmark={bookmark} 
              onEdit={onEdit} 
              onToggleFavorite={onToggleFavorite}
              onUpdateChapter={onUpdateChapter}
              isSelected={selectedBookmarks.includes(bookmark.id)}
              onSelectionChange={handleSelectionChange}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
           {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkListItem 
              key={bookmark.id} 
              bookmark={bookmark} 
              onEdit={onEdit} 
              onToggleFavorite={onToggleFavorite}
              onUpdateChapter={onUpdateChapter}
              isSelected={selectedBookmarks.includes(bookmark.id)}
              onSelectionChange={handleSelectionChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
