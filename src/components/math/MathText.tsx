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
    .replaceAll(" >= ", " ≥ ")
    .replace(/(?<![A-Za-z])\\pm(?![A-Za-z])/g, "±")
    .replace(/(?<![A-Za-z])\\times(?![A-Za-z])/g, "×")
    .replace(/(?<![A-Za-z])\\cdot(?![A-Za-z])/g, "·")
    .replace(/(?<![A-Za-z])\\leq?(?![A-Za-z])/g, "≤")
    .replace(/(?<![A-Za-z])\\geq?(?![A-Za-z])/g, "≥")
    .replace(/(?<![A-Za-z])\\neq?(?![A-Za-z])/g, "≠");
}

function normalizeLatexFormula(latex: string): string {
  // Replace cramped inline \frac with proportional \dfrac so fractions stay crisp and uniform
  return latex.replace(/\\frac(?=\{)/g, "\\dfrac");
}

export function splitMathSegments(input: string): Segment[] {
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

const PLAIN_MATH_SCRIPT_REGEX =
  /((?<![A-Za-z0-9_])([A-Za-z])_(\{[^{}]+\}|\d+|n-1|n|k)(?![A-Za-z0-9_])|([A-Za-z0-9)\]])\^(\([^()]+\)|\{[^{}]+\}|-?\d+|[A-Za-z]))/g;

function renderPlainMathScripts(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  const regex = new RegExp(PLAIN_MATH_SCRIPT_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(<React.Fragment key={`${keyPrefix}-p-${lastIdx}`}>{text.slice(lastIdx, match.index)}</React.Fragment>);
    }
    if (match[2] !== undefined && match[3] !== undefined) {
      const base = match[2];
      const sub = match[3].replace(/^\{|\}$/g, "");
      nodes.push(
        <React.Fragment key={`${keyPrefix}-sub-${match.index}`}>
          {base}
          <sub>{sub}</sub>
        </React.Fragment>,
      );
    } else if (match[4] !== undefined && match[5] !== undefined) {
      const base = match[4];
      const rawSup = match[5];
      const sup =
        (rawSup.startsWith("(") && rawSup.endsWith(")")) || (rawSup.startsWith("{") && rawSup.endsWith("}"))
          ? rawSup.slice(1, -1)
          : rawSup;
      nodes.push(
        <React.Fragment key={`${keyPrefix}-sup-${match.index}`}>
          {base}
          <sup>{sup}</sup>
        </React.Fragment>,
      );
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    nodes.push(<React.Fragment key={`${keyPrefix}-tail`}>{text.slice(lastIdx)}</React.Fragment>);
  }
  return nodes;
}

function renderInlineFormatting(rawText: string, keyPrefix: string): React.ReactNode[] {
  const text = normalizePlainText(rawText);
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*\n]+\*\*|\*(?!\s)[^*\n]+(?<!\s)\*|`[^`\n]+`)/g);
    parts.forEach((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        nodes.push(
          <strong key={`${keyPrefix}-${lineIdx}-${pIdx}`} className="font-extrabold">
            {renderPlainMathScripts(part.slice(2, -2), `${keyPrefix}-${lineIdx}-${pIdx}-b`)}
          </strong>,
        );
      } else if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        nodes.push(
          <em key={`${keyPrefix}-${lineIdx}-${pIdx}`} className="italic">
            {renderPlainMathScripts(part.slice(1, -1), `${keyPrefix}-${lineIdx}-${pIdx}-i`)}
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
        nodes.push(
          <React.Fragment key={`${keyPrefix}-${lineIdx}-${pIdx}`}>
            {renderPlainMathScripts(part, `${keyPrefix}-${lineIdx}-${pIdx}`)}
          </React.Fragment>,
        );
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
