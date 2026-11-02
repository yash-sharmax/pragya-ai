import React from "react";
import ReactDOMServer from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { normalizeMarkdownMath } from "../src/components/MarkdownRenderer";

const rawExpr = `$$
\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.
$$`;

const norm = normalizeMarkdownMath(rawExpr);
const html = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [[rehypeKatex, { throwOnError: false }]],
    children: norm,
  })
);

const fboxPos = html.indexOf("fbox");
// print 500 characters before and after
console.log(html.slice(fboxPos - 600, fboxPos + 300));
