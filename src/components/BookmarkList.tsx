
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import type { Bookmark, SortOrder, ViewLayout, ReadingStatus, BookmarkHistory, SortPreset, Folder, CurrentFilterState } from "@/types";
import BookmarkCard from "./BookmarkCard";
import BookmarkListItem from './BookmarkListItem';
import { BookOpenCheck, SearchX, Trash2, CheckCircle2, ChevronDown, Filter, LayoutGrid, List, Star, Tags, Book, ChevronsUpDown, Rows, Save, Settings2, X, PlusCircle, Folder as FolderIcon, Move } from "lucide-react";
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookmarkSheet } from './BookmarkSheet';
import { BookmarkDialog } from './BookmarkDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './StarRating';
import { Reorder } from 'framer-motion';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  setBookmarks: React.Dispatch<React.SetStateAction<Bookmark[]>>;
  allBookmarks: Bookmark[];
  readingStatuses: ReadingStatus[];
  sortPresets: SortPreset[];
  setSortPresets: React.Dispatch<React.SetStateAction<SortPreset[]>>;
  folders: Folder[];
  onDelete: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
  onTogglePinned: (id: string) => void;
  onUpdateChapter: (id: string, newChapter: number) => void;
  onUpdateStatus: (ids: string[], statusId: string) => void;
  allTags: string[];
  onEditSubmit: (data: Omit<Bookmark, 'id' | 'lastUpdated' | 'isFavorite' | 'isPinned' | 'history'>, id?: string) => void;
  onRevert: (bookmarkId: string, historyEntry: BookmarkHistory) => void;
  onMoveToFolder: (ids: string[], folderId: string | null) => void;
  activeFolder?: Folder;
  onClearFolderFilter: () => void;
  onFilterStateChange: (state: CurrentFilterState) => void;
}

export default function BookmarkList({ 
    bookmarks, 
    setBookmarks,
    allBookmarks,
    readingStatuses, 
    sortPresets,
    setSortPresets,
    folders,
    onDelete, 
    toggleFavorite, 
    onTogglePinned,
    onUpdateChapter, 
    onUpdateStatus, 
    allTags, 
    onEditSubmit, 
    onRevert,
    onMoveToFolder,
    activeFolder,
    onClearFolderFilter,
    onFilterStateChange
}: BookmarkListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("lastUpdatedDesc");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [layout, setLayout] = useState<ViewLayout>('grid');
  const [isCompact, setIsCompact] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [localBookmarks, setLocalBookmarks] = useState(bookmarks);

  useEffect(() => {
    // When the active folder changes, clear selections and search term
    setSelectedBookmarks([]);
    setSearchTerm('');
  }, [activeFolder]);

  useEffect(() => {
    setLocalBookmarks(bookmarks);
  }, [bookmarks]);

  useEffect(() => {
    // Inform parent about filter state changes
    onFilterStateChange({
      settings: {
        searchTerm,
        sortOrder,
        selectedTags,
        showFavorites,
        statusFilter,
        layout,
        isCompact,
        ratingFilter
      }
    });
  }, [searchTerm, sortOrder, selectedTags, showFavorites, statusFilter, layout, isCompact, ratingFilter, onFilterStateChange]);

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    if (isMobile) {
      setIsSheetOpen(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleEditorClose = () => {
    setEditingBookmark(null);
    setIsSheetOpen(false);
    setIsDialogOpen(false);
  };

  const handleEditSave = (data: Omit<Bookmark, 'id' | 'lastUpdated' | 'isFavorite' | 'isPinned' | 'history'>, id?: string) => {
    onEditSubmit(data, id);
    handleEditorClose();
  };
  
  const handleRevert = (bookmarkId: string, historyEntry: BookmarkHistory) => {
    onRevert(bookmarkId, historyEntry);
    handleEditorClose();
  };

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
    let filtered = [...localBookmarks];

    if (showFavorites) {
        filtered = filtered.filter(b => b.isFavorite);
    }
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(b => b.statusId === statusFilter);
    }

    if (ratingFilter > 0) {
        filtered = filtered.filter(b => (b.rating || 0) === ratingFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(bookmark =>
            (bookmark.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (bookmark.alias?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    if (selectedTags.length > 0) {
        filtered = filtered.filter(bookmark =>
            selectedTags.every(tag => bookmark.tags?.includes(tag))
        );
    }
    
    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      if (sortOrder === 'manual') {
        return (a.manualOrder ?? 0) - (b.manualOrder ?? 0);
      }
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
        case "ratingDesc":
            return (b.rating || 0) - (a.rating || 0);
        case "ratingAsc":
            return (a.rating || 0) - (b.rating || 0);
        case "lastUpdatedAsc":
          return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
        case "lastUpdatedDesc":
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });
  }, [localBookmarks, searchTerm, sortOrder, selectedTags, showFavorites, statusFilter, ratingFilter]);

  const handleReorder = (reorderedItems: Bookmark[]) => {
    setLocalBookmarks(reorderedItems); // Update local state for smooth animation
    const updatedBookmarks = allBookmarks.map(bookmark => {
      const newIndex = reorderedItems.findIndex(b => b.id === bookmark.id);
      if (newIndex !== -1) {
        return { ...bookmark, manualOrder: newIndex };
      }
      return bookmark;
    });
    setBookmarks(updatedBookmarks);
    toast({ title: "Order saved" });
  };


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

  const handleMoveToFolder = (folderId: string | null) => {
    onMoveToFolder(selectedBookmarks, folderId);
    setSelectedBookmarks([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setShowFavorites(false);
    setStatusFilter('all');
    setRatingFilter(0);
  }

  const handleDelete = () => {
    onDelete(selectedBookmarks);
    setSelectedBookmarks([]);
  }

  const isAnyFilterActive = showFavorites || statusFilter !== 'all' || selectedTags.length > 0 || ratingFilter > 0;

  const currentStatusFilterLabel = statusFilter !== 'all' ? statusesById[statusFilter]?.label : '';

  const savePreset = () => {
    if (!presetName.trim()) {
      toast({ title: "Preset name cannot be empty", variant: "destructive" });
      return;
    }
    const newPreset: SortPreset = {
      id: Date.now().toString(),
      name: presetName,
      settings: { searchTerm, sortOrder, selectedTags, showFavorites, statusFilter, layout, isCompact, ratingFilter }
    };
    setSortPresets(prev => [...prev, newPreset]);
    toast({ title: `Preset "${presetName}" saved` });
    setPresetName('');
    setIsPresetDialogOpen(false);
  };

  const applyPreset = (preset: SortPreset) => {
    const { settings } = preset;
    setSearchTerm(settings.searchTerm);
    setSortOrder(settings.sortOrder);
    setSelectedTags(settings.selectedTags);
    setShowFavorites(settings.showFavorites);
    setStatusFilter(settings.statusFilter);
    setLayout(settings.layout);
    setIsCompact(settings.isCompact);
    setRatingFilter(settings.ratingFilter || 0)
    toast({ title: `Preset "${preset.name}" applied` });
  };

  const deletePreset = (id: string) => {
    setSortPresets(prev => prev.filter(p => p.id !== id));
    toast({ title: "Preset deleted" });
  };

  const ListContainer = (props: { children: React.ReactNode }) => {
    if (sortOrder === 'manual' && !activeFolder) {
      return (
        <Reorder.Group
          axis="y"
          values={filteredAndSortedBookmarks}
          onReorder={handleReorder}
          className={layout === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"}
        >
          {props.children}
        </Reorder.Group>
      );
    }
    if (layout === 'grid') {
      return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{props.children}</div>;
    }
    return <div className="space-y-2">{props.children}</div>;
  };

  const ListItemContainer = (props: {bookmark: Bookmark, children: React.ReactNode}) => {
    if (sortOrder === 'manual' && !activeFolder) {
      return (
        <Reorder.Item
          key={props.bookmark.id}
          value={props.bookmark}
          className="relative"
        >
          {props.children}
        </Reorder.Item>
      );
    }
    return <React.Fragment key={props.bookmark.id}>{props.children}</React.Fragment>;
  };


  return (
    <div className="space-y-6">
      {activeFolder && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <FolderIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">{activeFolder.name}</h2>
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onClearFolderFilter}>
                <X className="w-4 h-4" />
            </Button>
        </div>
      )}
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
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowFavorites(!showFavorites); }}>
                           <Checkbox checked={showFavorites} className="mr-2" />
                           Show Favorites Only
                        </DropdownMenuItem>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="w-full justify-start px-2">
                                    <Star className="mr-2 h-4 w-4" />
                                     Rating
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2">
                                <StarRating rating={ratingFilter} setRating={setRatingFilter} size={5} />
                            </PopoverContent>
                        </Popover>

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
                        <SelectItem value="manual">Manual Order</SelectItem>
                        <SelectItem value="lastUpdatedDesc">Last Updated (Newest)</SelectItem>
                        <SelectItem value="lastUpdatedAsc">Last Updated (Oldest)</SelectItem>
                        <SelectItem value="titleAsc">Title (A-Z)</SelectItem>
                        <SelectItem value="titleDesc">Title (Z-A)</SelectItem>
                        <SelectItem value="chapterDesc">Chapter (High-Low)</SelectItem>
                        <SelectItem value="chapterAsc">Chapter (Low-High)</SelectItem>
                        <SelectItem value="ratingDesc">Rating (High-Low)</SelectItem>
                        <SelectItem value="ratingAsc">Rating (Low-High)</SelectItem>
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
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-2 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Settings2 className="mr-2 h-4 w-4" />
                Presets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Saved Presets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortPresets.map(preset => (
                <DropdownMenuItem key={preset.id} onSelect={() => applyPreset(preset)} className="flex justify-between items-center">
                  <span>{preset.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the preset "{preset.name}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deletePreset(preset.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
              ))}
              {sortPresets.length === 0 && <DropdownMenuItem disabled>No presets saved</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setIsPresetDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Save Current as Preset...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center space-x-2 ml-auto">
            <Rows className="h-4 w-4"/>
            <Label htmlFor="compact-mode">Compact Mode</Label>
            <Switch id="compact-mode" checked={isCompact} onCheckedChange={setIsCompact} />
        </div>
      </div>
      
      <AlertDialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Save View Preset</AlertDialogTitle>
                <AlertDialogDescription>
                    Enter a name for the current filter, sort, and view settings.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <Input 
                placeholder="e.g., Favorite Manhwa"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && savePreset()}
            />
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={savePreset}>Save</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {ratingFilter > 0 && (
              <Badge variant="secondary" className="pl-2 pr-1 cursor-pointer hover:bg-muted" onClick={() => setRatingFilter(0)}>
                <StarRating rating={ratingFilter} size={3} />
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
           <div className="flex items-center gap-2">
                <Checkbox
                    id="select-all-checkbox"
                    checked={selectedBookmarks.length > 0 && selectedBookmarks.length === filteredAndSortedBookmarks.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all bookmarks"
                />
                <Label htmlFor="select-all-checkbox" className="text-sm font-medium">
                    {selectedBookmarks.length > 0 ? `${selectedBookmarks.length} selected` : 'Select All'}
                </Label>
           </div>
           
           {selectedBookmarks.length > 0 && (
             <div className="flex items-center gap-2 animate-fade-in">
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </Button>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm">
                            <Move className="mr-2 h-4 w-4" />
                            Move to Folder
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleMoveToFolder(null)}>
                            <X className="mr-2 h-4 w-4" />
                            Remove from Folder
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {folders.map(folder => (
                            <DropdownMenuItem key={folder.id} onSelect={() => handleMoveToFolder(folder.id)}>
                                <FolderIcon className="mr-2 h-4 w-4" />
                                {folder.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

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
                <FolderIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">{ activeFolder ? `Folder "${activeFolder.name}" is empty` : 'No Bookmarks Yet' }</h2>
                <p className="text-muted-foreground">{ activeFolder ? 'Add some bookmarks to this folder.' : 'Add a new manga or manhwa to get started!' }</p>
            </>
          )}
        </div>
      ) : (
        <ListContainer>
          {filteredAndSortedBookmarks.map((bookmark) => (
             <ListItemContainer key={bookmark.id} bookmark={bookmark}>
              {layout === 'grid' ? (
                <BookmarkCard 
                  bookmark={bookmark}
                  status={statusesById[bookmark.statusId]}
                  onEdit={handleEdit} 
                  onToggleFavorite={toggleFavorite}
                  onTogglePinned={onTogglePinned}
                  onUpdateChapter={onUpdateChapter}
                  onDelete={onDelete}
                  isSelected={selectedBookmarks.includes(bookmark.id)}
                  onSelectionChange={handleSelectionChange}
                  isCompact={isCompact}
                  isManualSortActive={sortOrder === 'manual' && !activeFolder}
                />
              ) : (
                <BookmarkListItem 
                  bookmark={bookmark} 
                  status={statusesById[bookmark.statusId]}
                  onEdit={handleEdit} 
                  onToggleFavorite={toggleFavorite}
                  onTogglePinned={onTogglePinned}
                  onUpdateChapter={onUpdateChapter}
                  onDelete={onDelete}
                  isSelected={selectedBookmarks.includes(bookmark.id)}
                  onSelectionChange={handleSelectionChange}
                  isCompact={isCompact}
                  isManualSortActive={sortOrder === 'manual' && !activeFolder}
                />
              )}
            </ListItemContainer>
          ))}
        </ListContainer>
      )}
      {isMobile ? (
         <BookmarkSheet 
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            onSubmit={handleEditSave}
            onRevert={handleRevert}
            bookmark={editingBookmark}
            readingStatuses={readingStatuses}
            folders={folders}
          />
      ) : (
        <BookmarkDialog
            open={isDialogOpen}
            onOpenChange={handleEditorClose}
            onSubmit={handleEditSave}
            onRevert={handleRevert}
            bookmark={editingBookmark}
            readingStatuses={readingStatuses}
            folders={folders}
        />
      )}

    </div>
  );
}
