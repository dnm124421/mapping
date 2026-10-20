import Link from "next/link";
import { Route, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
        <Route className="w-6 h-6" />
      </div>

      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-line text-mute uppercase tracking-wider mb-2">
        404 • Page Not Found
      </span>

      <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
        This path doesn't exist on the roadmap
      </h1>

      <p className="text-xs text-ink2 max-w-md mb-6">
        The page you are looking for might have been moved, renamed, or is private to another account.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
