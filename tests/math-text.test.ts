import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MathText } from "../src/components/math/MathText";

describe("MathText rendering & plain-text math fallback", () => {
  it("renders wrapped LaTeX formulas cleanly via KaTeX without raw backslashes or braces", () => {
    const html = renderToStaticMarkup(
      React.createElement(MathText, {
        text: "Rasio $r = \\dfrac{U_2}{U_1}$ dan faktor $1 \\pm p$, lalu $(0{,}9)^2 = 0{,}81$ serta $2^6 = 64$.",
      }),
    );

    const visibleHtml = html.replace(/<span class="katex-mathml">[\s\S]*?<\/span>/g, "");

    expect(html).toContain("katex");
    expect(html).not.toContain("katex-error");
    expect(visibleHtml).not.toContain("\\pm");
    expect(visibleHtml).not.toContain("\\dfrac");
    expect(visibleHtml).toContain("±");
  });

  it("formats stray plain-text superscripts, subscripts, and LaTeX operators safely while leaving snake_case untouched", () => {
    const html = renderToStaticMarkup(
      React.createElement(MathText, {
        text: "Cek 2^(6-1) dan (0,9)^2 serta U_2 / U_1, lalu 1 \\pm p dan snake_case_id tetap utuh.",
      }),
    );

    expect(html).toContain("2<sup>6-1</sup>");
    expect(html).toContain("(0,9)<sup>2</sup>");
    expect(html).toContain("U<sub>2</sub> / U<sub>1</sub>");
    expect(html).toContain("±");
    expect(html).not.toContain("\\pm");
    expect(html).toContain("snake_case_id");
  });
});
