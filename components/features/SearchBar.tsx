"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export function SearchBar() {
    const { setSearchQuery } = useAppStore();
    const [value, setValue] = useState("");
    const [debouncedValue] = useDebounce(value, 500);

    useEffect(() => {
        setSearchQuery(debouncedValue);
    }, [debouncedValue, setSearchQuery]);

    return (
        <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border-none rounded-full bg-secondary/10 hover:bg-secondary/20 focus:bg-background focus:ring-2 focus:ring-primary transition-all duration-200 text-sm placeholder:text-muted-foreground outline-none"
                placeholder="Search files, folders..."
            />
        </div>
    );
}
