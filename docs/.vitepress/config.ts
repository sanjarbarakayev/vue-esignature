import { defineConfig } from "vitepress";
import { resolve } from "path";

export default defineConfig({
  base: "/vue-esignature/",
  title: "Vue E-Signature",
  description:
    "Vue 3 plugin for E-IMZO electronic digital signature integration - Uzbekistan's national digital signature system",

  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Examples", link: "/examples/" },
      { text: "Demo", link: "/demo/" },
      {
        text: "Links",
        items: [
          {
            text: "GitHub",
            link: "https://github.com/sanjarbarakayev/vue-esignature",
          },
          {
            text: "npm",
            link: "https://www.npmjs.com/package/@sanjarbarakayev/vue-esignature",
          },
          { text: "E-IMZO Official", link: "https://e-imzo.uz" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Vue E-Signature?", link: "/guide/" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Working with Certificates", link: "/guide/certificates" },
            { text: "Signing Documents", link: "/guide/signing" },
            { text: "Hardware Tokens", link: "/guide/hardware-tokens" },
            { text: "Mobile Signing (QR)", link: "/guide/mobile" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Internationalization", link: "/guide/i18n" },
            { text: "Error Handling", link: "/guide/error-handling" },
            { text: "TypeScript Support", link: "/guide/typescript" },
          ],
        },
      ],

      "/api/": [
        {
          text: "Core API",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "ESignature Class", link: "/api/esignature" },
            { text: "useESignature Composable", link: "/api/composable" },
          ],
        },
        {
          text: "Crypto Utilities",
          items: [
            { text: "CRC32", link: "/api/crc32" },
            { text: "GOST Hash", link: "/api/gost-hash" },
          ],
        },
        {
          text: "Mobile & QR",
          items: [{ text: "EIMZOMobile", link: "/api/e-imzo-mobile" }],
        },
        {
          text: "Internationalization",
          items: [{ text: "i18n Functions", link: "/api/i18n" }],
        },
        {
          text: "Reference",
          items: [{ text: "Types", link: "/api/types" }],
        },
      ],

      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Overview", link: "/examples/" },
            { text: "Basic Signing", link: "/examples/basic-signing" },
            {
              text: "Certificate Selection",
              link: "/examples/certificate-selection",
            },
            { text: "Mobile QR Signing", link: "/examples/mobile-qr" },
            { text: "Vue Component", link: "/examples/vue-component" },
          ],
        },
      ],

      "/demo/": [
        {
          text: "Interactive Demos",
          items: [
            { text: "Overview", link: "/demo/" },
            { text: "Certificate Selection", link: "/demo/certificate-selection" },
            { text: "Document Signing", link: "/demo/signing" },
            { text: "Mobile QR Signing", link: "/demo/mobile-qr" },
          ],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/sanjarbarakayev/vue-esignature",
      },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024-present Sanjar Barakayev",
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/sanjarbarakayev/vue-esignature/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },

  vite: {
    resolve: {
      alias: {
        "@sanjarbarakayev/vue-esignature": resolve(
          __dirname,
          "../../src/index.ts"
        ),
      },
    },
  },
});
