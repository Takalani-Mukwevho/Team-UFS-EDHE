import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <SearchX size={22} className="text-slate-400" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-slate-900">
                Page not found
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                The page you're looking for doesn't exist.
            </p>
            <Link
                to="/"
                className="mt-6 rounded-lg bg-absa-red px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-absa-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-absa-red/40 focus-visible:ring-offset-2"
            >
                Back to dashboard
            </Link>
        </div>
    );
}