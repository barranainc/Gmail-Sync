"use client";

import { signIn } from "next-auth/react";
import { Providers } from "@/components/providers";
import Image from "next/image";

function LoginContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Top banner */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 px-8 pt-10 pb-6 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center p-2">
                <Image
                  src="/charity-logo.webp"
                  alt="Orphan Care Initiative"
                  width={100}
                  height={100}
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white leading-snug">
              Orphan Care Initiative
            </h1>
            <p className="text-green-100 text-sm mt-1">
              Video Contest for the Orphans Charity
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">

            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Be Part of Something Meaningful
              </h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Join us in making a difference in the lives of orphaned children.
                Every contribution brings hope, warmth, and a brighter future.
              </p>
            </div>

            {/* 3 value props */}
            <div className="space-y-3 mb-7">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-lg mt-0.5">💚</span>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Care & Compassion</span> — Support children who need love and shelter
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-lg mt-0.5">🌟</span>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Your Voice Matters</span> — Participate in a video contest that raises awareness
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-500 text-lg mt-0.5">🤝</span>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Together We Impact</span> — Join a community committed to real change
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 uppercase tracking-widest">Next Step</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Button */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-green-400 hover:shadow-md transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect with Google
            </button>

            {/* Footer */}
            <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
              By connecting, you are joining a great cause that will make a real
              difference in the lives of orphaned children.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Providers>
      <LoginContent />
    </Providers>
  );
}
