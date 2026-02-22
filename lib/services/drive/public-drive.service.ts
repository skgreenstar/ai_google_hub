import { getPublicDriveClient, getPublicFolderId } from "@/lib/google/public-drive-auth";
import { Readable } from "node:stream";

export const getPublicFolder = () => getPublicFolderId();

export const getPublicDriveService = () => getPublicDriveClient();

const toReadableStream = async (file: File): Promise<Readable> => {
    const anyFile: any = file;
    const fileStream = anyFile.stream?.();

    if (fileStream && typeof (Readable as any).fromWeb === "function") {
        return (Readable as any).fromWeb(fileStream);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    return Readable.from(buffer);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableStatus = (status?: number) => {
    return !!status && (status === 429 || (status >= 500 && status < 600));
};

const isRetryableError = (error: unknown) => {
    if (!error) return false;
    const typed = error as { code?: number; message?: string; response?: { status?: number } };
    const status = typed.code ?? typed.response?.status;
    if (isRetryableStatus(status)) return true;
    const message = typed.message || "";
    return /(ECONNRESET|ETIMEDOUT|EAI_AGAIN|network.*error|socket hang up)/i.test(message);
};

const withRetry = async <T>(operation: () => Promise<T>, attempt = 1): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        const maxAttempts = 3;
        if (attempt >= maxAttempts || !isRetryableError(error)) {
            throw error;
        }

        const delayMs = Math.min(1500, 250 * Math.pow(2, attempt - 1));
        await sleep(delayMs);
        return withRetry(operation, attempt + 1);
    }
};

export const listPublicFiles = async (
    folderId: string,
    pageToken?: string,
    query?: string,
    orderBy: string = "folder,name"
) => {
    const drive = getPublicDriveService();

    const q = query ? `${query}` : `'${folderId}' in parents and trashed = false`;

    const res = await withRetry(() =>
        drive.files.list({
            q,
            pageSize: 20,
            pageToken,
            fields: "nextPageToken, files(id, name, mimeType, thumbnailLink, iconLink, size, modifiedTime, parents, capabilities, webViewLink, webContentLink)",
            orderBy,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
        })
    );

    return res.data;
};

export const uploadPublicFile = async (
    file: File,
    metadata: Record<string, unknown>,
    requestedParentId?: string
) => {
    const drive = getPublicDriveService();
    const baseFolderId = getPublicFolder();

    const parentId = requestedParentId && requestedParentId !== "root" ? requestedParentId : baseFolderId;
    const stream = await toReadableStream(file);

    const fileMetadata: Record<string, unknown> = {
        name: file.name,
        ...metadata,
    };

    if (parentId) {
        fileMetadata.parents = [parentId];
    }

    const media = {
        mimeType: file.type || "application/octet-stream",
        body: stream,
    };

    const res = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, name, mimeType, size",
        supportsAllDrives: true,
    });

    return res.data;
};

export const getPublicFileStream = async (fileId: string) => {
    const drive = getPublicDriveService();
    return await withRetry(() =>
        drive.files.get(
            { fileId, alt: "media" },
            { responseType: "stream" }
        )
    );
};
