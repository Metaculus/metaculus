/**
 * Used for accessing the app version on server.
 */
export async function GET() {
  return Response.json({
    buildId: process.env.BUILD_ID,
  });
}
