"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { Edit, Star, Tag, Minus, Plus } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Bookmark } from "@/types";
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (ids: string[]) => void;
  onEdit: (bookmark: Bookmark) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateChapter: (id: string, newChapter: number) => void;
  isSelected: boolean;
  onSelectionChange: (id: string, isSelected: boolean) => void;
}

export default function BookmarkCard({ bookmark, onEdit, onToggleFavorite, onUpdateChapter, isSelected, onSelectionChange }: BookmarkCardProps) {
    const [lastUpdatedText, setLastUpdatedText] = useState('');

    useEffect(() => {
        const updateText = () => {
          try {
            setLastUpdatedText(formatDistanceToNow(new Date(bookmark.lastUpdated), { addSuffix: true }));
          } catch (e) {
            // handle invalid date
             setLastUpdatedText('a few seconds ago');
          }
        };
        updateText();
        const timer = setInterval(updateText, 1000 * 60);
        return () => clearInterval(timer);
    }, [bookmark.lastUpdated]);
  
    const initialDate = useMemo(() => {
       try {
        return format(new Date(bookmark.lastUpdated), 'PPP');
       } catch (e) {
        return 'Invalid date';
       }
    }, [bookmark.lastUpdated]);

  return (
    <Card className={`flex flex-col bg-background/30 backdrop-blur-lg border shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 ${isSelected ? 'border-primary shadow-primary/30' : 'border-white/20'}`}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
            <div className="flex items-center h-full pt-1">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectionChange(bookmark.id, !!checked)}
                    aria-label={`Select bookmark ${bookmark.title}`}
                    className="mr-2"
                />
            </div>
             <div className="relative w-16 h-24 rounded-md overflow-hidden shrink-0">
                <Image 
                    src={bookmark.coverImage || `https://placehold.co/128x192.png`} 
                    alt={`Cover for ${bookmark.title}`}
                    data-ai-hint="manga cover"
                    layout="fill"
                    objectFit="cover"
                    className="bg-muted"
                />
             </div>

            <div className="flex-1">
                 <CardTitle className="text-lg leading-tight">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {bookmark.title}
                    </a>
                 </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => onUpdateChapter(bookmark.id, (bookmark.chapter || 0) - 1)}>
                        <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold w-10 text-center">Ch. {bookmark.chapter || 0}</span>
                    <Button variant="outline" size="icon" className="w-7 h-7" onClick={() => onUpdateChapter(bookmark.id, (bookmark.chapter || 0) + 1)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="flex flex-col items-center space-y-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => onToggleFavorite(bookmark.id)}>
                    <Star className={`w-5 h-5 transition-colors ${bookmark.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => onEdit(bookmark)}>
                    <Edit className="w-4 h-4" />
                </Button>
            </div>
      </CardHeader>
      <CardContent className="flex-grow pb-4 px-6">
        <p className="text-xs text-muted-foreground" title={initialDate}>
            Updated: {lastUpdatedText || initialDate}
        </p>
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {bookmark.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
