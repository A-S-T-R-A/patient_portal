import "../styles/globals.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
