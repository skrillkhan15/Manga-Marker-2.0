
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

export interface BackupData {
  bookmarks: Bookmark[];
  readingStatuses: ReadingStatus[];
}

export type ThemeName = 'system' | 'light' | 'dark' | 'mint' | 'sunset' | 'ocean';
