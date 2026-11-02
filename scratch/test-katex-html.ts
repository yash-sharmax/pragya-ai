import katex from "katex";

const mathContent = `\\boxed{\\begin{aligned}x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt] x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),\\end{aligned}}\\qquad c_{1},c_{2}\\in\\mathbb R.`;

const html = katex.renderToString(mathContent, { displayMode: true, throwOnError: false });

// Let's search for fbox, line, vertical, etc.
console.log("Has fbox:", html.includes("fbox"));
console.log("Has vertical-separator:", html.includes("vertical-separator"));

// Print all class names in the rendered HTML
const classMatches = html.match(/class="([^"]+)"/g) || [];
const uniqueClasses = Array.from(new Set(classMatches.map(c => c.replace('class="', '').replace('"', ''))));
console.log("Classes:", uniqueClasses);

// Let's find spans that have fbox or border or vertical lines
const lines = html.split("<span");
for (const l of lines) {
  if (l.includes("fbox") || l.includes("border") || l.includes("separator") || l.includes("vertical")) {
    console.log("Found relevant span:", ("<span" + l).slice(0, 200));
  }
}
