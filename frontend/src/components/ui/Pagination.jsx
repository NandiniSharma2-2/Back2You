import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = page - delta;
    const right = page + delta + 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        pages.push(i);
      }
    }

    const withEllipsis = [];
    let prev;
    for (const p of pages) {
      if (prev && p - prev > 1) withEllipsis.push('...');
      withEllipsis.push(p);
      prev = p;
    }
    return withEllipsis;
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!pagination.hasPrev}
        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {getPageNumbers().map((p, i) => (
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-white/20">•••</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
              p === page
                ? 'bg-gradient-to-r from-neon-cyan to-neon-pink text-black font-bold'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {p}
          </button>
        )
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!pagination.hasNext}
        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
