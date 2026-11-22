"use client";

import katex from "katex";
import React, { useMemo } from "react";

interface MathTextProps {
  text: string;
  className?: string;
}

type Segment =
  | { type: "text"; content: string }
  | { type: "inline-math"; content: string }
  | { type: "block-math"; content: string };

function normalizePlainText(raw: string): string {
  return raw
    .replaceAll(" -> ", " → ")
    .replaceAll("->", " → ")
    .replaceAll(" => ", " ⇒ ")
    .replaceAll(" <= ", " ≤ ")
    .replaceAll(" >= ", " ≥ ");
}

function normalizeLatexFormula(latex: string): string {
  // Replace cramped inline \frac with proportional \dfrac so fractions stay crisp and uniform
  return latex.replace(/\\frac(?=\{)/g, "\\dfrac");
}

function splitMathSegments(input: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: "text", content: input.slice(lastIdx, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "block-math", content: match[1].trim() });
    } else if (match[2] !== undefined) {
      const inner = match[2].trim();
      // If a math segment is purely \text{...} (like full Indonesian sentences), render in UI font!
      const pureTextMatch = inner.match(/^\\text\{([^{}]+)\}$/);
      if (pureTextMatch) {
        segments.push({ type: "text", content: pureTextMatch[1] });
      } else if (/^\\dots$/.test(inner)) {
        segments.push({ type: "text", content: "..." });
      } else {
        segments.push({ type: "inline-math", content: inner });
      }
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < input.length) {
    segments.push({ type: "text", content: input.slice(lastIdx) });
  }
  return segments;
}

function renderInlineFormatting(rawText: string, keyPrefix: string): React.ReactNode[] {
  const text = normalizePlainText(rawText);
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    parts.forEach((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        nodes.push(
          <strong key={`${keyPrefix}-${lineIdx}-${pIdx}`} className="font-extrabold">
            {part.slice(2, -2)}
          </strong>,
        );
      } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        nodes.push(
          <em key={`${keyPrefix}-${lineIdx}-${pIdx}`} className="italic">
            {part.slice(1, -1)}
          </em>,
        );
      } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        nodes.push(
          <code
            key={`${keyPrefix}-${lineIdx}-${pIdx}`}
            className="font-mono-telemetry text-[0.88em] px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--ink-primary)]"
          >
            {part.slice(1, -1)}
          </code>,
        );
      } else if (part) {
        nodes.push(<React.Fragment key={`${keyPrefix}-${lineIdx}-${pIdx}`}>{part}</React.Fragment>);
      }
    });
    if (lineIdx < lines.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${lineIdx}`} />);
    }
  });

  return nodes;
}

export function MathText({ text, className }: MathTextProps) {
  const segments = useMemo(() => splitMathSegments(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return (
            <React.Fragment key={idx}>
              {renderInlineFormatting(seg.content, `t-${idx}`)}
            </React.Fragment>
          );
        }
        try {
          const normalized = normalizeLatexFormula(seg.content);
          const html = katex.renderToString(normalized, {
            displayMode: seg.type === "block-math",
            throwOnError: true,
            strict: "ignore",
          });
          return seg.type === "block-math" ? (
            <span
              key={idx}
              className="katex-display block my-2.5 px-3 py-2 rounded-lg bg-[var(--surface-secondary)]"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <span
              key={idx}
              className="katex-inline-wrap"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code
              key={idx}
              className="font-mono-telemetry text-xs px-1.5 py-0.5 rounded bg-[var(--surface-secondary)]"
            >
              {seg.content}
            </code>
          );
        }
      })}
    </span>
  );
}
