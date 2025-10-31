import "../styles/globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import SocketClient from "./SocketClient";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
        <SocketClient />
        <div className="flex min-h-screen">
          <aside className="hidden md:block w-64 border-r bg-white/80 backdrop-blur p-5">
            <div className="mb-6">
              <div className="text-xl font-semibold text-slate-900">Admin</div>
              <div className="text-xs text-slate-500">Control panel</div>
            </div>
            <nav className="space-y-1 text-sm">
              <Link
                href="/patients"
                className="block rounded-md px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                All patients
              </Link>
              <Link
                href="/my-patients?doctorId=seed"
                className="block rounded-md px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                My patients
              </Link>
              <Link
                href="/requests"
                className="block rounded-md px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              >
                Pending reschedules
              </Link>
            </nav>
          </aside>
          <main className="flex-1 p-6 md:p-10">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
