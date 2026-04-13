"use client";

import { useState } from "react";
import { EmailList } from "@/components/email-list";
import { SearchBar } from "@/components/search-bar";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Search</h2>
        <div className="max-w-2xl">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Search by subject, sender, or content..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {searchQuery ? (
          <EmailList searchQuery={searchQuery} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <p className="text-lg font-medium">Search your emails</p>
              <p className="text-sm mt-1">
                Search by subject, sender, or email content
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
