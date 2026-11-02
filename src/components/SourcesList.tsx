"use client";

import React from "react";
import { ExternalLink, Globe, BookOpen } from "lucide-react";
import { SourceItem } from "@/lib/sources/search";

interface SourcesListProps {
  sources?: SourceItem[] | null;
}

export function SourcesList({ sources }: SourcesListProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3.5 border-t border-amber-800/20 dark:border-amber-700/30 text-xs">
      <div className="flex items-center gap-2 font-semibold text-stone-800 dark:text-amber-200 mb-3">
        <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        <span className="tracking-wide">Archival Sources & References ({sources.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-3.5 rounded-xl border border-amber-300/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-[#1c1510] hover:bg-amber-100/60 dark:hover:bg-[#231b14] hover:border-amber-400 dark:hover:border-amber-700 transition-all text-left shadow-sm active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-stone-900 dark:text-amber-100 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors text-xs leading-snug break-words">
                  {source.title || "External Source"}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 dark:text-stone-400 dark:group-hover:text-amber-400 shrink-0 mt-0.5" />
              </div>

              {source.description && (
                <p className="text-[11px] text-stone-700 dark:text-stone-300 mt-1.5 leading-relaxed break-words">
                  {source.description}
                </p>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-900/40 flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 font-medium truncate">
                <Globe className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900 truncate max-w-[150px]">
                  {source.publisher || "Web Reference"}
                </span>
              </div>
              <span className="text-[9px] text-amber-700/80 dark:text-amber-400/80 font-mono group-hover:underline">
                View &rarr;
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
