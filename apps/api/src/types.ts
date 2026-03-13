/**
 * Hono environment types for the Tensorcraft API.
 */
export type AppEnv = {
  Variables: {
    userId: string;
    accessToken: string;
    isAdmin?: boolean;
  };
};
