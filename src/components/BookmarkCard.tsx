"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Trash2, Edit, Star, Tag } from 'lucide-react';
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
  isSelected: boolean;
  onSelectionChange: (id: string, isSelected: boolean) => void;
}

export default function BookmarkCard({ bookmark, onEdit, onToggleFavorite, isSelected, onSelectionChange }: BookmarkCardProps) {
    const [lastUpdatedText, setLastUpdatedText] = useState('');

    useEffect(() => {
        const updateText = () => {
          setLastUpdatedText(formatDistanceToNow(new Date(bookmark.lastUpdated), { addSuffix: true }));
        };
        updateText();
        const timer = setInterval(updateText, 1000 * 60);
        return () => clearInterval(timer);
    }, [bookmark.lastUpdated]);
  
    const initialDate = useMemo(() => {
        return format(new Date(bookmark.lastUpdated), 'PPP');
    }, [bookmark.lastUpdated]);

  return (
    <Card className={`bg-background/30 backdrop-blur-lg border shadow-lg hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 ${isSelected ? 'border-primary shadow-primary/30' : 'border-white/20'}`}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
            <div className="flex items-center h-full pt-1">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectionChange(bookmark.id, !!checked)}
                    aria-label={`Select bookmark ${bookmark.title}`}
                    className="mr-2"
                />
            </div>
            <div className="flex-1">
                 <CardTitle className="truncate text-lg">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {bookmark.title}
                    </a>
                 </CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => onToggleFavorite(bookmark.id)}>
                <Star className={`w-5 h-5 transition-colors ${bookmark.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
            </Button>
      </CardHeader>
      <CardContent className="pb-4 pl-14">
        <p className="text-sm text-muted-foreground" title={initialDate}>
            Last updated: {lastUpdatedText || initialDate}
        </p>
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {bookmark.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pl-14">
        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onEdit(bookmark)}>
            <Edit className="w-4 h-4" />
            <span className="sr-only">Edit</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
