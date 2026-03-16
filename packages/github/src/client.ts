import { createAppAuth } from "@octokit/auth-app";
import { graphql } from "@octokit/graphql";

/**
 * GitHub App configuration — reads from environment variables.
 * Never hardcode secrets; all values come from process.env.
 */
function getAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!appId || !privateKey || !clientId || !clientSecret) {
    throw new Error(
      "Missing GitHub App environment variables. Required: GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET",
    );
  }

  return { appId, privateKey, clientId, clientSecret };
}

/**
 * Creates an authenticated GitHub GraphQL client for a specific installation.
 * Installation tokens are short-lived (1 hour) and auto-refreshed by octokit.
 */
export function getInstallationGraphqlClient(installationId: number) {
  const config = getAppConfig();

  const auth = createAppAuth({
    appId: config.appId,
    privateKey: config.privateKey,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    installationId,
  });

  return graphql.defaults({
    request: {
      hook: auth.hook,
    },
  });
}

/**
 * Creates an app-level authenticated GraphQL client (not installation-scoped).
 * Used for operations that don't require an installation context.
 */
export function getAppGraphqlClient() {
  const config = getAppConfig();

  const auth = createAppAuth({
    appId: config.appId,
    privateKey: config.privateKey,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });

  return graphql.defaults({
    request: {
      hook: auth.hook,
    },
  });
}
