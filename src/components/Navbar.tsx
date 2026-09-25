"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, clearSession } from "../lib/auth-storage";
import { AuthUser } from "../lib/types";
import { IconLogout } from "./icons";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <header className="border-b border-[var(--hairline)] bg-[var(--surface)] sticky top-0 z-30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/products"
          className="flex items-center gap-2 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded py-1 px-1 shrink-0"
        >
          <span className="w-2.5 h-2.5 bg-[var(--accent)] rounded-sm shrink-0" aria-hidden="true" />
          <span className="font-semibold tracking-tight text-base sm:text-lg whitespace-nowrap">
            Stockroom Ledger
          </span>
          <span className="hidden xs:inline text-[10px] sm:text-xs uppercase tracking-wider text-[var(--muted-ink)] font-mono px-1.5 py-0.5 rounded border border-[var(--hairline)]">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {user && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted-ink)]">
              <span className="hidden sm:inline font-mono text-xs">
                {user.username}
              </span>
              <span className="hidden sm:inline text-[var(--hairline-strong)]">|</span>
              <span className="hidden md:inline font-medium text-[var(--ink)]">
                {user.firstName} {user.lastName}
              </span>
            </div>
          )}

          <button
            id="logout-button"
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--muted-ink)] hover:text-[var(--danger)] px-2.5 py-1.5 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            title="Log out of session"
          >
            <IconLogout className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
