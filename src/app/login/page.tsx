"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../../lib/api/auth";
import { setSession } from "../../lib/auth-storage";
import { useSubmitGuard } from "../../hooks/useSubmitGuard";
import { AppError } from "../../lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { isSubmitting, execute } = useSubmitGuard();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    await execute(async () => {
      try {
        const user = await login({ username: username.trim(), password });
        setSession(user);
        router.push("/products");
      } catch (err: unknown) {
        const appError = err as AppError;
        setErrorMessage(
          appError.message || "Invalid username or password. Check your details and retry."
        );
      }
    });
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Wordmark and Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-[var(--ink)]">
            <span className="w-3 h-3 bg-[var(--accent)] rounded-sm" aria-hidden="true" />
            <span className="font-semibold tracking-tight text-xl">Stockroom Ledger</span>
          </div>
          <p className="text-xs text-[var(--muted-ink)] font-mono uppercase tracking-wider">
            Inventory catalogue administration
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-lg p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Inline Error Notice */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 text-xs rounded bg-[var(--danger-tint)] border border-[var(--danger)]/30 text-[var(--danger)]"
              >
                {errorMessage}
              </div>
            )}

            {/* Username Input */}
            <div>
              <label
                htmlFor="username-input"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1"
              >
                Username
              </label>
              <input
                id="username-input"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                placeholder="Enter username"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-mono uppercase tracking-wider text-[var(--muted-ink)] mb-1"
              >
                Password
              </label>
              <input
                id="password-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-base sm:text-sm px-3 py-2 rounded border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors"
                placeholder="Enter password"
              />
            </div>

            {/* Submit Button */}
            <button
              id="login-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded text-sm font-medium bg-[var(--accent)] text-[var(--surface)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 transition-colors duration-150"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Credentials helper note with one-click fill button */}
          <div className="pt-3 border-t border-[var(--hairline)] flex flex-col items-center gap-2 text-center text-xs text-[var(--muted-ink)] font-mono">
            <div>
              Demo: <span className="text-[var(--ink)]">emilys</span> / <span className="text-[var(--ink)]">emilyspass</span>
            </div>
            <button
              id="fill-demo-credentials"
              type="button"
              onClick={() => {
                setUsername("emilys");
                setPassword("emilyspass");
                setErrorMessage(null);
              }}
              className="px-3 py-1.5 rounded text-xs font-sans font-medium border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-colors cursor-pointer"
            >
              Fill demo credentials
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
