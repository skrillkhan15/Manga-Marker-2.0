
export interface Folder {
  id: string;
  name: string;
}

export interface ReadingStatus {
  id: string;
  label: string;
  color: string; // hex color
  icon?: string; // For emoji or single character icon
}

export interface BookmarkHistory {
  state: Omit<Bookmark, 'history'>;
  date: string;
}

export interface Bookmark {
  id:string;
  title: string;
  alias?: string;
  url: string;
  lastUpdated: string;
  tags?: string[];
  isFavorite: boolean;
  isPinned?: boolean;
  coverImage?: string; // Base64 encoded image data URL
  chapter?: number;
  totalChapters?: number;
  statusId: string; // Corresponds to ReadingStatus.id
  notes?: string;
  history?: BookmarkHistory[];
  folderId?: string;
  reminderDate?: string; // ISO string for the reminder
  rating?: number; // 0-5 stars
  color?: string; // User-assigned color label
  manualOrder?: number;
}

export type ActivityLogType = 'CREATE' | 'UPDATE' | 'DELETE' | 'FAVORITE' | 'STATUS' | 'MOVE';

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: ActivityLogType;
  description: string;
  bookmarkId?: string;
  bookmarkTitle?: string;
}

export type SortOrder = 'manual' | 'lastUpdatedDesc' | 'lastUpdatedAsc' | 'titleAsc' | 'titleDesc' | 'chapterDesc' | 'chapterAsc' | 'ratingDesc' | 'ratingAsc';

export type View = 'dashboard' | 'list' | 'settings' | 'activity';

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

export interface CurrentFilterState extends Omit<SortPreset, 'id' | 'name'> {
  settings: SortPreset['settings'] & {
      ratingFilter: number;
  }
}

export interface BackupData {
  bookmarks: Bookmark[];
  readingStatuses: ReadingStatus[];
  sortPresets?: SortPreset[];
  folders?: Folder[];
  activityLog?: ActivityLog[];
}

export type ThemeName = 'system' | 'light' | 'dark' | 'mint' | 'sunset' | 'ocean';

export interface AuthProps {
    isLockEnabled: boolean;
    setIsLockEnabled: (enabled: boolean) => void;
    isPinSet: boolean;
    changePin: (newPin: string) => void;
    checkPin: (pin: string) => Promise<boolean>;
    resetApp: () => void;
}

export interface WeeklySummary {
  chaptersRead: number;
  seriesUpdated: string[]; // Store bookmark IDs to count unique series
  startDate: string; // ISO string for when the week started
}

export interface DailySummary {
  chaptersRead: number;
  date: string; // ISO string for the current day
}
