import { useState } from 'react';

interface Props {
  children: React.ReactNode;
  language?: string;
  title?: string;
}

export default function CodeBlock({ children, language, title }: Props) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    const code = document.querySelector('pre code')?.textContent;
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-t-xl border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {title}
          </span>
          {language && (
            <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              {language}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        {children}
        
        <button
          onClick={copyToClipboard}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800 p-2 rounded-lg text-xs font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300"
          aria-label="Copy code"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}