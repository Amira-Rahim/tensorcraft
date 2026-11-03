// Loaded only for the review API process. Production never imports this file.
const http = require("node:http");
const https = require("node:https");

function assertLocalRequest(input, options) {
  let url;
  if (typeof input === "string" || input instanceof URL) {
    url = new URL(input);
  } else {
    const request = input || {};
    const host = request.hostname || request.host || "localhost";
    url = new URL(
      `${request.protocol || "http:"}//${host}${request.port ? `:${request.port}` : ""}`,
    );
    if (request.socketPath)
      throw new Error("Review API blocks socket-path HTTP requests.");
  }
  // Options can override URL hosts in Node's request(url, options) form.
  if (
    options &&
    (options.host || options.hostname || options.port || options.socketPath)
  ) {
    return assertLocalRequest({
      ...options,
      protocol: options.protocol || url.protocol,
    });
  }
  if (url.origin !== "http://127.0.0.1:56321" || url.username || url.password) {
    throw new Error(
      "External service calls are disabled in the local review API.",
    );
  }
}

function install() {
  for (const client of [http, https]) {
    for (const method of ["request", "get"]) {
      const original = client[method];
      client[method] = function (input, ...args) {
        assertLocalRequest(
          input,
          typeof args[0] === "object" ? args[0] : undefined,
        );
        return original.call(this, input, ...args);
      };
    }
  }
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, options) => {
    assertLocalRequest(input instanceof Request ? input.url : input);
    return originalFetch(input, { ...options, redirect: "error" });
  };
}

module.exports = { assertLocalRequest, install };
if (process.env.TENSORCRAFT_REVIEW === "1") install();
