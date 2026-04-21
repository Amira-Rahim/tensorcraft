/**
 * Kit (ConvertKit) REST API v3 client.
 * Docs: https://developers.convertkit.com/v3
 */

const KIT_BASE_URL = "https://api.convertkit.com/v3";

function getApiKey(): string {
  const key = process.env.KIT_API_KEY;
  if (!key) throw new Error("KIT_API_KEY not configured");
  return key;
}

function getApiSecret(): string {
  const secret = process.env.KIT_API_SECRET;
  if (!secret) throw new Error("KIT_API_SECRET not configured");
  return secret;
}

interface KitSubscriber {
  id: number;
  email_address: string;
  first_name: string | null;
  state: string;
  created_at: string;
  fields: Record<string, string | null>;
}

interface KitSubscriberResponse {
  subscriber: KitSubscriber;
}

interface KitSubscribersResponse {
  total_subscribers: number;
  subscribers: KitSubscriber[];
}

async function kitFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${KIT_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "unknown error");
    throw new Error(`Kit API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Add a subscriber to your Kit account.
 */
export async function addSubscriber(
  email: string,
  firstName?: string,
  tags?: string[],
): Promise<KitSubscriber> {
  // If a form ID is configured, subscribe via form (recommended by Kit)
  const formId = process.env.KIT_FORM_ID;
  if (formId) {
    return addSubscriberToForm(formId, email, firstName);
  }

  // Fallback: direct subscriber creation
  const data = await kitFetch<KitSubscriberResponse>("/subscribers", {
    method: "POST",
    body: JSON.stringify({
      api_secret: getApiSecret(),
      email,
      first_name: firstName ?? undefined,
    }),
  });

  // Tag subscriber if tags provided
  if (tags && tags.length > 0) {
    await Promise.allSettled(tags.map((tagId) => tagSubscriber(email, tagId)));
  }

  return data.subscriber;
}

/**
 * Add a subscriber to a specific Kit form.
 */
export async function addSubscriberToForm(
  formId: string,
  email: string,
  firstName?: string,
): Promise<KitSubscriber> {
  const data = await kitFetch<KitSubscriberResponse>(
    `/forms/${formId}/subscribe`,
    {
      method: "POST",
      body: JSON.stringify({
        api_key: getApiKey(),
        email,
        first_name: firstName ?? undefined,
      }),
    },
  );
  return data.subscriber;
}

/**
 * Tag a subscriber by email.
 */
export async function tagSubscriber(
  email: string,
  tagId: string,
): Promise<KitSubscriber> {
  const data = await kitFetch<KitSubscriberResponse>(
    `/tags/${tagId}/subscribe`,
    {
      method: "POST",
      body: JSON.stringify({
        api_secret: getApiSecret(),
        email,
      }),
    },
  );
  return data.subscriber;
}

/**
 * Remove a tag from a subscriber.
 *
 * Kit v3: `POST /tags/{tag_id}/unsubscribe` with `{ email }`. This is
 * how we de-list a user from a lifecycle/notification sequence when
 * they toggle the corresponding preference OFF in /settings.
 *
 * Returns `null` if the subscriber wasn't tagged to begin with — Kit
 * returns a 404/422 for that case and we treat it as a no-op rather
 * than a failure (idempotent from the caller's perspective).
 */
export async function removeTagFromSubscriber(
  email: string,
  tagId: string,
): Promise<KitSubscriber | null> {
  try {
    const data = await kitFetch<KitSubscriberResponse>(
      `/tags/${tagId}/unsubscribe`,
      {
        method: "POST",
        body: JSON.stringify({
          api_secret: getApiSecret(),
          email,
        }),
      },
    );
    return data.subscriber;
  } catch {
    return null;
  }
}

/**
 * Fully unsubscribe a subscriber from the account (all sequences).
 *
 * Kit v3: `PUT /unsubscribe` with `{ email }`. Use this only for a
 * full opt-out; per-tag preference toggling should prefer
 * `removeTagFromSubscriber` so the user can re-enable a single
 * sequence later without losing the rest of their subscription state.
 */
export async function unsubscribeFromAll(
  email: string,
): Promise<KitSubscriber | null> {
  try {
    const data = await kitFetch<KitSubscriberResponse>("/unsubscribe", {
      method: "PUT",
      body: JSON.stringify({
        api_secret: getApiSecret(),
        email,
      }),
    });
    return data.subscriber;
  } catch {
    return null;
  }
}

/**
 * Look up a subscriber by email address.
 * Returns null if the subscriber is not found.
 */
export async function getSubscriber(
  email: string,
): Promise<KitSubscriber | null> {
  try {
    const data = await kitFetch<KitSubscribersResponse>(
      `/subscribers?api_secret=${encodeURIComponent(getApiSecret())}&email_address=${encodeURIComponent(email)}`,
    );
    return data.subscribers[0] ?? null;
  } catch {
    return null;
  }
}
