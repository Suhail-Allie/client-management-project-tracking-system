const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const webRoot = path.join(projectRoot, "web");

const htmlPages = [
    "index.html",
    "pages/dashboard.html",
    "pages/clients.html",
    "pages/client-details.html",
    "pages/projects.html",
    "pages/project-details.html",
    "pages/milestones.html",
    "pages/documents.html",
    "pages/invoices.html",
    "pages/reports.html",
    "pages/notifications.html",
    "pages/users.html",
    "pages/profile.html"
];

const requiredFiles = [
    ...htmlPages,
    "css/style.css",
    "js/app.js"
];

function getFullPath(relativePath) {
    return path.join(webRoot, relativePath);
}

function readFile(relativePath) {
    return fs.readFileSync(
        getFullPath(relativePath),
        "utf8"
    );
}

test("all required website files exist", () => {

    requiredFiles.forEach((file) => {

        const fullPath = getFullPath(file);

        assert.ok(
            fs.existsSync(fullPath),
            `Missing required file: ${file}`
        );

    });

});


test("all HTML pages contain content", () => {

    htmlPages.forEach((page) => {

        const content = readFile(page);

        assert.ok(
            content.trim().length > 100,
            `${page} appears to be empty`
        );

    });

});


test("all HTML pages contain required document structure", () => {

    htmlPages.forEach((page) => {

        const content = readFile(page);

        assert.match(
            content,
            /<!DOCTYPE html>/i,
            `${page} is missing the HTML5 doctype`
        );

        assert.match(
            content,
            /<html[^>]*lang=["']en["']/i,
            `${page} is missing the HTML language attribute`
        );

        assert.match(
            content,
            /<meta[^>]*charset=["']?UTF-8["']?/i,
            `${page} is missing UTF-8 charset`
        );

        assert.match(
            content,
            /name=["']viewport["']/i,
            `${page} is missing the viewport meta tag`
        );

        assert.match(
            content,
            /<title>.+<\/title>/is,
            `${page} is missing a page title`
        );

    });

});


test("all HTML pages reference the stylesheet", () => {

    htmlPages.forEach((page) => {

        const content = readFile(page);

        assert.match(
            content,
            /<link[^>]*href=["'][^"']*style\.css["']/i,
            `${page} does not reference style.css`
        );

    });

});


test("all HTML pages reference the JavaScript file", () => {

    htmlPages.forEach((page) => {

        const content = readFile(page);

        assert.match(
            content,
            /<script[^>]*src=["'][^"']*app\.js["'][^>]*><\/script>/i,
            `${page} does not reference app.js`
        );

    });

});


test("all internal HTML links point to existing files", () => {

    htmlPages.forEach((page) => {

        const content = readFile(page);

        const pagePath = getFullPath(page);

        const pageFolder = path.dirname(pagePath);

        const linkPattern = /href=["']([^"']+)["']/gi;

        let match;

        while (
            (match = linkPattern.exec(content)) !== null
        ) {

            const href = match[1];

            if (
                href.startsWith("#") ||
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:")
            ) {
                continue;
            }

            const cleanHref =
                href.split("?")[0].split("#")[0];

            if (cleanHref === "") {
                continue;
            }

            if (!cleanHref.endsWith(".html")) {
                continue;
            }

            const targetPath =
                path.resolve(
                    pageFolder,
                    cleanHref
                );

            assert.ok(
                fs.existsSync(targetPath),
                `${page} contains a broken link: ${href}`
            );

        }

    });

});


test("all internal system pages contain sidebar navigation", () => {

    const internalPages =
        htmlPages.filter(
            (page) => page !== "index.html"
        );

    internalPages.forEach((page) => {

        const content = readFile(page);

        assert.match(
            content,
            /class=["'][^"']*sidebar[^"']*["']/i,
            `${page} is missing the sidebar`
        );

        assert.match(
            content,
            /class=["'][^"']*sidebar-nav[^"']*["']/i,
            `${page} is missing sidebar navigation`
        );

        assert.match(
            content,
            /class=["'][^"']*dashboard-main[^"']*["']/i,
            `${page} is missing the main dashboard layout`
        );

    });

});


test("CSS stylesheet contains content", () => {

    const css =
        readFile("css/style.css");

    assert.ok(
        css.trim().length > 500,
        "style.css appears to contain insufficient content"
    );

});


test("JavaScript file contains content", () => {

    const javascript =
        readFile("js/app.js");

    assert.ok(
        javascript.trim().length > 500,
        "app.js appears to contain insufficient content"
    );

});


test("JavaScript contains no syntax errors", () => {

    const javascript =
        readFile("js/app.js");

    assert.doesNotThrow(
        () => {

            new vm.Script(javascript);

        },
        "app.js contains a JavaScript syntax error"
    );

});