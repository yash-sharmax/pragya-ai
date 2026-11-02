"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Copy, Check, Terminal, Sigma } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

/**
 * Normalizes LaTeX delimiters \( ... \) -> $...$ and \[ ... \] -> $$...$$
 * without modifying fenced code blocks (``` or ~~~) or inline code spans (`...`).
 * Also sanitizes stray literal <br> or <br/> tags into standard line breaks.
 */
export function normalizeMarkdownMath(content: string): string {
  if (!content) return "";

  // Sanitize stray raw <br> tags so they don't display as raw text
  let cleaned = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/br>/gi, "\n");

  const lines = cleaned.split("\n");
  const resultLines: string[] = [];
  let inFencedCode = false;
  let fenceChar = "";
  let fenceLength = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Check for fenced code block boundary: ``` or ~~~ (3 or more chars)
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const currentFenceChar = fenceMatch[1][0];
      const currentFenceLength = fenceMatch[1].length;

      if (!inFencedCode) {
        inFencedCode = true;
        fenceChar = currentFenceChar;
        fenceLength = currentFenceLength;
        resultLines.push(line);
        continue;
      } else if (currentFenceChar === fenceChar && currentFenceLength >= fenceLength) {
        inFencedCode = false;
        fenceChar = "";
        fenceLength = 0;
        resultLines.push(line);
        continue;
      }
    }

    if (inFencedCode) {
      resultLines.push(line);
    } else {
      resultLines.push(normalizeLineMath(line));
    }
  }

  const assembled = resultLines.join("\n");
  return normalizeMultilineBlockMath(assembled);
}

function normalizeLineMath(line: string): string {
  const parts: string[] = [];
  let lastIndex = 0;
  const inlineCodeRegex = /(`+)([\s\S]*?)\1/g;
  let match: RegExpExecArray | null;

  while ((match = inlineCodeRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = line.slice(lastIndex, match.index);
      parts.push(replaceSingleLineMath(textBefore));
    }
    parts.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(replaceSingleLineMath(line.slice(lastIndex)));
  }

  return parts.join("");
}

function replaceSingleLineMath(text: string): string {
  return text
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
}

function normalizeMultilineBlockMath(content: string): string {
  // Protect all code spans (inline backticks or fenced blocks) and tildes
  const blockRegex = /(`+[\s\S]*?`+|~{3,}[\s\S]*?~{3,})|\\\[([\s\S]*?)\\\]/g;
  const replaced = content.replace(blockRegex, (match, codeSpan, mathContent) => {
    if (codeSpan) {
      return match;
    }
    if (mathContent !== undefined) {
      return `$$${mathContent}$$`;
    }
    return match;
  });

  return wrapStandaloneMathBlocks(replaced);
}

/**
 * Detects standalone LaTeX environments (e.g. \begin{aligned}...\end{aligned},
 * \boxed{...}, etc.) that are outside of $$...$$, $...$, or code blocks, and wraps
 * them in $$...$$ so that remark-math/rehype-katex processes them cleanly into KaTeX.
 */
export function wrapStandaloneMathBlocks(content: string): string {
  // Protect all code blocks (``` ... ``` or ~~~ ... ~~~), inline code (`...`), existing $$...$$ blocks,
  // escaped dollars (\$...), and existing inline math ($...$)
  const protectedSegments: string[] = [];
  const placeholderPrefix = "___MATH_PROTECTED_BLOCK_";

  const maskRegex = /(```[\s\S]*?```|~{3,}[\s\S]*?~{3,}|`+[^`]+`+|\$\$[\s\S]*?\$\$|\\\$|(?<!\\)\$(?!\$)(?:\\\$|[^\$\n])+?(?<!\\)\$)/g;

  const masked = content.replace(maskRegex, (match) => {
    const idx = protectedSegments.length;
    protectedSegments.push(match);
    return `${placeholderPrefix}${idx}___`;
  });

  let result = "";
  let i = 0;

  while (i < masked.length) {
    // Check if starting a standalone \boxed{
    if (masked.startsWith("\\boxed{", i)) {
      let depth = 0;
      let j = i + 6;
      let foundEnd = -1;

      for (; j < masked.length; j++) {
        if (masked[j] === "{" && masked[j - 1] !== "\\") {
          depth++;
        } else if (masked[j] === "}" && masked[j - 1] !== "\\") {
          depth--;
          if (depth === 0) {
            foundEnd = j;
            break;
          }
        }
      }

      if (foundEnd !== -1) {
        let k = foundEnd + 1;
        const remainder = masked.slice(k);
        const trailingMath = remainder.match(/^(?:[ \t]*\n)?[ \t]*(?:\\qquad|\\quad|c_{1}|[a-zA-Z0-9_{},]+[ \t]*\\in[ \t]*\\[a-zA-Z]+|[=><+\\-][ \t]*[0-9a-zA-Z_\\-]+)[^\n]*/);
        if (trailingMath && trailingMath[0]) {
          k += trailingMath[0].length;
        }

        const fullExpr = masked.slice(i, k).trim();
        result += `\n$$\n${fullExpr}\n$$\n`;
        i = k;
        continue;
      }
    }

    // Check if starting a standalone \begin{env}
    const envMatch = masked.slice(i).match(/^\\begin\{(aligned|gathered|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|equation|align\*?)\}/);
    if (envMatch) {
      const envName = envMatch[1];
      const endTag = `\\end{${envName}}`;
      const endIdx = masked.indexOf(endTag, i);

      if (endIdx !== -1) {
        let k = endIdx + endTag.length;
        const remainder = masked.slice(k);
        const trailingMath = remainder.match(/^(?:[ \t]*\n)?[ \t]*(?:\\qquad|\\quad|c_{1}|[a-zA-Z0-9_{},]+[ \t]*\\in[ \t]*\\[a-zA-Z]+|[=><+\\-][ \t]*[0-9a-zA-Z_\\-]+)[^\n]*/);
        if (trailingMath && trailingMath[0]) {
          k += trailingMath[0].length;
        }

        const fullExpr = masked.slice(i, k).trim();
        result += `\n$$\n${fullExpr}\n$$\n`;
        i = k;
        continue;
      }
    }

    result += masked[i];
    i++;
  }

  // Restore protected segments
  return result.replace(new RegExp(`${placeholderPrefix}(\\d+)___`, "g"), (_, idx) => {
    return protectedSegments[parseInt(idx, 10)];
  });
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const formattedContent = normalizeMarkdownMath(content);

  return (
    <div className="prose-content min-w-0 break-words leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
              throwOnError: false,
              errorColor: "#b91c1c",
              strict: false,
            },
          ],
        ]}
        components={{
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3.5 rounded-xl border border-amber-800/30 dark:border-amber-700/30 bg-amber-50/40 dark:bg-stone-900/60 shadow-sm">
                <table className="min-w-full divide-y divide-amber-800/20 dark:divide-amber-700/20 text-xs">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-3.5 py-2.5 bg-amber-100/70 dark:bg-stone-850 font-semibold text-left text-amber-950 dark:text-amber-200 border-b border-amber-800/20 dark:border-amber-700/20">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3.5 py-2 border-t border-amber-800/15 dark:border-amber-700/15 text-stone-800 dark:text-stone-200">
                {children}
              </td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 dark:text-amber-400 font-medium underline underline-offset-2 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
              >
                {children}
              </a>
            );
          },
          p({ children }) {
            return <p className="leading-relaxed my-2 text-stone-900 dark:text-[#f3ede2]">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc ml-5 my-2.5 space-y-1 text-stone-900 dark:text-[#f3ede2]">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal ml-5 my-2.5 space-y-1 text-stone-900 dark:text-[#f3ede2]">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          h1({ children }) {
            return (
              <h1 className="text-lg sm:text-xl font-bold mt-4 mb-2 text-stone-950 dark:text-amber-100 tracking-tight">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-base sm:text-lg font-bold mt-3.5 mb-2 text-stone-950 dark:text-amber-100 tracking-tight">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm sm:text-base font-semibold mt-3 mb-1.5 text-stone-900 dark:text-amber-200">
                {children}
              </h3>
            );
          },
          h4({ children }) {
            return (
              <h4 className="text-xs sm:text-sm font-semibold mt-2.5 mb-1 text-stone-900 dark:text-amber-200">
                {children}
              </h4>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-amber-600 dark:border-amber-500 pl-3.5 py-1 my-3 bg-amber-50/60 dark:bg-amber-950/20 text-stone-700 dark:text-stone-300 italic rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-4 border-amber-800/25 dark:border-amber-700/30" />;
          },
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline) {
              return <CodeBlock language={match ? match[1] : ""} code={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-amber-100/70 dark:bg-stone-850 text-amber-800 dark:text-amber-300 font-mono text-xs border border-amber-300/40 dark:border-amber-800/40"
                {...props}
              >
                {children}
              </code>
            );
          },
          span({ node, className, children, ...props }: any) {
            if (className?.includes("katex-display")) {
              return <DisplayMathBlock className={className} props={props}>{children}</DisplayMathBlock>;
            }
            return (
              <span className={className} {...props}>
                {children}
              </span>
            );
          },
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}

function DisplayMathBlock({ className, props, children }: { className?: string; props: any; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopyMath = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Extract raw LaTeX from inner annotation tag or text content
    const element = e.currentTarget.closest(".math-display-container");
    const annotation = element?.querySelector("annotation[encoding='application/x-tex']");
    const rawLatex = annotation?.textContent || element?.textContent || "";

    if (rawLatex) {
      navigator.clipboard.writeText(rawLatex.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="math-display-container group relative my-3 p-3 rounded-xl manuscript-math-surface overflow-x-auto shadow-sm">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={handleCopyMath}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 dark:bg-stone-850 border border-amber-300/60 dark:border-amber-800/60 text-[10px] font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100/80 shadow-sm cursor-pointer transition-colors"
          title="Copy LaTeX formula"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Sigma className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Copy LaTeX</span>
            </>
          )}
        </button>
      </div>
      <div className={`overflow-x-auto ${className || ""}`} {...props}>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden manuscript-code-surface text-slate-100 text-xs shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1a140f] border-b border-amber-900/30 text-amber-200/70 text-[11px]">
        <div className="flex items-center gap-1.5 font-mono">
          <Terminal className="w-3.5 h-3.5 text-amber-500" />
          <span>{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono leading-relaxed bg-[#120e0b] text-[#f1ede4]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
