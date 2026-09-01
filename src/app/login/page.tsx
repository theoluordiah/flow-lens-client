"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getGitHubLoginUrl } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleGitHubLogin = async () => {
    setConnecting(true);
    try {
      const url = await getGitHubLoginUrl();
      window.location.href = url;
    } catch {
      setConnecting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-8">
        {/* Logo */}
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-text-primary tracking-tight uppercase">
            FlowLens
          </h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-text-primary tracking-tight">
              Understand how you code.
              <br />
              Improve how you build.
            </h2>
            <p className="text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
              Turn your GitHub activity into developer growth insights.
            </p>
          </div>
        </div>

        {/* GitHub Login */}
        <div className="space-y-4">
          <Button
            size="lg"
            onClick={handleGitHubLogin}
            disabled={connecting}
            className="w-full h-11 text-sm font-medium"
          >
            <GithubIcon width={18} height={18} />
            {connecting ? "Connecting..." : "Continue with GitHub"}
            {!connecting && <ArrowRight size={16} />}
          </Button>

          <div className="flex items-center gap-2 justify-center text-[11px] text-text-muted">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            Private by design
          </div>
        </div>

        {/* Subtle decorative element */}
        <div className="pt-8">
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </div>
    </div>
  );
}