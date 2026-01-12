import { google } from "googleapis";

export const getDriveClient = () => {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ["https://www.googleapis.com/auth/drive"],
    });

    return google.drive({ version: "v3", auth });
};

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

export const listFiles = async (
    folderId: string = "root",
    pageSize: number = 20,
    pageToken?: string,
    query?: string,
    orderBy?: string
) => {
    const drive = getDriveClient();

    // Default base query
    let q = `'${folderId}' in parents and trashed = false`;

    if (query) {
        // If query explicitly mentions starred or trashed status, rely on it
        if (query.includes("trashed")) {
            q = query;
        } else {
            // Otherwise assume active files search
            q = `trashed = false and (${query})`;
        }
    }

    // Shared Drive Support: includeItemsFromAllDrives, supportsAllDrives
    const res = await drive.files.list({
        q,
        pageSize,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType, thumbnailLink, iconLink, size, modifiedTime, parents, capabilities, webViewLink, webContentLink)",
        orderBy: orderBy || "folder,name",
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });

    return res.data;
};

export const getFileStream = async (fileId: string) => {
    const drive = getDriveClient();
    return await drive.files.get(
        {
            fileId,
            alt: "media",
            supportsAllDrives: true
        },
        { responseType: "stream" }
    );
};

export const getDriveStats = async () => {
    const drive = getDriveClient();
    const res = await drive.about.get({
        fields: "storageQuota, user",
    });
    return res.data;
};

export const createFolder = async (name: string, parentId?: string) => {
    const drive = getDriveClient();
    const fileMetadata: any = {
        name,
        mimeType: "application/vnd.google-apps.folder",
    };

    if (parentId && parentId !== "root") {
        fileMetadata.parents = [parentId];
    }

    const res = await drive.files.create({
        requestBody: fileMetadata,
        fields: "id, name, mimeType",
        supportsAllDrives: true,
    });

    return res.data;
};

export const moveToTrash = async (fileId: string) => {
    const drive = getDriveClient();
    const res = await drive.files.update({
        fileId,
        requestBody: {
            trashed: true,
        },
        supportsAllDrives: true,
    });
    return res.data;
};
