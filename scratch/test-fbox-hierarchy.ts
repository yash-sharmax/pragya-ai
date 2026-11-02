import katex from "katex";

const mathContent = `\\boxed{\\begin{aligned}x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt] x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),\\end{aligned}}\\qquad c_{1},c_{2}\\in\\mathbb R.`;

const html = katex.renderToString(mathContent, { displayMode: true, throwOnError: false });

// Let's print out the hierarchy around fbox
const fboxIdx = html.indexOf("fbox");
const start = Math.max(0, fboxIdx - 800);
const end = Math.min(html.length, fboxIdx + 400);
console.log(html.slice(start, end));
