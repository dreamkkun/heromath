import katex from "katex";

/** `$...$`(인라인) / `$$...$$`(블록) 구간만 KaTeX로 렌더링하고 나머지는 일반 텍스트로 둔다. */
const MATH_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
/** 모델이 강조할 때 쓰는 `**굵게**`만 지원한다 */
const BOLD_PATTERN = /(\*\*[^*\n]+?\*\*)/g;

function PlainText({ text }: { text: string }) {
  return text.split(BOLD_PATTERN).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i} className="font-bold text-[var(--hero)]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function MathText({ text }: { text: string }) {
  const parts = text.split(MATH_PATTERN);

  return (
    <>
      {parts.map((part, i) => {
        const isBlock = part.startsWith("$$") && part.endsWith("$$") && part.length > 4;
        const isInline = !isBlock && part.startsWith("$") && part.endsWith("$") && part.length > 2;
        if (!isBlock && !isInline) {
          return <PlainText key={i} text={part} />;
        }
        const tex = isBlock ? part.slice(2, -2) : part.slice(1, -1);
        const html = katex.renderToString(tex, { displayMode: isBlock, throwOnError: false });
        return isBlock ? (
          <div key={i} className="my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </>
  );
}
