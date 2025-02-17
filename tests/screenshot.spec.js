/* eslint-disable spellcheck/spell-checker */
import { test } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import { readFileSync } from "fs";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { join } from "path";

// Extract a list of pathnames, given a fs path to a sitemap.xml file
// Docusaurus generates a build/sitemap.xml file for you!
// eslint-disable-next-line spellcheck/spell-checker
export function extractSitemapPathnames(sitemapPath) {
  const sitemap = fs.readFileSync(sitemapPath).toString();
  const $ = cheerio.load(sitemap, { xmlMode: true });
  const urls = [];
  $("loc").each(function handleLoc() {
    urls.push($(this).text());
  });
  return urls.map((url) => new URL(url).pathname);
}

// Converts a pathname to a decent screenshot name
export function pathnameToArgosName(pathname) {
  return pathname.replace(/^\/|\/$/g, "") || "index";
}

// Constants
const siteUrl = "http://localhost:3000";
// eslint-disable-next-line spellcheck/spell-checker
const sitemapPath = "./build/sitemap.xml";
const stylesheetPath = join(__dirname, "screenshot.css");
const stylesheet = readFileSync(stylesheetPath).toString();
// const stylesheet = `
// /* Iframes can load lazily */
// iframe,
// /* Avatars can be flaky due to using external sources: GitHub/Unavatar */
// .avatar__photo,
// /* Gifs load lazily and are animated */
// img[src$='.gif'],
// /* Algolia keyboard shortcuts appear with a little delay */
// .DocSearch-Button-Keys > kbd,
// /* The live playground preview can often display dates/counters */
// [class*='playgroundPreview'] {
//   visibility: hidden;
// }

// /* Different docs last-update dates can alter layout */
// .theme-last-updated,
// /* Mermaid diagrams are rendered client-side and produce layout shifts */
// .docusaurus-mermaid-container {
//   display: none;
// }
// `;

// Wait for hydration, requires Docusaurus v2.4.3+
// Docusaurus adds a <html data-has-hydrated="true"> once hydrated
// See https://github.com/facebook/docusaurus/pull/9256
function waitForDocusaurusHydration() {
  return document.documentElement.dataset.hasHydrated === "true";
}

function screenshotPathname(pathname) {
  test(`pathname ${pathname}`, async ({ page }) => {
    const url = siteUrl + pathname;
    await page.goto(url);
    await page.waitForFunction(waitForDocusaurusHydration);
    await page.addStyleTag({ content: stylesheet });
    await argosScreenshot(page, pathnameToArgosName(pathname));
  });
}

test.describe("Docusaurus site screenshots", () => {
  const pathnames = extractSitemapPathnames(sitemapPath);
  console.log("Pathnames to screenshot:", pathnames);
  pathnames.forEach(screenshotPathname);
});
