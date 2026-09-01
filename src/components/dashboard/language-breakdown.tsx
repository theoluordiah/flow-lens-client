"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const languageColors: Record<string, string> = {
  JavaScript: "#F7DF1E",
  TypeScript: "#3178C6",
  Python: "#3572A5",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Shell: "#89E051",
  Vue: "#41B883",
  SCSS: "#C6538C",
  Lua: "#000080",
  R: "#198CE7",
};

function getColor(lang: string): string {
  return languageColors[lang] || "#71717A";
}

export function LanguageBreakdown({ languages }: { languages: Record<string, number> }) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Languages</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-text-muted">No language data available.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map(([lang, bytes]) => {
              const pct = total > 0 ? Math.round((bytes / total) * 100) : 0;
              return (
                <div key={lang} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getColor(lang) }}
                      />
                      <span className="text-xs text-text-secondary">{lang}</span>
                    </div>
                    <span className="text-xs font-medium text-text-primary tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getColor(lang),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
