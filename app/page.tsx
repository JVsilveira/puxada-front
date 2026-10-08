"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Jogo = { id: number; nome: string; categoria: string };
type Sugestao = {
  id: number;
  name: string;
  background_image?: string | null;
  genres?: { name: string }[];
};
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://0r6an9zpbk.execute-api.us-east-2.amazonaws.com";
const RAWG_KEY =
  process.env.NEXT_PUBLIC_RAWG_API_KEY || "90b96356913142f1b3f4e5acd9a9049d";

const artworkCache = new Map<string, Promise<string | null>>();
const normalizeName = (name: string) => name.trim().toLocaleLowerCase("pt-BR");

function findArtwork(name: string) {
  const key = normalizeName(name);
  const cached = artworkCache.get(key);
  if (cached) return cached;
  const request = fetch(
    `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(name)}&page_size=5`,
    { signal: AbortSignal.timeout(10000) },
  )
    .then(async (response) => {
      if (!response.ok) throw new Error("Artwork unavailable");
      const data: { results?: Sugestao[] } = await response.json();
      return (
        data.results?.find((game) => normalizeName(game.name) === key)
          ?.background_image || null
      );
    })
    .catch(() => {
      artworkCache.delete(key);
      return null;
    });
  artworkCache.set(key, request);
  return request;
}

function GameArtwork({
  name,
  source,
  lookup = false,
}: {
  name: string;
  source?: string | null;
  lookup?: boolean;
}) {
  const [resolved, setResolved] = useState<{
    name: string;
    url: string | null;
  } | null>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  useEffect(() => {
    if (!lookup) return;
    let active = true;
    void findArtwork(name).then((url) => {
      if (active) setResolved({ name, url });
    });
    return () => {
      active = false;
    };
  }, [name, lookup]);
  const url = source || (resolved?.name === name ? resolved.url : null);
  return url && url !== failedSource ? (
    <Image
      src={url}
      alt=""
      width={116}
      height={124}
      unoptimized
      loading="lazy"
      className="game-artwork"
      onError={() => setFailedSource(url)}
    />
  ) : (
    <GameIcon />
  );
}

function GameIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? 22 : 32}
      height={small ? 22 : 32}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 9h12c3 0 4 3 5 8l1 5c.6 3-2 5-4 3l-5-4h-6l-5 4c-2 2-4.6 0-4-3l1-5c1-5 2-8 5-8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 13v7m-3.5-3.5h7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="22" cy="14" r="1.5" fill="currentColor" />
      <circle cx="25" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

function GameFields({
  name,
  category,
  onName,
  onCategory,
  disabled,
  prefix,
}: {
  name: string;
  category: string;
  onName: (value: string) => void;
  onCategory: (value: string) => void;
  disabled: boolean;
  prefix: string;
}) {
  const [suggestions, setSuggestions] = useState<Sugestao[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || name.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(name.trim())}&page_size=5`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch {
        /* Manual entry remains available if suggestions are unavailable. */
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, open]);
  return (
    <>
      <div
        className="field autocomplete"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpen(false);
        }}
      >
        <label htmlFor={`${prefix}-name`}>Nome do jogo</label>
        <input
          id={`${prefix}-name`}
          required
          maxLength={180}
          autoComplete="off"
          placeholder="Buscar ou digitar nome"
          value={name}
          disabled={disabled}
          onChange={(event) => {
            onName(event.target.value);
            setSuggestions([]);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          aria-controls={`${prefix}-suggestions`}
        />
        {open && name.trim().length >= 2 && suggestions.length > 0 ? (
          <ul
            className="suggestions"
            id={`${prefix}-suggestions`}
            aria-label="Sugestões de jogos"
          >
            {suggestions.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => {
                    artworkCache.set(
                      normalizeName(game.name),
                      Promise.resolve(game.background_image || null),
                    );
                    onName(game.name);
                    onCategory(game.genres?.[0]?.name || "Outros");
                    setOpen(false);
                  }}
                >
                  <span className="suggestion-artwork">
                    <GameArtwork
                      name={game.name}
                      source={game.background_image}
                    />
                  </span>
                  <span className="suggestion-info">
                    <span>{game.name}</span>
                    <small>{game.genres?.[0]?.name || "Outros"}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-category`}>Categoria</label>
        <input
          id={`${prefix}-category`}
          maxLength={80}
          placeholder="Ex.: RPG"
          value={category}
          disabled={disabled}
          onChange={(event) => onCategory(event.target.value)}
        />
      </div>
    </>
  );
}

export default function Home() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState<Jogo | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${BASE_URL}/jogos`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(12000),
          ]),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data;
        if (!Array.isArray(list)) throw new Error();
        setJogos(list);
        setLoadError(false);
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [reload]);

  async function mutate(
    method: string,
    id?: number,
    body?: { nome: string; categoria: string },
  ) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(
        `${BASE_URL}/jogos${id === undefined ? "" : `/${id}`}`,
        {
          method,
          signal: AbortSignal.timeout(15000),
          ...(body
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }
            : {}),
        },
      );
      if (!response.ok) throw new Error();
      if (method === "POST") {
        setName("");
        setCategory("");
      }
      setEditing(null);
      setDeleting(null);
      setReload((value) => value + 1);
      setNotice({
        text:
          method === "DELETE"
            ? "Jogo excluído."
            : method === "PUT"
              ? "Jogo atualizado."
              : "Jogo adicionado.",
        error: false,
      });
    } catch {
      setNotice({
        text: "Não foi possível salvar. Tente novamente.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  const filtered = jogos.filter((game) =>
    `${game.nome} ${game.categoria || ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Puxada, início">
          <span className="brand-icon">
            <GameIcon small />
          </span>
          Puxada<span className="brand-dot">.</span>
        </Link>
        <span className="topbar-label">Jogos do timi</span>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <p className="breadcrumb">Minha coleção</p>
            <h1>
              Jogos do timi<span>.</span>
            </h1>
          </div>
          <span className="collection-count">
            {loading ? "…" : jogos.length}{" "}
            {jogos.length === 1 ? "jogo" : "jogos"}
          </span>
        </div>
        <div className="workspace">
          <aside className="add-panel">
            <div className="panel-icon">
              <GameIcon />
            </div>
            <h2>Mais um pra lista</h2>
            <p className="panel-description">
              Busque um jogo ou adicione o seu.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (name.trim())
                  void mutate("POST", undefined, {
                    nome: name.trim(),
                    categoria: category.trim() || "Outros",
                  });
              }}
            >
              <GameFields
                name={name}
                category={category}
                onName={setName}
                onCategory={setCategory}
                disabled={busy}
                prefix="add"
              />
              <button
                className="primary-button"
                disabled={busy || !name.trim()}
                type="submit"
              >
                <span aria-hidden="true">+</span>{" "}
                {busy ? "Salvando…" : "Adicionar jogo"}
              </button>
            </form>
          </aside>
          <section className="library" aria-label="Jogos cadastrados">
            <div className="library-toolbar">
              <h2>Na coleção</h2>
              <div className="search-field">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <circle cx="10.5" cy="10.5" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <input
                  aria-label="Filtrar jogos"
                  placeholder="Encontrar jogo"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            {notice ? (
              <div
                className={`notice ${notice.error ? "error" : ""}`}
                role={notice.error ? "alert" : "status"}
              >
                {notice.text}
                <button
                  type="button"
                  aria-label="Fechar mensagem"
                  onClick={() => setNotice(null)}
                >
                  ×
                </button>
              </div>
            ) : null}
            {loading ? (
              <div className="empty-state" role="status">
                Carregando coleção…
              </div>
            ) : loadError ? (
              <div className="empty-state">
                <GameIcon />
                <h3>Não foi possível carregar os jogos.</h3>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setLoading(true);
                    setReload((value) => value + 1);
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <GameIcon />
                <h3>
                  {search
                    ? "Nenhum jogo encontrado"
                    : "Espaço para a próxima partida"}
                </h3>
                <p>
                  {search
                    ? "Tente outro nome ou categoria."
                    : "Adicione seu primeiro jogo ao lado."}
                </p>
              </div>
            ) : (
              <ul className="game-list">
                {filtered.map((game) => (
                  <li
                    key={game.id}
                    className={`game-row ${editing?.id === game.id ? "is-editing" : ""}`}
                  >
                    {editing?.id === game.id ? (
                      <form
                        className="edit-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (editing.nome.trim())
                            void mutate("PUT", game.id, {
                              nome: editing.nome.trim(),
                              categoria: editing.categoria.trim() || "Outros",
                            });
                        }}
                      >
                        <GameFields
                          name={editing.nome}
                          category={editing.categoria}
                          onName={(value) =>
                            setEditing({ ...editing, nome: value })
                          }
                          onCategory={(value) =>
                            setEditing({ ...editing, categoria: value })
                          }
                          disabled={busy}
                          prefix={`edit-${game.id}`}
                        />
                        <div className="edit-actions">
                          <button
                            className="secondary-button"
                            type="button"
                            disabled={busy}
                            onClick={() => setEditing(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            className="primary-button"
                            disabled={busy || !editing.nome.trim()}
                          >
                            Salvar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <span className="game-tile">
                          <GameArtwork name={game.nome} lookup />
                        </span>
                        <div className="game-info">
                          <h3>{game.nome}</h3>
                          <span>{game.categoria || "Outros"}</span>
                        </div>
                        {deleting === game.id ? (
                          <div className="row-actions delete-confirm">
                            <span>Excluir?</span>
                            <button
                              className="danger-button"
                              disabled={busy}
                              onClick={() => void mutate("DELETE", game.id)}
                            >
                              Sim
                            </button>
                            <button
                              className="secondary-button"
                              disabled={busy}
                              onClick={() => setDeleting(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="row-actions">
                            <button
                              className="secondary-button"
                              disabled={busy}
                              aria-label={`Editar ${game.nome}`}
                              onClick={() => {
                                setEditing({
                                  ...game,
                                  categoria: game.categoria || "",
                                });
                                setDeleting(null);
                              }}
                            >
                              Editar
                            </button>
                            <button
                              className="icon-button"
                              disabled={busy}
                              aria-label={`Excluir ${game.nome}`}
                              onClick={() => setDeleting(game.id)}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                aria-hidden="true"
                              >
                                <path
                                  d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
