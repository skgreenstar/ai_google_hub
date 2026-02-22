
import { google } from "googleapis";

export const getPublicDriveClient = () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!email || !privateKey) {
        throw new Error("Public Drive access is not configured. Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    return google.drive({ version: "v3", auth });
};

export const getPublicFolderId = () => {
    const folderId = process.env.PUBLIC_DRIVE_FOLDER_ID?.trim().replace(/^"|"$/g, "");
    return folderId || 'root';
};
