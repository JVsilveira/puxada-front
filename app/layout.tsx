import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puxada | Jogos do timi",
  description:
    "Sua coleção de jogos. Adicione, encontre e organize a próxima partida.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
