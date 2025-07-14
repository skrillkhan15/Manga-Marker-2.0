
"use client";
import React, { useState, useMemo } from 'react';
import type { Bookmark, SortOrder, ViewLayout, ReadingStatus } from "@/types";
import BookmarkCard from "./BookmarkCard";
import BookmarkListItem from './BookmarkListItem';
import { BookOpenCheck, SearchX, Trash2, CheckCircle2, ChevronDown, Filter, LayoutGrid, List, Star, Tags, Book, ChevronsUpDown, Rows } from "lucide-react";
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  readingStatuses: ReadingStatus[];
  onDelete: (ids: string[]) => void;
  onEdit: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateChapter: (id: string, newChapter: number) => void;
  onUpdateStatus: (ids: string[], statusId: string) => void;
  allTags: string[];
}

export default function BookmarkList({ bookmarks, readingStatuses, onDelete, onEdit, onToggleFavorite, onUpdateChapter, onUpdateStatus, allTags }: BookmarkListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastUpdatedDesc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [layout, setLayout] = useState<ViewLayout>('grid');
  const [isCompact, setIsCompact] = useState(false);

  const statusesById = useMemo(() => {
    return readingStatuses.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {} as Record<string, ReadingStatus>);
  }, [readingStatuses]);

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
        filtered = filtered.filter(b => b.statusId === statusFilter);
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
  
  const handleUpdateStatus = (statusId: string) => {
    onUpdateStatus(selectedBookmarks, statusId);
    setSelectedBookmarks([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setShowFavorites(false);
    setStatusFilter('all');
  }

  const handleDelete = () => {
    onDelete(selectedBookmarks);
    setSelectedBookmarks([]);
  }

  const isAnyFilterActive = showFavorites || statusFilter !== 'all' || selectedTags.length > 0;

  const currentStatusFilterLabel = statusFilter !== 'all' ? statusesById[statusFilter]?.label : '';

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
                                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                                    <SelectTrigger className="w-full border-0 focus:ring-0">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        {readingStatuses.map(status => (
                                            <SelectItem key={status.id} value={status.id}>
                                                {status.label}
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
              <Badge variant="secondary" className="pl-2 pr-1 cursor-pointer hover:bg-muted" onClick={() => setShowFavorites(false)}>
                <Star className="w-3 h-3 mr-1" /> Favorites
                <button className="ml-1 rounded-full hover:bg-background/50 p-0.5">
                    <X className="w-3 h-3"/>
                </button>
            </Badge>
          )}
          {statusFilter !== 'all' && currentStatusFilterLabel && (
              <Badge variant="secondary" className="pl-2 pr-1 cursor-pointer hover:bg-muted" onClick={() => setStatusFilter('all')}>
                {currentStatusFilterLabel}
                <button className="ml-1 rounded-full hover:bg-background/50 p-0.5">
                    <X className="w-3 h-3"/>
                </button>
            </Badge>
          )}
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="pl-2 pr-1 cursor-pointer hover:bg-muted" onClick={() => handleTagSelection(tag)}>
              {tag}
              <button className="ml-1 rounded-full hover:bg-background/50 p-0.5">
                <X className="w-3 h-3"/>
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto px-2 py-1 text-xs ml-auto">Clear all</Button>
        </div>
      )}

       {bookmarks.length > 0 && (
         <div className="flex items-center gap-4 py-2 px-3 bg-muted/30 rounded-lg border flex-wrap">
           <Button variant="outline" size="sm" onClick={toggleSelectAll}>
             {selectedBookmarks.length === filteredAndSortedBookmarks.length ? 'Deselect All' : `Select All (${filteredAndSortedBookmarks.length})`}
           </Button>
           <span className="text-sm text-muted-foreground">{selectedBookmarks.length} selected</span>
           {selectedBookmarks.length > 0 && (
             <div className="flex items-center gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Update Status
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {readingStatuses.map(status => (
                            <DropdownMenuItem key={status.id} onSelect={() => handleUpdateStatus(status.id)}>
                                {status.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
           )}
            <div className="flex items-center space-x-2 ml-auto">
                <Rows className="h-4 w-4"/>
                <Label htmlFor="compact-mode">Compact Mode</Label>
                <Switch id="compact-mode" checked={isCompact} onCheckedChange={setIsCompact} />
            </div>
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
              status={statusesById[bookmark.statusId]}
              onEdit={onEdit} 
              onToggleFavorite={onToggleFavorite}
              onUpdateChapter={onUpdateChapter}
              isSelected={selectedBookmarks.includes(bookmark.id)}
              onSelectionChange={handleSelectionChange}
              isCompact={isCompact}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
           {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkListItem 
              key={bookmark.id} 
              bookmark={bookmark} 
              status={statusesById[bookmark.statusId]}
              onEdit={onEdit} 
              onToggleFavorite={onToggleFavorite}
              onUpdateChapter={onUpdateChapter}
              isSelected={selectedBookmarks.includes(bookmark.id)}
              onSelectionChange={handleSelectionChange}
              isCompact={isCompact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
