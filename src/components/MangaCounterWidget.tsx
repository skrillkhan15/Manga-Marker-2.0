
"use client";

import { BookMarked, BookOpenCheck, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface MangaCounterWidgetProps {
    totalBookmarks: number;
    favorites: number;
    chaptersReadToday: number;
}

export function MangaCounterWidget({ totalBookmarks, favorites, chaptersReadToday }: MangaCounterWidgetProps) {
    return (
        <TooltipProvider>
            <Card className="fixed bottom-4 right-4 z-50 w-auto p-0 animate-fade-in shadow-lg border-primary/20 bg-background/60 backdrop-blur-lg">
                <CardContent className="p-2 flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-sm">
                                <BookMarked className="w-4 h-4 text-primary" />
                                <span className="font-bold">{totalBookmarks}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                            <p>Total Bookmarks</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-sm">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="font-bold">{favorites}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                            <p>Favorites</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-sm">
                                <BookOpenCheck className="w-4 h-4 text-green-500" />
                                <span className="font-bold">{chaptersReadToday}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="center">
                            <p>Chapters Read Today</p>
                        </TooltipContent>
                    </Tooltip>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
