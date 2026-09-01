"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ExternalLink, Star, GitFork, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import type { RepoLite } from "@/types";

export function RepositoryTable({
  repositories,
  search,
  onSearchChange,
  page,
  perPage,
  onPerPageChange,
  total,
  totalPages,
  onPageChange,
}: {
  repositories: RepoLite[];
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  perPage: number;
  onPerPageChange: (v: number) => void;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Repositories</CardTitle>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Repository
                </th>
                <th className="pb-3 text-left text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Language
                </th>
                <th className="pb-3 text-right text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Stars
                </th>
                <th className="pb-3 text-right text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Forks
                </th>
                <th className="pb-3 text-right text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Issues
                </th>
                <th className="pb-3 text-right text-[11px] font-medium text-text-muted uppercase tracking-wider">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {repositories.map((repo) => (
                <tr
                  key={repo.id}
                  className="border-b border-border/50 hover:bg-surface-secondary/30 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/repositories/${repo.owner}/${repo.name}`}
                      className="group flex items-center gap-2"
                    >
                      <span className="font-medium text-text-primary group-hover:text-accent transition-colors">
                        {repo.full_name}
                      </span>
                      <ExternalLink
                        size={12}
                        className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </Link>
                    {repo.description && (
                      <p className="mt-0.5 text-xs text-text-muted truncate max-w-md">
                        {repo.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {repo.language && (
                      <Badge variant="secondary">{repo.language}</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="inline-flex items-center gap-1 text-text-secondary tabular-nums">
                      <Star size={12} className="text-text-muted" />
                      {repo.stars}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="inline-flex items-center gap-1 text-text-secondary tabular-nums">
                      <GitFork size={12} className="text-text-muted" />
                      {repo.forks}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="inline-flex items-center gap-1 text-text-secondary tabular-nums">
                      <AlertCircle size={12} className="text-text-muted" />
                      {repo.openIssues}
                    </span>
                  </td>
                  <td className="py-3 text-right text-xs text-text-muted">
                    {timeAgo(repo.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <p className="text-xs text-text-muted">
              {total.toLocaleString()} repos · Page {page} of {totalPages || 1}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted">Per page</span>
              <Select
                value={String(perPage)}
                onValueChange={(v) => onPerPageChange(Number(v))}
              >
                <SelectTrigger className="h-7 w-[72px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[12, 24, 48, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<number[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push(-1);
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === -1 ? (
                  <span key={`gap-${i}`} className="px-1 text-xs text-text-muted">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "secondary"}
                    size="icon-sm"
                    onClick={() => onPageChange(p)}
                    className={cn(p === page && "pointer-events-none")}
                  >
                    {p}
                  </Button>
                )
              )}
            <Button
              variant="secondary"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
