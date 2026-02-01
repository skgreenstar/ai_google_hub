"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Folder, Star, Clock, Trash2, Cloud, ChevronLeft, PieChart, Users, HardDrive } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Home", href: "/" },
    { icon: Folder, label: "My Files", href: "/?filter=all" },
    { icon: HardDrive, label: "Shared Drives", href: "/?filter=drives" },
    { icon: Users, label: "Shared with me", href: "/?filter=shared" },
    { icon: Star, label: "Starred", href: "/?filter=starred" },
    { icon: Clock, label: "Recent", href: "/?sort=recent" },
    { icon: Trash2, label: "Trash", href: "/?filter=trash" },
    { icon: PieChart, label: "Storage & Stats", href: "/stats" },
    { icon: Users, label: "Team & Users", href: "/admin/users" },
];

export function Sidebar() {
    const { sidebarOpen, toggleSidebar } = useAppStore();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 bg-background border-r border-border transition-all duration-300 ease-in-out flex flex-col",
                sidebarOpen ? "w-64" : "w-20"
            )}
        >
            <div className="h-16 flex items-center px-6 border-b border-border/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="min-w-8 min-h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Cloud className="w-5 h-5" />
                    </div>
                    <span className={cn("font-bold text-lg whitespace-nowrap transition-opacity", !sidebarOpen && "opacity-0")}>
                        Drive Hub
                    </span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    // Logic to determine active state
                    let isActive = false;
                    if (item.href === "/") {
                        // Home is active only if root and no specific params that belong to other tabs
                        isActive = pathname === "/" && !searchParams.has("filter") && !searchParams.has("sort");
                    } else if (item.href.startsWith("/?")) {
                        // For query param links
                        const itemParams = new URLSearchParams(item.href.split("?")[1]);
                        const filter = itemParams.get("filter");
                        const sort = itemParams.get("sort");

                        if (filter) isActive = searchParams.get("filter") === filter;
                        if (sort) isActive = searchParams.get("sort") === sort;
                    } else {
                        // Standard path matching
                        isActive = pathname === item.href;
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-3 py-3 rounded-lg transition-colors group relative",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                            <span className={cn("font-medium whitespace-nowrap transition-opacity duration-200", !sidebarOpen && "opacity-0 hidden")}>
                                {item.label}
                            </span>
                            {!sidebarOpen && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                <button
                    onClick={toggleSidebar}
                    className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-secondary/10 text-muted-foreground transition-colors"
                >
                    <ChevronLeft className={cn("w-5 h-5 transition-transform", !sidebarOpen && "rotate-180")} />
                </button>
            </div>
        </aside>
    );
}
