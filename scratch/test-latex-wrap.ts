function autoWrapStandaloneMath(content: string): string {
  // Protect all code blocks (``` ... ```), inline code (`...`), and existing $$...$$ blocks
  const protectedSegments: string[] = [];
  const placeholderPrefix = "___MATH_PROTECTED_BLOCK_";

  // 1. Temporarily extract fenced code blocks, inline code spans, and existing $$...$$ blocks
  let masked = content.replace(
    /(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$)/g,
    (match) => {
      const idx = protectedSegments.length;
      protectedSegments.push(match);
      return `${placeholderPrefix}${idx}___`;
    }
  );

  // 2. Wrap standalone \boxed{...} blocks (which may contain \begin{aligned}...\end{aligned} and trailing terms)
  // Match \boxed{ ... } optionally followed by trailing math like \qquad ... until blank line or end
  masked = masked.replace(
    /(?:^|\n)(\\boxed\{[\s\S]*?\}(?:[^\n$]*?(?:\\qquad|\\[a-zA-Z]+|\s*c_|\s*x_)[^\n$]*)?)(?=\n|$)/g,
    (match, expr) => {
      return `\n$$\n${expr.trim()}\n$$\n`;
    }
  );

  // 3. Wrap standalone \begin{env} ... \end{env} blocks (aligned, gathered, matrix, pmatrix, bmatrix, equation)
  const envRegex = /(?:^|\n)(\\begin\{(?:aligned|gathered|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|equation|align\*?)\}[\s\S]*?\\end\{(?:aligned|gathered|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|equation|align\*?)\})(?=\n|$)/g;
  masked = masked.replace(envRegex, (match, expr) => {
    return `\n$$\n${expr.trim()}\n$$\n`;
  });

  // 4. Restore protected segments
  return masked.replace(new RegExp(`${placeholderPrefix}(\\d+)___`, "g"), (_, idx) => {
    return protectedSegments[parseInt(idx, 10)];
  });
}

// Test cases
const test1 = `Here is the solution:
\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.
where c1 and c2 are constants.`;

console.log("--- TEST 1 (Raw standalone boxed) ---");
console.log(autoWrapStandaloneMath(test1));

const test2 = `Here is already wrapped:
$$
\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.
$$
Done!`;

console.log("--- TEST 2 (Already wrapped with $$) ---");
console.log(autoWrapStandaloneMath(test2));

const test3 = `Here is code block:
\`\`\`latex
\\boxed{
\\begin{aligned}
x=1
\\end{aligned}}
\`\`\`
Code should be untouched!`;

console.log("--- TEST 3 (Code block) ---");
console.log(autoWrapStandaloneMath(test3));
