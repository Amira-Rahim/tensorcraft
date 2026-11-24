// Run from a scratch directory alongside the pinned Lighthouse installation.
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer-core";

const course = "https://tensorcraft.app/worlds/deep-orbit";
const image = "/locations/deep-orbit/bridge.webp";
const selector = 'img[src="/locations/deep-orbit/bridge.webp"]';
const tagPattern =
  /<img\b[^>]*\bsrc="\/locations\/deep-orbit\/bridge\.webp"[^>]*>/gi;

// Every pass replays the same document body. Production trace IDs vary by request.
let capturedDocument;
let capturedHash;

async function measure(group, repetition) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    args: ["--disable-extensions"],
  });

  try {
    const page = await browser.newPage();
    const session = await page.createCDPSession();
    await session.send("Fetch.enable", {
      patterns: [
        {
          urlPattern: course,
          resourceType: "Document",
          requestStage: "Response",
        },
      ],
    });
    let documents = 0;
    let failure;
    session.on(
      "Fetch.requestPaused",
      async ({ requestId, responseHeaders, responseStatusCode }) => {
        try {
          if (responseStatusCode !== 200)
            throw new Error("Course response did not return 200");
          const { body, base64Encoded } = await session.send(
            "Fetch.getResponseBody",
            { requestId },
          );
          const original = base64Encoded
            ? Buffer.from(body, "base64").toString("utf8")
            : body;
          const tags = original.match(tagPattern) ?? [];
          if (
            tags.length !== 1 ||
            !tags[0].includes('loading="lazy"') ||
            /fetchpriority=/i.test(tags[0])
          ) {
            throw new Error(
              "Production document does not match the baseline bridge tag",
            );
          }
          if (capturedDocument === undefined) {
            capturedDocument = original;
            capturedHash = createHash("sha256").update(original).digest("hex");
          }
          const html =
            group === "control"
              ? capturedDocument
              : capturedDocument.replace(tagPattern, (tag) =>
                  tag.replace(
                    'loading="lazy"',
                    'loading="eager" fetchpriority="high"',
                  ),
                );
          const headers = responseHeaders.filter(
            ({ name }) =>
              ![
                "content-length",
                "content-encoding",
                "transfer-encoding",
              ].includes(name.toLowerCase()),
          );
          await session.send("Fetch.fulfillRequest", {
            requestId,
            responseCode: 200,
            responseHeaders: headers,
            body: Buffer.from(html).toString("base64"),
          });
          documents++;
        } catch (error) {
          failure = error;
          await session
            .send("Fetch.failRequest", { requestId, errorReason: "Aborted" })
            .catch(() => {});
        }
      },
    );

    const result = await lighthouse(
      course,
      { onlyCategories: ["performance"], logLevel: "error" },
      undefined,
      page,
    );
    if (failure) throw failure;
    const report = result.lhr;
    const bridge = await page.$eval(selector, (element) => ({
      loading: element.loading,
      fetchPriority: element.fetchPriority,
    }));
    const expected = group === "control" ? ["lazy", "auto"] : ["eager", "high"];
    const requests = report.audits["network-requests"].details.items.filter(
      ({ url }) => url === new URL(image, course).href,
    );
    const mainRequests = report.audits["network-requests"].details.items.filter(
      ({ resourceType, url }) => resourceType === "Document" && url === course,
    );
    if (
      !documents ||
      mainRequests.length !== 1 ||
      report.runtimeError ||
      report.finalDisplayedUrl !== course ||
      requests.length !== 1 ||
      bridge.loading !== expected[0] ||
      bridge.fetchPriority !== expected[1] ||
      report.runWarnings.length
    ) {
      throw new Error(
        "Invalid course measurement " +
          JSON.stringify({
            documents,
            mainRequests: mainRequests.map((r) => ({
              url: r.url,
              status: r.statusCode,
            })),
            finalUrl: report.finalDisplayedUrl,
            bridge,
            requests: requests.length,
            warnings: report.runWarnings,
            error: report.runtimeError,
          }),
      );
    }
    const stem = `course-${group}-${repetition}`;
    await writeFile(stem + ".json", JSON.stringify(report));
    console.log(
      stem,
      report.fetchTime,
      capturedHash,
      documents,
      bridge,
      Math.round(report.audits["largest-contentful-paint"].numericValue),
    );
  } finally {
    await browser.close();
  }
}

for (let repetition = 1; repetition <= 3; repetition++) {
  for (const group of ["control", "candidate"])
    await measure(group, repetition);
}
