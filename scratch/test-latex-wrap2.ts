function wrapStandaloneMathBlocks(content: string): string {
  // Protect all code blocks (``` ... ```), inline code (`...`), and existing $$...$$ blocks
  const protectedSegments: string[] = [];
  const placeholderPrefix = "___MATH_PROTECTED_BLOCK_";

  let masked = content.replace(
    /(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$)/g,
    (match) => {
      const idx = protectedSegments.length;
      protectedSegments.push(match);
      return `${placeholderPrefix}${idx}___`;
    }
  );

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
        // Check if on same line or immediate next line there is trailing math like \qquad ...
        const remainder = masked.slice(k);
        const trailingMath = remainder.match(/^(?:[ \t]*\n)?[ \t]*(?:\\qquad|\\quad|c_{1}|[a-zA-Z0-9_{},]+[ \t]*\\in[ \t]*\\[a-zA-Z]+)[^\n]*/);
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
        const trailingMath = remainder.match(/^(?:[ \t]*\n)?[ \t]*(?:\\qquad|\\quad|c_{1}|[a-zA-Z0-9_{},]+[ \t]*\\in[ \t]*\\[a-zA-Z]+)[^\n]*/);
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

const test1 = `Here is the solution:
\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.
where c1 and c2 are constants.`;

console.log(wrapStandaloneMathBlocks(test1));
