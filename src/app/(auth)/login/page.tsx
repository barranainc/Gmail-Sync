"use client";

import { signIn } from "next-auth/react";
import { Providers } from "@/components/providers";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const missingPermission = searchParams.get("error") === "missing_gmail_permission";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-sm w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Top banner */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 pt-8 pb-8 text-center relative">
            <div className="absolute top-4 left-6 w-12 h-12 rounded-full bg-white opacity-10" />
            <div className="absolute bottom-4 right-8 w-16 h-16 rounded-full bg-white opacity-10" />

            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center p-1.5 ring-4 ring-white ring-opacity-30">
                <Image
                  src="/charity-logo.webp"
                  alt="Dr Nageen Sulehri"
                  width={76}
                  height={76}
                  className="object-contain rounded-full"
                />
              </div>
            </div>

            <p className="text-pink-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Women's Health & Wellness
            </p>
            <h1 className="text-2xl font-bold text-white">Dr. Nageen Sulehri</h1>
            <p className="text-pink-100 text-sm mt-1">MBBS · FCPS Obstetrics & Gynaecology</p>
            <p className="text-white text-sm font-semibold mt-2 bg-white bg-opacity-20 rounded-full px-4 py-1 inline-block">
              Free Consultation Available
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-6">

            {/* Error banner — only shown if permissions were skipped */}
            {missingPermission && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <span className="text-red-500 flex-shrink-0">⚠️</span>
                <p className="text-xs text-red-600">
                  You skipped required permissions. Please try again and click <strong>"Allow"</strong> on every screen.
                </p>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <p className="text-sm text-gray-700">Click <strong>Connect with Google</strong> below</p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="w-6 h-6 rounded-full bg-pink-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                <p className="text-sm text-gray-700">Press <strong>Continue</strong> on the next screen</p>
              </div>
              <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-200">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                <p className="text-sm text-amber-800">Click <strong>Allow All</strong> then <strong>Continue</strong> ✓</p>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
              className="cursor-pointer w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-semibold shadow-md hover:shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect with Google
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Your information is kept strictly confidential
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Caring for women's health with compassion & expertise
        </p>
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
