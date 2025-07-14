

export interface ReadingStatus {
  id: string;
  label: string;
  color: string; // hex color
}

export interface BookmarkHistory {
  state: Omit<Bookmark, 'history'>;
  date: string;
}

export interface Bookmark {
  id:string;
  title: string;
  url: string;
  lastUpdated: string;
  tags?: string[];
  isFavorite: boolean;
  coverImage?: string; // Base64 encoded image data URL
  chapter?: number;
  totalChapters?: number;
  statusId: string; // Corresponds to ReadingStatus.id
  notes?: string;
  history?: BookmarkHistory[];
}

export type SortOrder = 'lastUpdatedDesc' | 'lastUpdatedAsc' | 'titleAsc' | 'titleDesc' | 'chapterDesc' | 'chapterAsc';

export type View = 'dashboard' | 'list' | 'settings';

export type ViewLayout = 'grid' | 'list';

export interface SortPreset {
  id: string;
  name: string;
  settings: {
    searchTerm: string;
    sortOrder: SortOrder;
    selectedTags: string[];
    showFavorites: boolean;
    statusFilter: string;
    layout: ViewLayout;
    isCompact: boolean;
  };
}

export interface BackupData {
  bookmarks: Bookmark[];
  readingStatuses: ReadingStatus[];
  sortPresets?: SortPreset[];
}

export type ThemeName = 'system' | 'light' | 'dark' | 'mint' | 'sunset' | 'ocean';
