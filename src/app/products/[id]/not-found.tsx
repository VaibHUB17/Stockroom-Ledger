import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { IconArrowLeft } from "../../../components/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="max-w-md space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--muted-ink)]">
            Error 404
          </span>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">
            Product not found
          </h1>
          <p className="text-sm text-[var(--muted-ink)]">
            The requested product could not be located in the inventory ledger. It may have been removed or the ID is invalid.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded bg-[var(--accent)] text-[var(--surface)] hover:bg-[var(--accent-hover)] transition-colors"
            >
              <IconArrowLeft className="w-4 h-4" />
              <span>Return to inventory</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
