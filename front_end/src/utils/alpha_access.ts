"use server";

/**
 * Returns Access Token which is used to restrict access to dev server
 */
export const getAlphaAccessToken = async () => process.env.ALPHA_ACCESS_TOKEN;
