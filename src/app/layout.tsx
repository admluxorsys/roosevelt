import type { Metadata } from "next";
import { Montserrat } from "next/font/google"; // Font updated to Montserrat

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/SidebarContext";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";


const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roosevelt | Artificial Intelligence",
  description: `A Next-Generation Artificial Intelligence infrastructure designed to act as a unified command center. It's a proactive manager integrating business strategy with personal optimization. 
  
How it works:
• Total Interconnectivity: Links digital assets, blockchains (like Solana), and admin tools for a real-time 360° view.
• Predictive Analysis: Detects patterns, financial risks, and crypto opportunities before they become problems.
• Autonomous Execution: Resolves technical tasks independently, letting you focus on high-level decisions.

Impact Areas: Web3 Ecosystems, Business Direction, and Time Optimization. 

It is the bridge between the founder's vision and operational execution, evolving with your business.`,
  icons: {
    icon: [
      { url: "/assets/newlogo.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/newlogo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/assets/newlogo.png", sizes: "180x180", type: "image/png" },
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              {children}
              <Toaster position="top-right" richColors theme="dark" />
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

