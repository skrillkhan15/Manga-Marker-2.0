"use client"

import type { Bookmark } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BookMarked, Star, Tag, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface DashboardProps {
    bookmarks: Bookmark[];
}

export default function Dashboard({ bookmarks }: DashboardProps) {

    const stats = useMemo(() => {
        const total = bookmarks.length;
        const favorites = bookmarks.filter(b => b.isFavorite).length;
        const tags = new Set<string>();
        bookmarks.forEach(b => b.tags?.forEach(tag => tags.add(tag)));
        const uniqueTags = tags.size;
        const latestUpdate = total > 0 
            ? bookmarks.reduce((latest, current) => new Date(latest.lastUpdated) > new Date(current.lastUpdated) ? latest : current)
            : null;

        return { total, favorites, uniqueTags, latestUpdate };
    }, [bookmarks]);


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
                        <BookMarked className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.favorites}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Tags</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.uniqueTags}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold truncate">{stats.latestUpdate?.title || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.latestUpdate ? new Date(stats.latestUpdate.lastUpdated).toLocaleDateString() : ''}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
