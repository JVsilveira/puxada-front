"use client";

import React, { useEffect, useState } from "react";

export default function Home() {
  const [nomeJogo, setNomeJogo] = React.useState("");
  const [categoriaJogo, setCategoriaJogo] = React.useState("");
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [sugestoesEdit, setSugestoesEdit] = useState<any[]>([]);
  const [mostrarSugestoesEdit, setMostrarSugestoesEdit] = useState(false);
  const [timeoutBusca, setTimeoutBusca] = useState<NodeJS.Timeout | null>(null);

  const API_KEY = "90b96356913142f1b3f4e5acd9a9049d";
  const BASE_URL = "https://0r6an9zpbk.execute-api.us-east-2.amazonaws.com";

  const buscarJogosRAWG = async (query: string) => {
    if (!query || query.length < 2) return [];

    try {
      const res = await fetch(
        `https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=5`,
      );

      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error("Erro RAWG:", error);
      return [];
    }
  };

  const handleGetJogos = async () => {
    try {
      const res = await fetch(`${BASE_URL}/jogos`);
      const data = await res.json();

      setJogos(data.data);
    } catch (error) {
      alert("Erro ao buscar jogos: " + error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/jogos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erro ao deletar");
      }

      alert("Jogo excluído com sucesso!");
      handleGetJogos();
    } catch (error) {
      alert("Erro ao excluir jogo: " + error);
    }
  };

  type Jogo = {
    id: number;
    nome: string;
    categoria: string;
  };

  const iniciarEdicao = (jogo: Jogo) => {
    setEditandoId(jogo.id);
    setNovoNome(jogo.nome);
    setNovaCategoria(jogo.categoria);
  };

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/jogos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: novoNome,
          categoria: novaCategoria,
        }),
      });
      console.log(res);
      if (!res.ok) {
        throw new Error("Erro ao atualizar jogo");
      }

      alert("Jogo atualizado com sucesso");

      setEditandoId(null);
      handleGetJogos();
    } catch (error) {
      alert("Erro ao atualizar jogo: " + error);
    }
  };

  useEffect(() => {
    handleGetJogos();
  }, []);

  const handleSubmit = async () => {
    try {
      await fetch(`${BASE_URL}/jogos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeJogo,
          categoria: categoriaJogo,
        }),
      });
      handleGetJogos();
      alert("Jogo cadastrado com sucesso!");
    } catch (error) {
      alert("Erro ao cadastrar jogo: " + error);
    }
  };

  return (
    <div className=" paginaCadastro">
      <div className="cadastro">
        <div>
          <p>cadastrar novo jogo:</p>

          <br />
          <input
            type="text"
            placeholder="nome"
            value={nomeJogo}
            onChange={(e) => {
              const value = e.target.value;
              setNomeJogo(value);

              if (timeoutBusca) clearTimeout(timeoutBusca);

              const timeout = setTimeout(async () => {
                const resultados = await buscarJogosRAWG(value);
                setSugestoes(resultados);
                setMostrarSugestoes(true);
              }, 400);

              setTimeoutBusca(timeout);
            }}
            onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
          />
          {mostrarSugestoes && sugestoes.length > 0 && (
            <ul style={{ background: "#fff", color: "#000" }}>
              {sugestoes.map((game) => (
                <li
                  key={game.id}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "5px",
                  }}
                  onClick={() => {
                    setNomeJogo(game.name);
                    setCategoriaJogo(game.genres[0]?.name || "Outros");
                    setMostrarSugestoes(false);
                  }}
                  onBlur={() =>
                    setTimeout(() => setMostrarSugestoes(false), 200)
                  }
                >
                  <img
                    src={game.background_image}
                    width="50"
                    style={{ borderRadius: "5px" }}
                  />
                  {game.name}
                </li>
              ))}
            </ul>
          )}

          <br />
          <button type="submit" onClick={handleSubmit}>
            Cadastrar Jogo
          </button>
        </div>
      </div>
      <div className="jogosCadastrados">
        <div className="cadastro">
          <p>Jogos do timi</p>
          <div className="jogos">
            <ul>
              {jogos.map((jogo) => (
                <li key={jogo.id}>
                  {editandoId === jogo.id ? (
                    <>
                      <input
                        value={novoNome}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNovoNome(value);

                          if (timeoutBusca) clearTimeout(timeoutBusca);

                          const timeout = setTimeout(async () => {
                            const resultados = await buscarJogosRAWG(value);
                            setSugestoesEdit(resultados);
                            setMostrarSugestoesEdit(true);
                          }, 400);

                          setTimeoutBusca(timeout);
                        }}
                      />
                      {mostrarSugestoesEdit && sugestoesEdit.length > 0 && (
                        <ul style={{ background: "#fff", color: "#000" }}>
                          {sugestoesEdit.map((game) => (
                            <li
                              key={game.id}
                              onClick={() => {
                                setNovoNome(game.name);
                                setNovaCategoria(
                                  game.genres[0]?.name || "Outros",
                                );
                                setMostrarSugestoesEdit(false);
                              }}
                            >
                              {game.name}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button onClick={() => handleUpdate(jogo.id)}>
                        Salvar
                      </button>
                    </>
                  ) : (
                    <>
                      {jogo.nome} - {jogo.categoria}
                      <button onClick={() => handleDelete(jogo.id)}>
                        Excluir
                      </button>
                      <button onClick={() => iniciarEdicao(jogo)}>
                        Atualizar
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
