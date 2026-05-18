const STYLE_PROPERTIES = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "opacity",
  "fill-opacity",
  "stroke-opacity",
  "text-anchor",
  "dominant-baseline",
  "text-decoration",
  "display",
  "clip-path",
];

function inlineComputedStyles(original: SVGElement, clone: SVGElement): void {
  const origElements = original.querySelectorAll("*");
  const cloneElements = clone.querySelectorAll("*");

  for (let i = 0; i < origElements.length; i++) {
    const origEl = origElements[i] as Element;
    const cloneEl = cloneElements[i] as HTMLElement;
    if (!cloneEl?.style) continue;

    const computed = getComputedStyle(origEl);
    for (const prop of STYLE_PROPERTIES) {
      const val = computed.getPropertyValue(prop);
      if (val && val !== "none" && val !== "normal" && val !== "") {
        cloneEl.style.setProperty(prop, val);
      }
    }
  }
}

export function extractSvgString(container: HTMLElement): string | null {
  const svgs = container.querySelectorAll("svg");
  if (!svgs.length) return null;

  const primarySvg = svgs[0];
  if (!primarySvg) return null;
  const clone = primarySvg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  inlineComputedStyles(primarySvg, clone);

  for (let i = 1; i < svgs.length; i++) {
    const portalSvg = svgs[i];
    if (!portalSvg) continue;
    const portalClone = portalSvg.cloneNode(true) as SVGSVGElement;
    inlineComputedStyles(portalSvg, portalClone);

    const portalGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    while (portalClone.firstChild) {
      portalGroup.appendChild(portalClone.firstChild);
    }
    clone.appendChild(portalGroup);
  }

  clone.querySelectorAll("[data-cursor]").forEach((el) => el.remove());

  clone.setAttribute("overflow", "visible");
  clone.style.overflow = "visible";

  clone.style.removeProperty("width");
  clone.style.removeProperty("height");

  return new XMLSerializer().serializeToString(clone);
}

export function svgStringToBlob(svgString: string): Blob {
  return new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
}
