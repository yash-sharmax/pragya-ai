import katex from "katex";
import { normalizeMarkdownMath } from "../src/components/MarkdownRenderer";

const latexInput = `
\\[
\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.
\\]
`;

console.log("=== ORIGINAL INPUT ===");
console.log(latexInput);

const normalized = normalizeMarkdownMath(latexInput);
console.log("=== NORMALIZED ===");
console.log(normalized);

// Also test when there are no outer \\[ \\] delimiters:
const rawInput = `
\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.
`;

console.log("=== RAW WITHOUT DELIMITERS ===");
console.log(normalizeMarkdownMath(rawInput));

// Render KaTeX directly on the inner expression
const mathContent = `\\boxed{\\begin{aligned}x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt] x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),\\end{aligned}}\\qquad c_{1},c_{2}\\in\\mathbb R.`;

const html = katex.renderToString(mathContent, { displayMode: true, throwOnError: false });
console.log("=== KATEX DIRECT RENDER SUCCESSFUL? ===");
console.log(html.includes("katex-error") ? "ERROR IN KATEX!" : "KATEX RENDERED OK!");
console.log("HTML length:", html.length);
