import { google } from "googleapis";

export const getDriveClient = (accessToken: string) => {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

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
    accessToken: string,
    folderId: string = "root",
    pageSize: number = 20,
    pageToken?: string,
    query?: string,
    orderBy?: string
) => {
    const drive = getDriveClient(accessToken);

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

    console.log(`API: listFiles query: "${q}", folderId: "${folderId}"`);

    const res = await drive.files.list({
        q,
        pageSize,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType, thumbnailLink, iconLink, size, modifiedTime, parents, capabilities, webViewLink, webContentLink)",
        orderBy: orderBy || "folder,name",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
    });

    return res.data;
};

export const listSharedDrives = async (
    accessToken: string,
    pageSize: number = 20,
    pageToken?: string
) => {
    const drive = getDriveClient(accessToken);
    const res = await drive.drives.list({
        pageSize,
        pageToken,
        fields: "nextPageToken, drives(id, name, backgroundImageLink, colorRgb)",
    });
    return res.data;
};

export const getFileStream = async (accessToken: string, fileId: string) => {
    const drive = getDriveClient(accessToken);
    return await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
    );
};

export const getDriveStats = async (accessToken: string) => {
    const drive = getDriveClient(accessToken);
    const res = await drive.about.get({
        fields: "storageQuota, user",
    });
    return res.data;
};

export const createFolder = async (accessToken: string, name: string, parentId?: string) => {
    const drive = getDriveClient(accessToken);
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

export const moveToTrash = async (accessToken: string, fileId: string) => {
    const drive = getDriveClient(accessToken);
    const res = await drive.files.update({
        fileId,
        requestBody: {
            trashed: true,
        },
        supportsAllDrives: true,
    });
    return res.data;
};
