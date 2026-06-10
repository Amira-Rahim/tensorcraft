import type { graphql } from "@octokit/graphql";

/** Response shape for createCommitOnBranch */
interface CreateCommitResponse {
  createCommitOnBranch: {
    commit: {
      oid: string;
      url: string;
    };
  };
}

/** Response shape for createRepository */
interface CreateRepositoryResponse {
  createRepository: {
    repository: {
      id: string;
      name: string;
      url: string;
      defaultBranchRef: {
        name: string;
        target: {
          oid: string;
        };
      };
    };
  };
}

/** Response shape for getting the latest commit OID on a branch */
interface GetBranchOidResponse {
  repository: {
    defaultBranchRef: {
      name: string;
      target: {
        oid: string;
      };
    };
  } | null;
}

/**
 * Creates a commit on a branch using the GitHub GraphQL API.
 * This avoids cloning repositories, commits are created server-side.
 */
export async function createCommitOnBranch(
  client: ReturnType<typeof graphql.defaults>,
  params: {
    repoOwner: string;
    repoName: string;
    branchName: string;
    expectedHeadOid: string;
    message: string;
    files: Array<{ path: string; contents: string }>;
  },
): Promise<{ oid: string; url: string }> {
  const fileAdditions = params.files.map((f) => ({
    path: f.path,
    contents: Buffer.from(f.contents).toString("base64"),
  }));

  const response = await client<CreateCommitResponse>(
    `mutation CreateCommit($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) {
        commit {
          oid
          url
        }
      }
    }`,
    {
      input: {
        branch: {
          repositoryNameWithOwner: `${params.repoOwner}/${params.repoName}`,
          branchName: params.branchName,
        },
        message: {
          headline: params.message,
        },
        fileChanges: {
          additions: fileAdditions,
        },
        expectedHeadOid: params.expectedHeadOid,
      },
    },
  );

  return response.createCommitOnBranch.commit;
}

/**
 * Creates a new repository for the user via the GraphQL API.
 * Repository naming follows: tensorcraft-{theme-slug}
 */
export async function createRepository(
  client: ReturnType<typeof graphql.defaults>,
  params: {
    name: string;
    description: string;
    visibility?: "PUBLIC" | "PRIVATE";
  },
): Promise<{
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  headOid: string;
}> {
  const response = await client<CreateRepositoryResponse>(
    `mutation CreateRepository($input: CreateRepositoryInput!) {
      createRepository(input: $input) {
        repository {
          id
          name
          url
          defaultBranchRef {
            name
            target {
              oid
            }
          }
        }
      }
    }`,
    {
      input: {
        name: params.name,
        description: params.description,
        visibility: params.visibility ?? "PRIVATE",
        hasIssuesEnabled: false,
        hasWikiEnabled: false,
      },
    },
  );

  const repo = response.createRepository.repository;
  return {
    id: repo.id,
    name: repo.name,
    url: repo.url,
    defaultBranch: repo.defaultBranchRef.name,
    headOid: repo.defaultBranchRef.target.oid,
  };
}

/**
 * Gets the latest commit OID on the default branch of a repository.
 * Needed as the expectedHeadOid for createCommitOnBranch.
 */
export async function getBranchHeadOid(
  client: ReturnType<typeof graphql.defaults>,
  params: {
    repoOwner: string;
    repoName: string;
  },
): Promise<{ branchName: string; oid: string } | null> {
  const response = await client<GetBranchOidResponse>(
    `query GetBranchOid($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        defaultBranchRef {
          name
          target {
            oid
          }
        }
      }
    }`,
    {
      owner: params.repoOwner,
      name: params.repoName,
    },
  );

  if (!response.repository?.defaultBranchRef) {
    return null;
  }

  return {
    branchName: response.repository.defaultBranchRef.name,
    oid: response.repository.defaultBranchRef.target.oid,
  };
}
