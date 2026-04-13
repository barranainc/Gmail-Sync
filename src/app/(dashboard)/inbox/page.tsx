"use client";

import { useState } from "react";
import { SyncStatusBanner } from "@/components/sync-status-banner";
import { EmailList } from "@/components/email-list";
import { SearchBar } from "@/components/search-bar";

export default function InboxPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="px-4 py-3 flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
          <div className="flex-1 max-w-md">
            <SearchBar onSearch={setSearchQuery} />
          </div>
        </div>
        <SyncStatusBanner />
      </div>

      <div className="flex-1 overflow-auto">
        <EmailList searchQuery={searchQuery} />
      </div>
    </div>
  );
}
