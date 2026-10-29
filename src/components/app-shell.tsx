"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  BookA,
  BookOpenCheck,
  Boxes,
  CalendarCheck,
  CalendarDays,
  ChartColumnBig,
  ClipboardList,
  Download,
  FileSignature,
  FolderKanban,
  FolderOpen,
  Gauge,
  Gavel,
  GraduationCap,
  Grid3x3,
  Headset,
  HeartHandshake,
  Kanban,
  Landmark,
  LayoutDashboard,
  ListChecks,
  ListTree,
  Menu,
  MessagesSquare,
  MessagesSquare as IconFallback,
  Network,
  PackageCheck,
  ReceiptText,
  Route,
  Scale,
  Settings,
  ShieldCheck,
  Target,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { NAV_PAINEL, NAV_SECTIONS, type NavItem } from "@/lib/navigation";

/**
 * Casca da aplicacao: barra lateral fixa no desktop, gaveta no mobile.
 *
 * Os icones sao mapeados explicitamente (e nao por `import *`) para que o
 * bundle leve apenas os 35 que o menu realmente usa.
 */

const ICONES: Record<string, typeof IconFallback> = {
  ArrowRightLeft,
  BookA,
  BookOpenCheck,
  Boxes,
  CalendarCheck,
  CalendarDays,
  ChartColumnBig,
  ClipboardList,
  FileSignature,
  FolderKanban,
  FolderOpen,
  Gauge,
  Gavel,
  GraduationCap,
  Grid3x3,
  Headset,
  HeartHandshake,
  Kanban,
  Landmark,
  LayoutDashboard,
  ListChecks,
  ListTree,
  MessagesSquare,
  Network,
  PackageCheck,
  ReceiptText,
  Route,
  Scale,
  Settings,
  ShieldCheck,
  Target,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
};

function Icone({ nome, className }: { nome: string; className?: string }) {
  const Componente = ICONES[nome] ?? IconFallback;
  return <Componente className={className} strokeWidth={1.75} aria-hidden />;
}

function ehAtivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ItemMenu({
  item,
  pathname,
  onNavegar,
}: {
  item: NavItem;
  pathname: string;
  onNavegar: () => void;
}) {
  const ativo = ehAtivo(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavegar}
      title={item.hint}
      aria-current={ativo ? "page" : undefined}
      className="group flex items-center gap-2.5 rounded-lg px-2.5 py-[0.4rem] text-[0.8125rem] transition-colors"
      style={{
        background: ativo ? "var(--sidebar-ativo)" : "transparent",
        color: ativo ? "#fff" : "var(--sidebar-texto)",
        fontWeight: ativo ? 600 : 450,
      }}
    >
      <Icone nome={item.icon} className="size-4 shrink-0 opacity-80" />
      <span className="truncate">{item.label}</span>
      {ativo ? (
        <span className="ml-auto h-4 w-[2px] rounded-full bg-[var(--color-marca-400)]" />
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha a gaveta ao trocar de pagina no mobile.
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col" style={{ background: "var(--sidebar)" }}>
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #0d9488)" }}
        >
          D
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-white">DEMOCRAT.IA</p>
          <p className="truncate text-[0.6875rem] text-[var(--sidebar-texto)]">
            Gestao e Governanca
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="ml-auto rounded-md p-1 text-[var(--sidebar-texto)] hover:bg-white/10 lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 pb-4">
        <ItemMenu item={NAV_PAINEL} pathname={pathname} onNavegar={() => setAberto(false)} />

        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-2.5 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[var(--texto-fraco)]">
              {section.label}
            </p>
            <div className="space-y-px">
              {section.items.map((item) => (
                <ItemMenu
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavegar={() => setAberto(false)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <a
          href="/api/backup"
          className="flex items-center gap-2 text-[0.75rem] text-[var(--sidebar-texto)] hover:text-white"
        >
          <Download className="size-3.5" />
          Exportar backup (JSON)
        </a>
        <p className="mt-2 text-[0.625rem] leading-relaxed text-[var(--texto-fraco)]">
          O time e a forca. O vinculo e o caminho.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="nao-imprimir sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        {sidebar}
      </aside>

      {/* Gaveta mobile */}
      {aberto ? (
        <div className="nao-imprimir fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-[var(--sombra-lg)]">{sidebar}</div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="nao-imprimir sticky top-0 z-30 flex items-center gap-3 border-b bg-[var(--superficie)]/85 px-4 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="btn btn-secundario btn-sm"
            aria-label="Abrir menu"
          >
            <Menu className="size-4" />
          </button>
          <span className="text-sm font-semibold">DEMOCRAT.IA</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-7">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
