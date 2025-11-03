"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "An error occurred";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">{message}</p>
        </div>
        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}
