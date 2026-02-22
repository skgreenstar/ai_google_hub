const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

export const isAdminEmail = (email?: string | null) => {
    const target = normalize(email);
    if (!target) return false;

    const env = normalize(process.env.ADMIN_EMAILS);
    if (!env) {
        return process.env.NODE_ENV !== "production";
    }

    const allowed = env
        .split(",")
        .map((v) => normalize(v))
        .filter(Boolean);

    return allowed.includes(target);
};
