
"use client"

import type { Bookmark, ReadingStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { BookMarked, Star, Tag, TrendingUp, History, Heart } from "lucide-react";
import { useMemo } from "react";
import Image from 'next/image';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import { Button } from "./ui/button";

interface DashboardProps {
    bookmarks: Bookmark[];
}

export default function Dashboard({ bookmarks }: DashboardProps) {

    const { stats, recentlyUpdated, favoritesList } = useMemo(() => {
        const total = bookmarks.length;
        const favoritesCount = bookmarks.filter(b => b.isFavorite).length;
        const tags = new Set<string>();
        bookmarks.forEach(b => b.tags?.forEach(tag => tags.add(tag)));
        const uniqueTags = tags.size;
        
        const sortedByUpdate = [...bookmarks].sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

        const latestUpdate = total > 0 ? sortedByUpdate[0] : null;

        const recentlyUpdated = sortedByUpdate.slice(0, 5);
        const favoritesList = bookmarks.filter(b => b.isFavorite).slice(0, 5);

        const statusCounts = bookmarks.reduce((acc, b) => {
            acc[b.status] = (acc[b.status] || 0) + 1;
            return acc;
        }, {} as Record<ReadingStatus, number>);
        
        const chartData = [
            { name: "Reading", value: statusCounts.reading || 0, fill: "var(--color-reading)" },
            { name: "Completed", value: statusCounts.completed || 0, fill: "var(--color-completed)" },
            { name: "On Hold", value: statusCounts['on-hold'] || 0, fill: "var(--color-on-hold)" },
            { name: "Dropped", value: statusCounts.dropped || 0, fill: "var(--color-dropped)" },
            { name: "Plan to Read", value: statusCounts['plan-to-read'] || 0, fill: "var(--color-plan-to-read)" },
        ];

        return { 
            stats: { total, favorites: favoritesCount, uniqueTags, latestUpdate, chartData },
            recentlyUpdated,
            favoritesList
        };
    }, [bookmarks]);

    const chartConfig = {
        value: { label: "Bookmarks" },
        reading: { label: "Reading", color: "hsl(var(--chart-1))" },
        completed: { label: "Completed", color: "hsl(var(--chart-2))" },
        "on-hold": { label: "On Hold", color: "hsl(var(--chart-3))" },
        dropped: { label: "Dropped", color: "hsl(var(--chart-4))" },
        "plan-to-read": { label: "Plan to Read", color: "hsl(var(--chart-5))" },
    }

    const QuickAccessList = ({ bookmarks }: { bookmarks: Bookmark[] }) => (
        <div className="space-y-4">
            {bookmarks.map(bookmark => (
                <div key={bookmark.id} className="flex items-center gap-4">
                    <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0">
                        <Image
                            src={bookmark.coverImage || `https://placehold.co/96x128.png`}
                            alt={`Cover for ${bookmark.title}`}
                            data-ai-hint="manga cover"
                            layout="fill"
                            objectFit="cover"
                            className="bg-muted"
                        />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm truncate">{bookmark.title}</p>
                        <p className="text-xs text-muted-foreground">Chapter {bookmark.chapter || 0}</p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                            Read
                        </a>
                    </Button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
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
                        <div className="text-xl font-bold truncate" title={stats.latestUpdate?.title || 'N/A'}>{stats.latestUpdate?.title || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.latestUpdate ? new Date(stats.latestUpdate.lastUpdated).toLocaleDateString() : ''}
                        </p>
                    </CardContent>
                </Card>
            </div>
            
             <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Recently Updated
                        </CardTitle>
                         <CardDescription>Your most recently read or updated titles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentlyUpdated.length > 0 ? (
                           <QuickAccessList bookmarks={recentlyUpdated} />
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                <p>No recent activity.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Heart className="w-5 h-5" />
                           Your Favorites
                        </CardTitle>
                        <CardDescription>Quick access to your favorite series.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {favoritesList.length > 0 ? (
                            <QuickAccessList bookmarks={favoritesList} />
                        ) : (
                            <div className="flex items-center justify-center h-40 text-muted-foreground">
                                <p>Mark some bookmarks as favorites!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
             </div>

            <Card>
                <CardHeader>
                    <CardTitle>Collection Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {bookmarks.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-64 w-full">
                            <BarChart accessibilityLayer data={stats.chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                            <p>No data to display. Add some bookmarks!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
