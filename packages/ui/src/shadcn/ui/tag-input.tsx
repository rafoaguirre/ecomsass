'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

export interface ShadcnTagInputProps {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export function ShadcnTagInput({
  id,
  name,
  defaultValue = '',
  placeholder = 'Type and press Enter…',
  className,
}: ShadcnTagInputProps) {
  const [tags, setTags] = React.useState<string[]>(() =>
    defaultValue
      ? defaultValue
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []
  );
  const [input, setInput] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-[--radius-md] border border-border bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-within:ring-2 focus-within:ring-brand-500/40',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input holds the comma-separated value for form submission */}
      <input type="hidden" name={name} value={tags.join(', ')} />

      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-brand-500 hover:bg-brand-200 hover:text-brand-800"
            aria-label={`Remove ${tag}`}
          >
            <svg
              className="h-2.5 w-2.5"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        id={id}
        type="text"
        className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted"
        placeholder={tags.length === 0 ? placeholder : 'Add more…'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addTag(input);
        }}
      />
    </div>
  );
}
