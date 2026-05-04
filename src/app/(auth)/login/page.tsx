"use client";

import { signIn } from "next-auth/react";
import { Providers } from "@/components/providers";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const missingPermission = searchParams.get("error") === "missing_gmail_permission";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm mx-4 space-y-4">

        {missingPermission && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="text-red-500 flex-shrink-0">⚠️</span>
            <p className="text-sm text-red-600">
              You skipped required permissions. Please try again and click <strong>"Allow"</strong> on every screen.
            </p>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="w-7 h-7 rounded-full bg-gray-800 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
            <p className="text-sm text-gray-700">Click <strong>Connect with Google</strong> below</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="w-7 h-7 rounded-full bg-gray-800 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
            <p className="text-sm text-gray-700">Press <strong>Continue</strong> on the next screen</p>
          </div>
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="w-7 h-7 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">3</span>
            <p className="text-sm text-amber-800">Click <strong>Allow All</strong> then <strong>Continue</strong> ✓</p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
          className="cursor-pointer w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-semibold shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect with Google
        </button>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Providers>
      <Suspense fallback={null}>
        <LoginContent />
      </Suspense>
    </Providers>
  );
}
