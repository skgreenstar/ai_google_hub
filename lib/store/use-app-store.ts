import { create } from 'zustand';
import { DriveFile } from "@/lib/google/drive";

interface AppState {
    sidebarOpen: boolean;
    previewFile: DriveFile | null;
    uploadModalOpen: boolean;
    searchQuery: string;
    filterType: string;
    folderPath: { id: string; name: string }[];
    toggleSidebar: () => void;
    setPreviewFile: (file: DriveFile | null) => void;
    setUploadModalOpen: (open: boolean) => void;
    setSearchQuery: (query: string) => void;
    setFilterType: (type: string) => void;
    folderId: string;
    setFolderId: (folderId: string) => void;
    folderName: string;
    setFolderName: (name: string) => void;
    setFolderPath: (path: { id: string; name: string }[]) => void;
    pushFolder: (folder: { id: string; name: string }) => void;
    popFolder: (rootName: string, rootId?: string) => void;
    resetFolderPath: () => void;
    createFolderModalOpen: boolean;
    setCreateFolderModalOpen: (open: boolean) => void;
    selectedFileIds: string[];
    toggleSelection: (fileId: string) => void;
    clearSelection: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    sidebarOpen: true,
    previewFile: null,
    uploadModalOpen: false,
    searchQuery: "",
    filterType: "all",
    folderId: "root",
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setPreviewFile: (file) => set({ previewFile: file }),
    setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilterType: (type) => set({ filterType: type }),
    folderPath: [],
    setFolderId: (folderId) => set({ folderId }),
    folderName: "My Drive",
    setFolderName: (name) => set({ folderName: name }),
    setFolderPath: (path) => set({ folderPath: path }),
    pushFolder: (folder) => set((state) => ({ folderPath: [...state.folderPath, folder] })),
    popFolder: (rootName, rootId = "root") => set((state) => {
        if (state.folderPath.length === 0) {
            return {
                folderId: rootId,
                folderName: rootName
            };
        }

        const nextPath = state.folderPath.slice(0, -1);
        const nextFolder = nextPath[nextPath.length - 1];

        return {
            folderPath: nextPath,
            folderId: nextFolder?.id || rootId,
            folderName: nextFolder?.name || rootName
        };
    }),
    resetFolderPath: () => set({ folderPath: [] }),
    createFolderModalOpen: false,
    setCreateFolderModalOpen: (open) => set({ createFolderModalOpen: open }),
    selectedFileIds: [],
    toggleSelection: (fileId) => set((state) => {
        const isSelected = state.selectedFileIds.includes(fileId);
        return {
            selectedFileIds: isSelected
                ? state.selectedFileIds.filter((id) => id !== fileId)
                : [...state.selectedFileIds, fileId]
        };
    }),
    clearSelection: () => set({ selectedFileIds: [] }),
}));
