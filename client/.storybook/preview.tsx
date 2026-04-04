import type { Preview } from "@storybook/nextjs-vite";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";

import "../app/globals.css";
import React from "react";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <div
        className={`${notoSansKr.variable} ${geistMono.variable} antialiased`}
        style={{ minHeight: "100%" }}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
};

export default preview;
