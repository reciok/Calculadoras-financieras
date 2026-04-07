import { useEffect } from "react";

export default function SeoMeta({ title, description }) {
  useEffect(() => {
    document.title = title;

    const existing = document.querySelector("meta[name='description']");
    if (existing) {
      existing.setAttribute("content", description);
      return;
    }

    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", description);
    document.head.appendChild(meta);
  }, [title, description]);

  return null;
}
