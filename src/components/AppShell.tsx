import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { NAV, LABEL_BY_SLUG } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, Search, Sun, Moon } from "lucide-react";
import { useIsFetching, useIsMutating, useQueryClient } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { setStoredTheme } from "@/lib/theme";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const slug = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const busy = fetching + mutating > 0;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // O script inline em __root.tsx já aplicou a classe antes da hidratação;
  // aqui só sincronizamos o estado do React com o que já está no DOM.
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    setStoredTheme(next);
  }

  function goTo(itemSlug: string) {
    setCmdOpen(false);
    setOpen(false);
    navigate({ to: `/${itemSlug}` as string });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[264px] overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 py-5 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
            PG
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold">OS PIA do Gelo</span>
            <span className="block text-xs text-muted-foreground">Gestão Inteligente</span>
          </span>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {NAV.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {group.label}
            </div>
            <nav className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.slug}
                  to={`/${item.slug}` as string}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    slug === item.slug
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      slug === item.slug ? "bg-primary" : "bg-border-strong",
                    )}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={toggleTheme}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? "Tema claro" : "Tema escuro"}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-8 relative">
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-primary to-accent transition-transform duration-300",
              busy ? "scale-x-100 animate-pulse" : "scale-x-0",
            )}
          />
          <button
            className="shrink-0 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="min-w-0 flex-1 truncate font-display text-base font-semibold sm:flex-none">
            {LABEL_BY_SLUG[slug] ?? "Painel"}
          </h2>
          <button
            onClick={() => setCmdOpen(true)}
            className="ml-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:ml-4 sm:px-3"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buscar módulo, cliente…</span>
            <kbd className="ml-1 hidden rounded border border-border px-1 font-mono text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>
          <div className="ml-auto hidden shrink-0 text-xs text-muted-foreground capitalize sm:block">
            {today}
          </div>
        </header>
        <main
          key={pathname}
          className="min-w-0 flex-1 animate-in fade-in-0 slide-in-from-bottom-1 px-4 py-6 duration-300 lg:px-8"
        >
          {children}
        </main>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Buscar módulo…" />
        <CommandList>
          <CommandEmpty>Nenhum módulo encontrado.</CommandEmpty>
          {NAV.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem key={item.slug} value={item.label} onSelect={() => goTo(item.slug)}>
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
