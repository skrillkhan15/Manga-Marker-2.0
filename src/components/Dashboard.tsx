"use client"

import type { Bookmark, ReadingStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BookMarked, Star, Tag, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";

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

        return { total, favorites, uniqueTags, latestUpdate, chartData };
    }, [bookmarks]);

    const chartConfig = {
        value: { label: "Bookmarks" },
        reading: { label: "Reading", color: "hsl(var(--chart-1))" },
        completed: { label: "Completed", color: "hsl(var(--chart-2))" },
        "on-hold": { label: "On Hold", color: "hsl(var(--chart-3))" },
        dropped: { label: "Dropped", color: "hsl(var(--chart-4))" },
        "plan-to-read": { label: "Plan to Read", color: "hsl(var(--chart-5))" },
    }

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
