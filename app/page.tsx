"use client";

import React, { useEffect, useState } from "react";

export default function Home() {
  const [nomeJogo, setNomeJogo] = React.useState("");
  const [categoriaJogo, setCategoriaJogo] = React.useState("");
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");

  const handleGetJogos = async () => {
    try {
      const res = await fetch("http://localhost:3000/jogos");
      const data = await res.json();
      setJogos(data);
    } catch (error) {
      alert("Erro ao buscar jogos: " + error);
    }
  };
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/jogos/${id}`, {
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
      const res = await fetch(`http://localhost:3000/jogos/${id}`, {
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
      await fetch("http://localhost:3000/jogos", {
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
            onChange={(e) => setNomeJogo(e.target.value)}
            value={nomeJogo}
          />

          <input
            type="text"
            placeholder="categoria"
            onChange={(e) => setCategoriaJogo(e.target.value)}
            value={categoriaJogo}
          />

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
                        onChange={(e) => setNovoNome(e.target.value)}
                      />

                      <input
                        value={novaCategoria}
                        onChange={(e) => setNovaCategoria(e.target.value)}
                      />

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
