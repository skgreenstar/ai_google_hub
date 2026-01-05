"use client";

import { useAppStore } from "@/lib/store/use-app-store";
import { X, Upload, FileIcon, Loader2, Folder as FolderIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function UploadModal() {
    const { uploadModalOpen, setUploadModalOpen, folderId, folderName } = useAppStore();
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const queryClient = useQueryClient();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("metadata", JSON.stringify({ description }));
            formData.append("parentId", folderId); // Use current folder ID

            const res = await fetch("/api/drive/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            // Success
            queryClient.invalidateQueries({ queryKey: ["drive-files"] });
            setUploadModalOpen(false);
            setFile(null);
            setDescription("");
        } catch (error) {
            console.error("Upload error", error);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    if (!uploadModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop Click to Close */}
            <div
                className="absolute inset-0"
                onClick={() => !isUploading && setUploadModalOpen(false)}
            />

            <div className="relative w-full max-w-lg bg-background rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold">Upload File</h2>
                    <button
                        onClick={() => setUploadModalOpen(false)}
                        disabled={isUploading}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <span className="font-medium text-foreground">Location:</span>
                    <FolderIcon className="w-4 h-4" />
                    <span>{folderName}</span>
                </div>

                <div className="space-y-6">
                    {/* Drag & Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                    <FileIcon className="w-8 h-8" />
                                </div>
                                <p className="font-medium truncate max-w-[200px] mx-auto">{file.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="mt-4 text-sm text-red-500 hover:underline"
                                    disabled={isUploading}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium mb-1">Drag and drop file here</p>
                                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleChange}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
                                >
                                    Select File
                                </label>
                            </>
                        )}
                    </div>

                    {/* Metadata Inputs */}
                    {file && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="Add a description..."
                                    disabled={isUploading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : "Upload"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
