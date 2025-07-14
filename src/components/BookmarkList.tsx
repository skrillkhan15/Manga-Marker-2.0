"use client";
import React, { useState, useMemo } from 'react';
import type { Bookmark, SortOrder } from "@/types";
import BookmarkCard from "./BookmarkCard";
import { BookOpenCheck, SearchX, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onDelete: (ids: string[]) => void;
  onEdit: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  allTags: string[];
}

export default function BookmarkList({ bookmarks, onDelete, onEdit, onToggleFavorite, allTags }: BookmarkListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastUpdatedDesc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);

  const handleSelectionChange = (id: string, isSelected: boolean) => {
    setSelectedBookmarks(prev => 
      isSelected ? [...prev, id] : prev.filter(bid => bid !== id)
    );
  };
  
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = bookmarks;

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
        case "lastUpdatedAsc":
          return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        case "lastUpdatedDesc":
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });
  }, [bookmarks, searchTerm, sortOrder, selectedTags]);

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


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="search"
          placeholder="Search by title..."
          className="w-full md:max-w-xs bg-background/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              Filter by Tags ({selectedTags.length})
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
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
          <SelectTrigger className="w-full md:w-[220px] bg-background/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastUpdatedDesc">Last Updated (Newest)</SelectItem>
            <SelectItem value="lastUpdatedAsc">Last Updated (Oldest)</SelectItem>
            <SelectItem value="titleAsc">Title (A-Z)</SelectItem>
            <SelectItem value="titleDesc">Title (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium mr-2">Active filters:</span>
          {selectedTags.map(tag => (
            <Badge key={tag} variant="secondary" className="pl-2 pr-1">
              {tag}
              <button onClick={() => handleTagSelection(tag)} className="ml-1 rounded-full hover:bg-background/50 p-0.5">
                <X className="w-3 h-3"/>
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} className="h-auto px-2 py-1 text-xs">Clear all</Button>
        </div>
      )}


       {bookmarks.length > 0 && (
         <div className="flex items-center gap-4 py-2 px-3 bg-muted/30 rounded-lg border">
           <Button variant="outline" size="sm" onClick={toggleSelectAll}>
             {selectedBookmarks.length === filteredAndSortedBookmarks.length ? 'Deselect All' : `Select All (${filteredAndSortedBookmarks.length})`}
           </Button>
           <span className="text-sm text-muted-foreground">{selectedBookmarks.length} selected</span>
           {selectedBookmarks.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
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
      ) : (
        <div className="space-y-4">
          {filteredAndSortedBookmarks.map((bookmark) => (
            <BookmarkCard 
              key={bookmark.id} 
              bookmark={bookmark} 
              onDelete={onDelete} 
              onEdit={onEdit} 
              onToggleFavorite={onToggleFavorite}
              isSelected={selectedBookmarks.includes(bookmark.id)}
              onSelectionChange={handleSelectionChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}