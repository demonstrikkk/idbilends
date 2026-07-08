"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const components: Components = {
  h3: ({ children, ...props }) => (
    <h3 className="mb-3 mt-6 text-base font-bold text-ink first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mb-2 mt-4 text-sm font-semibold text-ink" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-3 leading-6 text-ink last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-3 space-y-1.5 last:mb-0" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="flex items-start gap-2 text-sm leading-6 text-ink" {...props}>
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-line" />
      <span>{children}</span>
    </li>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="rounded border border-line bg-subtle px-1 py-0.5 font-mono text-[11px] text-navy" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="mb-3 overflow-x-auto rounded-md border border-line bg-ink p-4 text-sm leading-6 text-white/80 last:mb-0">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    );
  },
  blockquote: ({ children, ...props }) => (
    <blockquote className="mb-3 border-l-2 border-amber pl-4 italic text-muted last:mb-0" {...props}>
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="min-w-[400px] divide-y divide-line text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="bg-subtle px-3 py-2 text-left text-xs font-semibold uppercase text-muted" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-line px-3 py-2 text-sm text-ink" {...props}>
      {children}
    </td>
  ),
  a: ({ children, href, ...props }) => {
    if (href && (href.startsWith("http") || href.startsWith("//"))) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-navy underline hover:text-ink" {...props}>
          {children}
        </a>
      );
    }
    return (
      <a href={href} className="text-navy underline hover:text-ink" {...props}>
        {children}
      </a>
    );
  },
  hr: (props) => <hr className="my-4 border-line" {...props} />,
};

export function CopilotMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-copilot">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
