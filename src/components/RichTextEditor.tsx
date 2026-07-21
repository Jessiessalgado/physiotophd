import { useEffect, useRef, useState } from "react";

/**
 * Simple contenteditable rich text editor with a small toolbar.
 * Emits HTML string via onChange. No external deps.
 */
export function RichTextEditor({
  value,
  onChange,
  onUploadImage,
}: {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [source, setSource] = useState(false);
  const [html, setHtml] = useState(value);

  // Initialize once; do not overwrite while user is typing.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    setHtml(value || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    if (ref.current) {
      const v = ref.current.innerHTML;
      setHtml(v); onChange(v);
    }
  }
  function onInput() {
    if (!ref.current) return;
    const v = ref.current.innerHTML;
    setHtml(v); onChange(v);
  }
  function link() {
    const url = prompt("Link URL (https://...)");
    if (url) exec("createLink", url);
  }
  async function pickImage() {
    fileRef.current?.click();
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    let url: string;
    if (onUploadImage) url = await onUploadImage(f);
    else {
      const u = prompt("Image URL (upload not configured):");
      if (!u) return;
      url = u;
    }
    exec("insertImage", url);
  }

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "white" }}>
      <div style={tb}>
        <Btn onClick={() => exec("bold")} title="Bold"><b>B</b></Btn>
        <Btn onClick={() => exec("italic")} title="Italic"><i>I</i></Btn>
        <Btn onClick={() => exec("underline")} title="Underline"><u>U</u></Btn>
        <Sep />
        <Btn onClick={() => exec("formatBlock", "H2")} title="Heading 2">H2</Btn>
        <Btn onClick={() => exec("formatBlock", "H3")} title="Heading 3">H3</Btn>
        <Btn onClick={() => exec("formatBlock", "P")} title="Paragraph">¶</Btn>
        <Btn onClick={() => exec("formatBlock", "BLOCKQUOTE")} title="Quote">❝</Btn>
        <Sep />
        <Btn onClick={() => exec("insertUnorderedList")} title="Bulleted list">•</Btn>
        <Btn onClick={() => exec("insertOrderedList")} title="Numbered list">1.</Btn>
        <Sep />
        <Btn onClick={link} title="Insert link">🔗</Btn>
        <Btn onClick={pickImage} title="Insert image">🖼</Btn>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <Sep />
        <Btn onClick={() => exec("removeFormat")} title="Clear formatting">⌫</Btn>
        <div style={{ marginLeft: "auto" }}>
          <Btn onClick={() => { if (!source && ref.current) setHtml(ref.current.innerHTML); setSource((s) => !s); }} title="Toggle HTML source">
            {source ? "Visual" : "HTML"}
          </Btn>
        </div>
      </div>
      {source ? (
        <textarea
          value={html}
          onChange={(e) => { setHtml(e.target.value); onChange(e.target.value); if (ref.current) ref.current.innerHTML = e.target.value; }}
          style={{ width: "100%", minHeight: 320, border: 0, padding: 14, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          onInput={onInput}
          suppressContentEditableWarning
          style={{ minHeight: 320, padding: 16, outline: "none", fontSize: 15, lineHeight: 1.7, color: "#1e293b" }}
        />
      )}
    </div>
  );
}

const tb: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4, padding: 6,
  borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexWrap: "wrap",
};
function Btn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}
      style={{ minWidth: 30, height: 30, padding: "0 8px", border: "1px solid transparent", borderRadius: 6, background: "transparent", cursor: "pointer", fontSize: 14, color: "#334155" }}
      onMouseOver={(e) => (e.currentTarget.style.background = "#e2e8f0")}
      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
    >{children}</button>
  );
}
function Sep() { return <div style={{ width: 1, height: 20, background: "#e2e8f0", margin: "0 4px" }} />; }
