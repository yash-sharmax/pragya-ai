import katex from "katex";

const mathContent = `\\boxed{\\begin{aligned}x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt] x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),\\end{aligned}}\\qquad c_{1},c_{2}\\in\\mathbb R.`;

const html = katex.renderToString(mathContent, { displayMode: true, throwOnError: false });

const mtableIdx = html.indexOf("mtable");
const mtableSlice = html.slice(mtableIdx, mtableIdx + 2000);
console.log(mtableSlice);
