
"use client";

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Star, Tag, Minus, Plus, BookOpen, StickyNote, X, List, Palette } from 'lucide-react';
import { Button } from "@/components/ui/button";
import type { Bookmark, ReadingStatus } from "@/types";
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Progress } from './ui/progress';
import { useMemo, useRef } from 'react';

interface BookmarkListItemProps {
  bookmark: Bookmark;
  status?: ReadingStatus;
  onEdit: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateChapter: (id: string, newChapter: number) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, isSelected: boolean) => void;
  isCompact: boolean;
}

export default function BookmarkListItem({ bookmark, status, onEdit, onToggleFavorite, onUpdateChapter, isSelected, onSelectionChange, isCompact }: BookmarkListItemProps) {
  const lastUpdatedText = formatDistanceToNow(new Date(bookmark.lastUpdated), { addSuffix: true });
  const progress = useMemo(() => {
    if (bookmark.totalChapters && bookmark.totalChapters > 0) {
      return Math.round(((bookmark.chapter || 0) / bookmark.totalChapters) * 100);
    }
    return null;
  }, [bookmark.chapter, bookmark.totalChapters]);
  
  const itemRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  
  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
        onSelectionChange(bookmark.id, true);
    }, 500); // 500ms for long press
  };

  const handlePointerUp = () => {
      clearTimeout(longPressTimer.current);
  };

  const handlePointerLeave = () => {
      clearTimeout(longPressTimer.current);
  };

  return (
    <div 
        ref={itemRef}
        className={`flex items-center gap-4 p-2 rounded-lg border transition-colors animate-fade-in ${isSelected ? 'bg-muted/80 border-primary' : 'bg-muted/30 hover:bg-muted/60'}`}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerLeave}
    >
        <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(bookmark.id, !!checked)}
            aria-label={`Select bookmark ${bookmark.title}`}
            className="ml-2"
        />
        {!isCompact && (
            <div className="relative w-10 h-14 rounded-md overflow-hidden shrink-0">
                <Image 
                    src={bookmark.coverImage || `https://placehold.co/80x112.png`} 
                    alt={`Cover for ${bookmark.title}`}
                    data-ai-hint="manga cover"
                    layout="fill"
                    objectFit="cover"
                    className="bg-muted"
                />
            </div>
        )}
        <div className="flex-1 grid grid-cols-4 gap-4 items-center">
            <div className="flex flex-col col-span-2">
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline truncate" title={bookmark.title}>
                    {bookmark.title}
                </a>
                {progress !== null ? (
                    <div className="flex items-center gap-2 mt-1">
                        <Progress value={progress} className="h-1.5 w-24" />
                        <span className="text-xs text-muted-foreground">{bookmark.chapter}/{bookmark.totalChapters}</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">Updated {lastUpdatedText}</span>
                )}
            </div>
            
            <div className="flex items-center gap-2 justify-center">
                <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => onUpdateChapter(bookmark.id, (bookmark.chapter || 0) - 1)} disabled={(bookmark.chapter || 0) <= 0}>
                    <Minus className="w-4 h-4" />
                </Button>
                <span className="text-sm font-semibold w-12 text-center">Ch. {bookmark.chapter || 0}</span>
                <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => onUpdateChapter(bookmark.id, (bookmark.chapter || 0) + 1)}>
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-4 justify-end">
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger className="flex items-center">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm ml-1">{bookmark.tags.length}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        {bookmark.tags.join(', ')}
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {status && (
                    <Tooltip>
                        <TooltipTrigger className="flex items-center">
                           <Palette className="w-4 h-4" style={{ color: status.color }} />
                        </TooltipTrigger>
                        <TooltipContent>
                           {status.label}
                        </TooltipContent>
                    </Tooltip>
                )}

                {bookmark.notes && (
                    <Tooltip>
                        <TooltipTrigger>
                            <StickyNote className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p className="whitespace-pre-wrap">{bookmark.notes}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
        <div className="flex items-center gap-1 pr-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => onToggleFavorite(bookmark.id)}>
                <Star className={`w-5 h-5 transition-colors ${bookmark.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => onEdit(bookmark)}>
                <Edit className="w-4 h-4" />
            </Button>
        </div>
    </div>
  );
}
