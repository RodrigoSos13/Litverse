import { createElement, useMemo } from "react";

const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li"]);
const discardedTags = new Set(["script", "style", "iframe", "object", "template", "svg", "math"]);

// Build React text elements only: source attributes and executable HTML are never rendered.
export default function BookDescription({ text }) {
  const content = useMemo(() => {
    const document = new DOMParser().parseFromString(text, "text/html");
    function render(node, key) {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1 || discardedTags.has(node.localName)) return null;
      const children = Array.from(node.childNodes, (child, index) => render(child, index));
      if (!allowedTags.has(node.localName)) return children;
      return createElement(node.localName, { key }, ...(node.localName === "br" ? [] : children));
    }
    return Array.from(document.body.childNodes, (node, index) => render(node, index));
  }, [text]);

  return <div className="book-description-formatted">{content}</div>;
}
