import React from "react";
import ReactDOMServer from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { normalizeMarkdownMath } from "../src/components/MarkdownRenderer";

const rawExpr = `\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.`;

console.log("--- CASE 1: Raw expression without outer delimiters ---");
const norm1 = normalizeMarkdownMath(rawExpr);
console.log("Normalized 1:\n", norm1);
const html1 = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [[rehypeKatex, { throwOnError: false }]],
    children: norm1,
  })
);
console.log("HTML 1 length:", html1.length);
console.log("HTML 1 has katex:", html1.includes("katex"));
console.log("HTML 1 snippet:", html1.slice(0, 300));

console.log("\n--- CASE 2: Expression with $$ delimiters ---");
const mathWrapped = `$$
${rawExpr}
$$`;
const norm2 = normalizeMarkdownMath(mathWrapped);
const html2 = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [[rehypeKatex, { throwOnError: false }]],
    children: norm2,
  })
);
console.log("HTML 2 length:", html2.length);
console.log("HTML 2 has katex:", html2.includes("katex"));
