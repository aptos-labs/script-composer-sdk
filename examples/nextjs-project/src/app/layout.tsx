import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "../i18n/client";
import { ThemeProvider } from "../contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Script Composer SDK Demo",
  description: "Build and simulate Aptos blockchain transactions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const isManualTheme = localStorage.getItem('theme-manual') === 'true';
                  const savedTheme = localStorage.getItem('theme');
                  
                  let theme = 'light';
                  
                  // If user has manually set theme, always use saved theme (ignore system preference)
                  if (isManualTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
                    theme = savedTheme;
                  } else if (!isManualTheme) {
                    // Only use system preference if user hasn't manually set theme
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = prefersDark ? 'dark' : 'light';
                    // Save system preference to localStorage (but don't mark as manual)
                    localStorage.setItem('theme', theme);
                  } else if (savedTheme === 'dark' || savedTheme === 'light') {
                    // Fallback to saved theme if exists
                    theme = savedTheme;
                  }
                  
                  const html = document.documentElement;
                  if (theme === 'dark') {
                    html.classList.add('dark');
                  } else {
                    html.classList.remove('dark');
                  }
                  html.style.colorScheme = theme;
                } catch (e) {
                  // Ignore errors in initialization
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
