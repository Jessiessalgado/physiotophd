import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/posts.functions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, FolderTree, Tags, Image, Files, Search,
  LayoutTemplate, Palette, Mail, MessageSquare, Users, Settings, DatabaseBackup,
  PanelLeftClose, PanelLeft, LogOut, ExternalLink, Download,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
  head: () => ({ meta: [{ title: "Painel — Physio to PhD" }] }),
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/posts", label: "Postagens", icon: FileText },
  { to: "/admin/categories", label: "Categorias", icon: FolderTree },
  { to: "/admin/tags", label: "Tags", icon: Tags },
  { to: "/admin/media", label: "Mídia", icon: Image },
  { to: "/admin/pages", label: "Páginas", icon: Files },
  { to: "/admin/seo", label: "SEO", icon: Search },
  { to: "/admin/layout", label: "Layout", icon: LayoutTemplate },
  { to: "/admin/theme", label: "Tema", icon: Palette },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/comments", label: "Comentários", icon: MessageSquare },
  { to: "/admin/authors", label: "Autores", icon: Users },
  { to: "/admin/settings", label: "Configurações", icon: Settings },
  { to: "/admin/backup", label: "Backup", icon: DatabaseBackup },
] as const;

function AdminShell() {
  const check = useServerFn(checkIsAdmin);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    check()
      .then(({ isAdmin }) => setState(isAdmin ? "ok" : "denied"))
      .catch(() => setState("denied"));
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  if (state === "loading") {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando painel…</div>;
  }
  if (state === "denied") {
    return (
      <div className="min-h-screen grid place-items-center p-8 text-center">
        <div>
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="text-muted-foreground mt-2">Sua conta não tem permissão de administrador.</p>
          <button onClick={signOut} className="mt-4 text-sm underline">Sair</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted/40 text-foreground">
      <div className="flex min-h-screen w-full">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0",
            collapsed ? "md:w-[68px]" : "md:w-64",
            mobileOpen ? "w-64 translate-x-0" : "-translate-x-full w-64",
          )}
        >
          <div className="flex h-16 items-center gap-2 border-b px-4">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              PhD
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">Physio to PhD</div>
                <div className="truncate text-[11px] text-muted-foreground">Painel administrativo</div>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {NAV.map((item) => {
              const active = isActive(item.to, (item as any).exact);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 border-t p-2">
            <a
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="size-4 shrink-0" />
              {!collapsed && <span>Ver site</span>}
            </a>
            <a
              href="/api/public/blogger-theme/xml"
              download="blogger-theme.xml"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Download className="size-4 shrink-0" />
              {!collapsed && <span>Blogger XML</span>}
            </a>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setMobileOpen(false)} />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-lg p-2 hover:bg-muted md:hidden"
              aria-label="Abrir menu"
            >
              <PanelLeft className="size-4" />
            </button>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="hidden rounded-lg p-2 hover:bg-muted md:block"
              aria-label="Recolher menu"
            >
              {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
            <div className="text-sm font-medium text-muted-foreground">
              {NAV.find((n) => isActive(n.to, (n as any).exact))?.label ?? "Painel"}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <div className="mx-auto w-full max-w-6xl animate-in fade-in duration-300">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
