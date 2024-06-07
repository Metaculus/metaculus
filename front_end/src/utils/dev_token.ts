"use server";

/**
 * Returns Access Token which is used to restrict access to dev server
 */
export const getDevAccessToken = async () => process.env.DEV_ACCESS_TOKEN;
