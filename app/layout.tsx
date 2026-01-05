import type { Metadata } from "next";
import QueryProvider from "@/lib/providers/query-provider";
import SessionProvider from "@/lib/providers/session-provider";
import "./fonts.css";
import "./globals.css";
import { UploadModal } from "@/components/features/UploadModal";
import { FilePreviewModal } from "@/components/features/FilePreviewModal";
import { CreateFolderModal } from "@/components/features/CreateFolderModal";

export const metadata: Metadata = {
  title: "Google Drive Hub",
  description: "Enterprise Google Drive Hub Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <SessionProvider>
          <QueryProvider>
            {children}
            <UploadModal />
            <FilePreviewModal />
            <CreateFolderModal />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
