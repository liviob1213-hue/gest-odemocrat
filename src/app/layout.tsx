import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "DEMOCRAT.IA · Gestão e Governança",
  description:
    "Sistema de gestão da DEMOCRAT LTDA: CRM, fluxo de caixa, governança, POPs, RACI e indicadores por diretoria.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
