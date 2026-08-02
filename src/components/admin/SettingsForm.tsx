import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSettings, saveSetting } from "@/lib/cms.functions";
import { Panel, Field, ErrorNote } from "@/components/admin/ui";
import { inputCls, btnPrimary } from "@/components/admin/styles";
import { Check, Save } from "lucide-react";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "number" | "color" | "select";
  hint?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  mono?: boolean;
};

export type Group = { title: string; description?: string; fields: FieldDef[] };

export function SettingsForm({ settingKey, groups }: { settingKey: string; groups: Group[] }) {
  const load = useServerFn(getSettings);
  const save = useServerFn(saveSetting);
  const [value, setValue] = useState<Record<string, any> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load()
      .then((all: any) => setValue(all[settingKey] ?? {}))
      .catch((e) => setErr(e.message));
  }, [settingKey]);

  function set(name: string, v: any) {
    setValue((s) => ({ ...(s ?? {}), [name]: v }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await save({ data: { key: settingKey, value: value ?? {} } });
      setSaved(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!value) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNote error={err} />
      {groups.map((g) => (
        <Panel key={g.title} title={g.title} description={g.description}>
          <div className="grid gap-4 md:grid-cols-2">
            {g.fields.map((f) => {
              const v = value[f.name] ?? (f.type === "checkbox" ? false : "");
              if (f.type === "checkbox") {
                return (
                  <label key={f.name} className="flex items-center gap-2 text-sm md:col-span-2">
                    <input type="checkbox" checked={!!v} onChange={(e) => set(f.name, e.target.checked)} />
                    <span>{f.label}</span>
                  </label>
                );
              }
              const wide = f.type === "textarea";
              return (
                <Field key={f.name} label={f.label} hint={f.hint} className={wide ? "md:col-span-2" : ""}>
                  {f.type === "textarea" ? (
                    <textarea
                      rows={f.rows ?? 3}
                      value={v}
                      onChange={(e) => set(f.name, e.target.value)}
                      className={`${inputCls} resize-y ${f.mono ? "font-mono text-xs" : ""}`}
                    />
                  ) : f.type === "select" ? (
                    <select value={v} onChange={(e) => set(f.name, e.target.value)} className={inputCls}>
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "color" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"}
                        onChange={(e) => set(f.name, e.target.value)}
                        className="size-9 cursor-pointer rounded-lg border bg-background"
                      />
                      <input value={v} onChange={(e) => set(f.name, e.target.value)} className={`${inputCls} font-mono text-xs`} />
                    </div>
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      value={v}
                      onChange={(e) => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                      className={inputCls}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        </Panel>
      ))}
      <div className="flex items-center gap-3">
        <button disabled={busy} className={btnPrimary}>
          <Save className="size-4" /> {busy ? "Salvando…" : "Salvar alterações"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="size-4" /> Salvo
          </span>
        )}
      </div>
    </form>
  );
}
