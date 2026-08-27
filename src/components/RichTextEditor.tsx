import { useEffect, useRef, useState } from "react";

/**
 * Contenteditable rich text editor with an extended toolbar.
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
  const lastEmitted = useRef<string>("");
  const savedRange = useRef<Range | null>(null);
  const [source, setSource] = useState(false);
  const [html, setHtml] = useState(value);

  // Keep the editor in sync when the value changes from outside
  // (e.g. the post finishes loading), but never while the user is typing.
  useEffect(() => {
    const v = value || "";
    if (v === lastEmitted.current) return;
    setHtml(v);
    if (ref.current && ref.current.innerHTML !== v) ref.current.innerHTML = v;
  }, [value]);

  function emit() {
    if (!ref.current) return;
    const v = ref.current.innerHTML;
    lastEmitted.current = v;
    setHtml(v);
    onChange(v);
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }
  function restoreSelection() {
    const r = savedRange.current;
    if (!r) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    restoreSelection();
    document.execCommand(cmd, false, arg);
    emit();
  }

  function link() {
    saveSelection();
    const url = prompt("URL do link (https://...)");
    if (url) exec("createLink", url);
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    let url: string;
    if (onUploadImage) url = await onUploadImage(f);
    else {
      const u = prompt("URL da imagem (upload não configurado):");
      if (!u) return;
      url = u;
    }
    exec("insertImage", url);
  }
  function insertHtml(snippet: string) {
    exec("insertHTML", snippet);
  }

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", background: "white" }}>
      <div style={tb} onMouseDown={saveSelection}>
        <select
          defaultValue=""
          onChange={(e) => { exec("formatBlock", e.target.value); e.currentTarget.value = ""; }}
          style={sel}
          title="Estilo do bloco"
        >
          <option value="">Parágrafo/Título…</option>
          <option value="P">Parágrafo</option>
          <option value="H1">Título 1</option>
          <option value="H2">Título 2</option>
          <option value="H3">Título 3</option>
          <option value="H4">Título 4</option>
          <option value="BLOCKQUOTE">Citação</option>
          <option value="PRE">Código</option>
        </select>
        <select
          defaultValue=""
          onChange={(e) => { exec("fontSize", e.target.value); e.currentTarget.value = ""; }}
          style={sel}
          title="Tamanho do texto"
        >
          <option value="">Tamanho…</option>
          <option value="1">Muito pequeno</option>
          <option value="2">Pequeno</option>
          <option value="3">Normal</option>
          <option value="4">Médio</option>
          <option value="5">Grande</option>
          <option value="6">Muito grande</option>
        </select>
        <Sep />
        <Btn onClick={() => exec("bold")} title="Negrito"><b>B</b></Btn>
        <Btn onClick={() => exec("italic")} title="Itálico"><i>I</i></Btn>
        <Btn onClick={() => exec("underline")} title="Sublinhado"><u>U</u></Btn>
        <Btn onClick={() => exec("strikeThrough")} title="Tachado"><s>S</s></Btn>
        <Btn onClick={() => exec("superscript")} title="Sobrescrito">x²</Btn>
        <Btn onClick={() => exec("subscript")} title="Subscrito">x₂</Btn>
        <Sep />
        <label title="Cor do texto" style={colorWrap}>
          A
          <input type="color" onChange={(e) => exec("foreColor", e.target.value)} style={colorInput} />
        </label>
        <label title="Marca-texto" style={colorWrap}>
          ▮
          <input type="color" onChange={(e) => exec("hiliteColor", e.target.value)} style={colorInput} />
        </label>
        <Sep />
        <Btn onClick={() => exec("justifyLeft")} title="Alinhar à esquerda">⯇</Btn>
        <Btn onClick={() => exec("justifyCenter")} title="Centralizar">≡</Btn>
        <Btn onClick={() => exec("justifyRight")} title="Alinhar à direita">⯈</Btn>
        <Btn onClick={() => exec("justifyFull")} title="Justificar">☰</Btn>
        <Sep />
        <Btn onClick={() => exec("insertUnorderedList")} title="Lista com marcadores">•</Btn>
        <Btn onClick={() => exec("insertOrderedList")} title="Lista numerada">1.</Btn>
        <Btn onClick={() => exec("outdent")} title="Diminuir recuo">⇤</Btn>
        <Btn onClick={() => exec("indent")} title="Aumentar recuo">⇥</Btn>
        <Sep />
        <Btn onClick={link} title="Inserir link">🔗</Btn>
        <Btn onClick={() => exec("unlink")} title="Remover link">⛓</Btn>
        <Btn onClick={() => fileRef.current?.click()} title="Inserir imagem">🖼</Btn>
        <Btn onClick={() => exec("insertHorizontalRule")} title="Linha divisória">―</Btn>
        <Btn
          onClick={() => {
            const rows = Number(prompt("Linhas:", "3") || 0);
            const cols = Number(prompt("Colunas:", "3") || 0);
            if (!rows || !cols) return;
            const body = Array.from({ length: rows })
              .map(() => `<tr>${Array.from({ length: cols }).map(() => "<td>&nbsp;</td>").join("")}</tr>`)
              .join("");
            insertHtml(`<table border="1" style="border-collapse:collapse;width:100%"><tbody>${body}</tbody></table><p></p>`);
          }}
          title="Inserir tabela"
        >
          ▦
        </Btn>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <Sep />
        <Btn onClick={() => exec("undo")} title="Desfazer">↶</Btn>
        <Btn onClick={() => exec("redo")} title="Refazer">↷</Btn>
        <Btn onClick={() => exec("removeFormat")} title="Limpar formatação">⌫</Btn>
        <div style={{ marginLeft: "auto" }}>
          <Btn
            onClick={() => { if (!source && ref.current) setHtml(ref.current.innerHTML); setSource((s) => !s); }}
            title="Alternar código HTML"
          >
            {source ? "Visual" : "HTML"}
          </Btn>
        </div>
      </div>
      {source ? (
        <textarea
          value={html}
          onChange={(e) => {
            const v = e.target.value;
            lastEmitted.current = v;
            setHtml(v);
            onChange(v);
            if (ref.current) ref.current.innerHTML = v;
          }}
          style={{ width: "100%", minHeight: 320, border: 0, padding: 14, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
        />
      ) : (
        <>
          <style>{`
            .rte-content ul { list-style: disc outside; padding-left: 1.6em; margin: 0.6em 0; }
            .rte-content ol { list-style: decimal outside; padding-left: 1.6em; margin: 0.6em 0; }
            .rte-content ul ul { list-style: circle outside; }
            .rte-content ol ol { list-style: lower-alpha outside; }
            .rte-content li { display: list-item; margin: 0.2em 0; }
            .rte-content blockquote { border-left: 3px solid #cbd5e1; margin: 0.8em 0; padding-left: 12px; color: #475569; }
          `}</style>
          <div
            ref={ref}
            className="rte-content"
            contentEditable
            onInput={emit}
            onBlur={() => { saveSelection(); emit(); }}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            onPaste={() => setTimeout(emit, 0)}
            suppressContentEditableWarning
            style={{ minHeight: 320, padding: 16, outline: "none", fontSize: 15, lineHeight: 1.7, color: "#1e293b" }}
          />
        </>
      )}

    </div>
  );
}

const tb: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4, padding: 6,
  borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexWrap: "wrap",
};
const sel: React.CSSProperties = {
  height: 30, borderRadius: 6, border: "1px solid #e2e8f0", background: "white",
  fontSize: 13, color: "#334155", padding: "0 6px",
};
const colorWrap: React.CSSProperties = {
  position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#334155",
};
const colorInput: React.CSSProperties = {
  position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%",
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
