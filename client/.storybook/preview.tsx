import type { Preview } from "@storybook/nextjs-vite";
import { Geist_Mono, Noto_Sans_KR, Plus_Jakarta_Sans } from "next/font/google";
import type { ViewportMap } from "storybook/viewport";

import "../src/app/globals.css";
import React from "react";

/** agent/design/spec/design_tokens.json system.breakpoint 기준 (mobile-max 767, tablet 768–1023, desktop ≥1024) */
const projectViewports: ViewportMap = {
  mobile: {
    name: "모바일 (≤767px)",
    styles: { width: "400px", height: "874px" },
    type: "mobile",
  },
  tablet: {
    name: "태블릿 (768–1023px)",
    styles: { width: "834px", height: "1112px" },
    type: "tablet",
  },
  desktop: {
    name: "데스크톱 (≥1024px)",
    styles: { width: "1280px", height: "900px" },
    type: "desktop",
  },
};

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

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
});

const fontVariableClassName = `${notoSansKr.variable} ${geistMono.variable} ${plusJakartaSans.variable}`;

const preview: Preview = {
  decorators: [
    (Story) => {
      React.useEffect(() => {
        const htmlElement = document.documentElement;
        htmlElement.classList.add(...fontVariableClassName.split(" "));

        return () => {
          htmlElement.classList.remove(...fontVariableClassName.split(" "));
        };
      }, []);

      return (
        <div className="antialiased" style={{ minHeight: "100%" }}>
          <Story />
        </div>
      );
    },
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
    viewport: {
      options: projectViewports,
    },
    /** Docs·iframe 등에서 `usePathname()` 모킹. 스토리별 `parameters.nextjs.navigation`으로 덮어쓸 수 있음 */
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/recipe",
      },
    },
  },
  initialGlobals: {
    viewport: { value: "desktop", isRotated: false },
  },
};

export default preview;
