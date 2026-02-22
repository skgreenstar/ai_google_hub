import { google } from "googleapis";
import { Readable } from "node:stream";

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    thumbnailLink?: string;
    iconLink?: string;
    size?: number;
    modifiedTime?: string;
    parents?: string[];
    capabilities?: {
        canDownload: boolean;
        canEdit: boolean;
        canShare: boolean;
    };
    webViewLink?: string;
    webContentLink?: string;
}

export interface DriveStats {
    storageQuota?: {
        usage?: string;
        limit?: string;
        usageInDrive?: string;
        usageInDriveTrash?: string;
    };
    user?: {
        displayName?: string;
        emailAddress?: string;
        photoLink?: string;
    };
}

const createDriveClient = (accessToken: string) => {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    return google.drive({ version: "v3", auth });
};

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

export const listFiles = async (
    accessToken: string,
    folderId: string = "root",
    pageSize: number = 20,
    pageToken?: string,
    query?: string,
    orderBy?: string
) => {
    const drive = createDriveClient(accessToken);

    let q = `'${folderId}' in parents and trashed = false`;
    if (query) {
        if (query.includes("trashed")) {
            q = query;
        } else {
            q = `trashed = false and (${query})`;
        }
    }

    const res = await withRetry(() =>
        drive.files.list({
        q,
        pageSize,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType, thumbnailLink, iconLink, size, modifiedTime, parents, capabilities, webViewLink, webContentLink)",
        orderBy: orderBy || "folder,name",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: "allDrives",
        })
    );

    return res.data;
};

export const listSharedDrives = async (
    accessToken: string,
    pageSize: number = 20,
    pageToken?: string
) => {
    const drive = createDriveClient(accessToken);
    const res = await withRetry(() =>
        drive.drives.list({
            pageSize,
            pageToken,
            fields: "nextPageToken, drives(id, name, backgroundImageLink, colorRgb)",
        })
    );
    return res.data;
};

export const getFileStream = async (accessToken: string, fileId: string) => {
    const drive = createDriveClient(accessToken);
    return await withRetry(() =>
        drive.files.get(
            { fileId, alt: "media" },
            { responseType: "stream" }
        )
    );
};

export const getDriveStats = async (accessToken: string): Promise<DriveStats> => {
    const drive = createDriveClient(accessToken);
    const res = await withRetry(() => drive.about.get({ fields: "storageQuota, user" }));
    return res.data as DriveStats;
};

export const createFolder = async (accessToken: string, name: string, parentId?: string) => {
    const drive = createDriveClient(accessToken);
    const fileMetadata: Record<string, unknown> = {
        name,
        mimeType: "application/vnd.google-apps.folder",
    };

    if (parentId && parentId !== "root") {
        fileMetadata.parents = [parentId];
    }

    const res = await withRetry(() =>
        drive.files.create({
            requestBody: fileMetadata,
            fields: "id, name, mimeType",
            supportsAllDrives: true,
        })
    );

    return res.data;
};

export const uploadDriveFile = async (
    accessToken: string,
    file: File,
    metadata: Record<string, unknown>,
    parentId?: string
) => {
    const drive = createDriveClient(accessToken);
    const stream = await toReadableStream(file);

    const fileMetadata: Record<string, unknown> = {
        name: file.name,
        ...metadata,
    };

    if (parentId && parentId !== "root") {
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

export const moveToTrash = async (accessToken: string, fileId: string) => {
    const drive = createDriveClient(accessToken);
    const res = await withRetry(() =>
        drive.files.update({
            fileId,
            requestBody: { trashed: true },
            supportsAllDrives: true,
        })
    );

    return res.data;
};

export const getDriveClient = createDriveClient;
