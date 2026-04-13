import Link from "next/link";
import { ThreadView } from "@/components/thread-view";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <Link
          href="/inbox"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>
        <h2 className="text-lg font-semibold text-gray-900">Thread</h2>
      </div>

      <div className="flex-1 overflow-auto">
        <ThreadView threadId={threadId} />
      </div>
    </div>
  );
}
