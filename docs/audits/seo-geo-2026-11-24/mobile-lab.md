# Mobile load times on four acquisition pages

On November 24, 2026, Deep Orbit took a median 5.07 seconds to paint its largest visible element. The comparison, learning path and project guide each took about 1.6 seconds. Lighthouse ran three cold, signed-out navigations per production URL. Each run used a fresh Chrome profile and stopped before anyone interacted or granted analytics consent.

## Production medians

LCP is largest contentful paint. TBT is total blocking time. The main-thread column counts all main-thread work. Script evaluation is one part of that total. Script transfer counts bytes Chrome received for script resources. Each cell gives the median of its three measurements.

| Page | Performance, /100 | LCP, s | TBT, ms | Script transfer, KiB | Main thread, s | Script evaluation, s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Deep Orbit | 81 | 5.07 | 64 | 538.5 | 2.23 | 1.51 |
| Comparison | 100 | 1.60 | 52 | 511.9 | 1.13 | 0.54 |
| Learning path | 100 | 1.61 | 32 | 511.3 | 0.83 | 0.39 |
| Project guide | 100 | 1.60 | 24 | 519.4 | 0.90 | 0.35 |

All twelve navigations returned HTTP 200 at the requested URL. Lighthouse recorded zero cumulative layout shift and issued no run warnings. These simulated mobile measurements describe initial page load. They leave real visitor performance, responsiveness during training and search outcomes unmeasured.

## What the browser loaded

The bridge image at `/locations/deep-orbit/bridge.webp` accounted for LCP on every Deep Orbit run. The server includes it in the initial HTML with `loading="lazy"`. Lighthouse reported a median 2.93 seconds between its simulated time to first byte and the start of the image load. On the three other pages the largest element was a paragraph.

All four routes requested the same two SDK-containing scripts. The chunk `13w1cnpbcwowf.js` contains the literals `posthog-js` and `capture_pageview`. It transferred 121.8 to 122.7 KiB per navigation. The chunk `2l3pjmxhbhycl.js` contains `supabase-js` and `@supabase/auth-js`. It transferred 61.7 to 62.6 KiB. Lighthouse estimated about 104 KiB and 50 KiB of unused JavaScript in these chunks respectively during the initial visits. The request log contained Tensorcraft and Sentry hosts. It recorded no requests to PostHog or Supabase hosts.

The course also spent 1.34 to 2.21 seconds of estimated script evaluation in a different shared chunk, `2850b9ep1zu_w.js`. It contains React DOM and Sentry code. The report attributes time to the chunk as a whole. It cannot assign that time to one library or predict what a consent-gated import would save.

## Individual runs

Times use UTC. Lighthouse ran one page at a time in three rounds through the four URLs.

| Page | Round | Start | Score | LCP, ms | TBT, ms | Script bytes | Main thread, ms | Script evaluation, ms |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Deep Orbit | 1 | 13:49:49 | 76 | 5973 | 169 | 551480 | 3470 | 2372 |
| Deep Orbit | 2 | 13:50:41 | 81 | 5072 | 64 | 551368 | 2231 | 1514 |
| Deep Orbit | 3 | 13:51:28 | 83 | 4741 | 41 | 551444 | 2214 | 1507 |
| Comparison | 1 | 13:50:05 | 100 | 1603 | 52 | 524226 | 1295 | 755 |
| Comparison | 2 | 13:50:52 | 100 | 1604 | 53 | 524213 | 994 | 435 |
| Comparison | 3 | 13:51:40 | 100 | 1596 | 33 | 523337 | 1130 | 544 |
| Learning path | 1 | 13:50:17 | 100 | 1615 | 26 | 523541 | 828 | 352 |
| Learning path | 2 | 13:51:05 | 100 | 1620 | 44 | 524214 | 804 | 393 |
| Learning path | 3 | 13:51:52 | 100 | 1605 | 32 | 523525 | 912 | 398 |
| Project guide | 1 | 13:50:29 | 99 | 1750 | 28 | 531879 | 903 | 371 |
| Project guide | 2 | 13:51:17 | 100 | 1605 | 16 | 531885 | 961 | 355 |
| Project guide | 3 | 13:52:04 | 100 | 1590 | 24 | 531063 | 693 | 330 |

## Simulated course image change

Three alternating pairs compared the bridge image's production attributes with `loading="eager" fetchpriority="high"`. The script intercepted the HTML response before Chrome parsed it. It replayed one captured production document for every run. Both groups used the same interception, response headers, live subresources and fresh signed-out profile. The script changed only the image tag for the candidate. The original document's SHA-256 was `1962248f3306789fa072857178ada9f8d4aab387d118685880f5e6e73817eeb3`.

The bridge image stayed the largest element and Chrome recorded one request for it on every run. Median LCP fell from 7.17 to 4.30 seconds within this experiment, a difference of 2.87 seconds. Median simulated image load delay fell from 5.22 to 2.27 seconds. The interception buffers the document, which changes navigation timing. Use the control below for this comparison. The baseline above measures the unmodified live site.

| Group | Pair | Start, UTC | Score | LCP, ms | Image load delay, ms | TBT, ms |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| Control | 1 | 13:55:14 | 73 | 7171 | 5220 | 60 |
| Candidate | 1 | 13:55:24 | 81 | 4345 | 2270 | 18 |
| Control | 2 | 13:55:34 | 73 | 7079 | 5229 | 28 |
| Candidate | 2 | 13:55:43 | 82 | 4297 | 2333 | 22 |
| Control | 3 | 13:55:52 | 73 | 7398 | 5126 | 26 |
| Candidate | 3 | 13:56:02 | 85 | 3977 | 2135 | 23 |

The production build also sends a preload for this image in its HTTP `Link` header. The simulation did not add that header. [Release verification](README.md)

## Deployed course on November 24

After Vercel deployed `241828f4`, three scored cold navigations to the production course gave a median LCP of 2.37 seconds, compared with 5.07 seconds before release on the same lab setup. Median performance score rose from 81 to 97, median TBT went from 64 to 60 ms, and median image load delay fell from 2.93 to 1.11 seconds. In each scored run Chrome fetched the bridge image once at high priority and identified it as the largest visible element.

| Start, UTC | Course LCP | Outcome |
| --- | ---: | --- |
| 14:07:11 | 2.370 s | Scored |
| 14:07:24 | 3.277 s | Scored |
| 14:07:37 | | Lighthouse returned `NO_FCP` and produced no score |
| 14:33:41 | 2.328 s | Fresh run after the unscored attempt |

These results describe the signed-out mobile lab environment. Real visitor load times require field data.

## Reproduction

The host ran macOS 15.8.2 on an Apple M3, Chrome 156.0.8078.80 and Node 22.23.2. The action's lockfile pins Lighthouse 12.6.1. Lighthouse used its default mobile simulation at 412 by 823 CSS pixels, device scale 1.75, 150 ms RTT, 1,638.4 Kbps throughput and a 4x CPU slowdown. All captures used only the performance category. [Action lockfile](https://github.com/treosh/lighthouse-ci-action/blob/3e7e23fb74242897f95c0ba9cabad3d0227b9b18/yarn.lock)

Run the following from the repository root using the same Chrome and Node versions. The scratch directory holds the full JSON reports. The comparison script checks the starting image tag and stops if a later release has already applied the change.

```sh
lab_dir=$(mktemp -d)
cp docs/audits/seo-geo-2026-11-24/mobile-lab.mjs "$lab_dir"
cd "$lab_dir" || exit 1
npm install --ignore-scripts --no-audit --no-fund lighthouse@12.6.1 puppeteer-core@24.43.1
export CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
for round in 1 2 3; do
  for route in /worlds/deep-orbit /compare /guides/javascript-machine-learning-learning-path /guides/browser-machine-learning-project; do
    ./node_modules/.bin/lighthouse "https://tensorcraft.app$route" \
      --only-categories=performance --chrome-flags='--headless=new --disable-extensions' \
      --output=json --output-path="./${route##*/}-$round.json" --quiet || exit 1
  done
done
node mobile-lab.mjs
```

These measurements and the local override script change no public URL. They require no recrawl.
