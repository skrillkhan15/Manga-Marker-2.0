export interface Bookmark {
  id: string;
  title: string;
  url: string;
  lastUpdated: string;
  tags?: string[];
  isFavorite: boolean;
}

export type SortOrder = 'lastUpdatedDesc' | 'lastUpdatedAsc' | 'titleAsc' | 'titleDesc';

export type View = 'dashboard' | 'list' | 'settings';
