"use client";

import { signIn } from "next-auth/react";
import { Providers } from "@/components/providers";
import Image from "next/image";

function LoginContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Top banner */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 pt-10 pb-8 text-center relative">

            {/* Decorative circles */}
            <div className="absolute top-4 left-6 w-12 h-12 rounded-full bg-white opacity-10" />
            <div className="absolute bottom-4 right-8 w-20 h-20 rounded-full bg-white opacity-10" />
            <div className="absolute top-8 right-12 w-6 h-6 rounded-full bg-white opacity-10" />

            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center p-2 ring-4 ring-white ring-opacity-30">
                <Image
                  src="/charity-logo.webp"
                  alt="Dr Nageen Sulehri Gynecology Clinic"
                  width={88}
                  height={88}
                  className="object-contain rounded-full"
                />
              </div>
            </div>

            <p className="text-pink-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Women's Health & Wellness
            </p>
            <h1 className="text-2xl font-bold text-white leading-snug">
              Dr. Nageen Sulehri
            </h1>
            <p className="text-pink-100 text-sm mt-1 font-medium">
              MBBS · FCPS Obstetrics & Gynaecology
            </p>

            {/* Free consultation badge */}
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mt-4">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              Free Consultation Available
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-7">

            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Book Your Free Consultation
              </h2>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Connect your Google account to schedule a confidential consultation
                with Dr. Nageen Sulehri at no cost. Your health is our priority.
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-3 mb-7">
              <div className="flex flex-col items-center text-center p-3 bg-pink-50 rounded-2xl">
                <span className="text-2xl mb-1">🩺</span>
                <p className="text-xs font-semibold text-gray-700">Expert Care</p>
                <p className="text-xs text-gray-400 mt-0.5">15+ years experience</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-purple-50 rounded-2xl">
                <span className="text-2xl mb-1">🔒</span>
                <p className="text-xs font-semibold text-gray-700">Confidential</p>
                <p className="text-xs text-gray-400 mt-0.5">100% private & secure</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-rose-50 rounded-2xl">
                <span className="text-2xl mb-1">💊</span>
                <p className="text-xs font-semibold text-gray-700">Free Visit</p>
                <p className="text-xs text-gray-400 mt-0.5">No charges at all</p>
              </div>
            </div>

            {/* Specialities */}
            <div className="mb-7">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Prenatal Care",
                  "Women's Wellness",
                  "Hormonal Health",
                  "Fertility",
                  "Gynecological Exams",
                  "PCOS & Endometriosis",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 uppercase tracking-widest">Book Now</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Button */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-semibold shadow-md hover:shadow-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google to Book
            </button>

            {/* Footer note */}
            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              Your information is kept strictly confidential and used only to
              schedule your appointment with Dr. Nageen Sulehri.
            </p>
          </div>

        </div>

        {/* Bottom tagline */}
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
      <LoginContent />
    </Providers>
  );
}
