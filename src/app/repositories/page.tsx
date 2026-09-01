"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { useRepositories } from "@/hooks/use-repositories";
import { RepositoryTable } from "@/components/repositories/repository-table";
import { RepositoryTableSkeleton } from "@/components/ui/loading-skeletons";
import { ErrorState, EmptyState } from "@/components/ui/empty-states";
import { FolderGit2 } from "lucide-react";

export default function RepositoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, loading, error, fetchRepositories } = useRepositories();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user) fetchRepositories(page, perPage, debouncedSearch);
  }, [user, page, perPage, debouncedSearch, fetchRepositories]);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handlePerPageChange = useCallback((v: number) => {
    setPerPage(v);
    setPage(1);
  }, []);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <AppShell title="Repositories">
      {loading ? (
        <RepositoryTableSkeleton />
      ) : error ? (
        <ErrorState
          title="Unable to load repositories"
          description="Something went wrong while fetching your repositories."
          onRetry={() => fetchRepositories(page, perPage, debouncedSearch)}
        />
      ) : data && data.repos.length === 0 ? (
        <EmptyState
          title="No repositories found"
          description={debouncedSearch ? "Try another search." : "Connect GitHub to see your repositories."}
          icon={<FolderGit2 size={20} />}
        />
      ) : data ? (
        <RepositoryTable
          repositories={data.repos}
          search={search}
          onSearchChange={handleSearchChange}
          page={data.pagination.page}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          total={data.pagination.total}
          totalPages={Math.max(
            1,
            Math.ceil(data.pagination.total / data.pagination.perPage)
          )}
          onPageChange={setPage}
        />
      ) : null}
    </AppShell>
  );
}
