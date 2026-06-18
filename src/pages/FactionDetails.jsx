import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { uploadImage } from "../services/cloudinary";
import CharacterCard from "../components/characterCard.jsx";
import "../assets/factions.css";

function FactionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [faction, setFaction] = useState(null);
  const [members, setMembers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFaction, setEditFaction] = useState({
    nome: "",
    imagem: "",
    descricao: "",
    lider: "",
    sede: "",
    objetivos: "",
  });
  const [imagemArquivoFaction, setImagemArquivoFaction] = useState(null);
  const [buscaPlayerNome, setBuscaPlayerNome] = useState("");

  useEffect(() => {
    if (!id) return;

    const factionRef = doc(db, "factions", id);
    const unsubFaction = onSnapshot(factionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() };
        setFaction(data);
        setEditFaction({
          nome: data.nome || "",
          imagem: data.imagem || "",
          descricao: data.descricao || "",
          lider: data.lider || "",
          sede: data.sede || "",
          objetivos: data.objetivos || "",
        });
      } else {
        setFaction(null);
      }
    });

    return () => unsubFaction();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const membersQuery = query(collection(db, "players"), where("factionId", "==", id));
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      setMembers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubMembers();
  }, [id]);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, "players"), (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubPlayers();
  }, []);

  const handleAssignPlayer = async (player) => {
    if (player.factionId === id) return;

    try {
      const playerRef = doc(db, "players", player.id);
      await updateDoc(playerRef, {
        factionId: id,
      });
      setShowModal(false);
    } catch (error) {
      console.error("Erro ao adicionar personagem:", error);
    }
  };

  const handleRemoveFromFaction = async (playerId) => {
    try {
      const playerRef = doc(db, "players", playerId);
      await updateDoc(playerRef, {
        factionId: "",
      });
    } catch (error) {
      console.error("Erro ao remover personagem:", error);
    }
  };

  const handleEditFaction = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = editFaction.imagem;
      if (imagemArquivoFaction) {
        imageUrl = await uploadImage(imagemArquivoFaction);
      }

      const factionRef = doc(db, "factions", id);
      await updateDoc(factionRef, {
        ...editFaction,
        imagem: imageUrl,
      });
      setShowEditModal(false);
      setImagemArquivoFaction(null);
    } catch (error) {
      console.error("Erro ao atualizar facção:", error);
    }
  };

  if (!faction) {
    return (
      <div className="page-container">
        <p>Facção não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="header-actions-faction">
        <div className="action-bar">
          <button className="btn-back" onClick={() => navigate("/factions")}>← Voltar para Facções</button>
          <div className="action-buttons-row">
            <button className="btn-add-main" onClick={() => setShowEditModal(true)}>
              Editar Facção
            </button>
            <button className="btn-add-main" onClick={() => setShowModal(true)}>
              Adicionar Personagem
            </button>
          </div>
        </div>
      </div>

      <div className="faction-detail-card">
        <img src={faction.imagem} alt={faction.nome} className="faction-detail-image" />
        <div className="faction-detail-info">
          <h1>{faction.nome}</h1>
          <p>{faction.descricao}</p>

          <div className="detail-row">
            <div>
              <span>Líder</span>
              <p>{faction.lider}</p>
            </div>
            <div>
              <span>Sede</span>
              <p>{faction.sede}</p>
            </div>
          </div>

          <div className="detail-row">
            <span>Objetivos</span>
            <p>{faction.objetivos}</p>
          </div>
        </div>
      </div>

      <section className="members-section">
        <h2>Membros da Facção</h2>

        {members.length === 0 ? (
          <p className="empty-state">Nenhum membro cadastrado ainda.</p>
        ) : (
          <div className="members-grid">
            {members
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((member) => (
                <CharacterCard
                  key={member.id}
                  player={member}
                  onRemoveFromFaction={() => handleRemoveFromFaction(member.id)}
                />
              ))}
          </div>
        )}
      </section>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="btn-close"
              onClick={() => {
                setShowEditModal(false);
                setImagemArquivoFaction(null);
              }}
            >
              X
            </button>
            <h3>Editar Facção</h3>
            <form onSubmit={handleEditFaction}>
              <input
                placeholder="Nome"
                value={editFaction.nome}
                onChange={(e) => setEditFaction({ ...editFaction, nome: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImagemArquivoFaction(e.target.files[0])}
              />
              <input
                placeholder="Líder"
                value={editFaction.lider}
                onChange={(e) => setEditFaction({ ...editFaction, lider: e.target.value })}
                required
              />
              <input
                placeholder="Sede"
                value={editFaction.sede}
                onChange={(e) => setEditFaction({ ...editFaction, sede: e.target.value })}
                required
              />
              <textarea
                placeholder="Descrição"
                value={editFaction.descricao}
                onChange={(e) => setEditFaction({ ...editFaction, descricao: e.target.value })}
                required
              />
              <textarea
                placeholder="Objetivos"
                value={editFaction.objetivos}
                onChange={(e) => setEditFaction({ ...editFaction, objetivos: e.target.value })}
                required
              />
              <button type="submit" className="btn-save">
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="btn-close"
              onClick={() => {
                setShowModal(false);
                setBuscaPlayerNome("");
              }}
            >
              X
            </button>
            <h3>Selecionar Personagem</h3>
            <label>
              Buscar por nome
              <input
                type="text"
                value={buscaPlayerNome}
                onChange={(e) => setBuscaPlayerNome(e.target.value)}
                className="search-input-faction"
                placeholder="Ex: Azimeth..."
              />
            </label>
            <div className="player-selection-list">
              {players
                .filter((player) => !player.factionId)
                .filter((player) =>
                  player.nome
                    .toLowerCase()
                    .includes(buscaPlayerNome.toLowerCase().trim())
                )
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((player) => (
                  <div key={player.id} className="player-list-item">
                    <div>
                      <strong>{player.nome}</strong>
                      <p className="player-mini-info">
                        {player.tipo} · {player.raca || "Sem raça"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-save"
                      onClick={() => handleAssignPlayer(player)}
                    >
                      Adicionar
                    </button>
                  </div>
                ))}
              {players
                .filter((player) => !player.factionId)
                .filter((player) =>
                  player.nome
                    .toLowerCase()
                    .includes(buscaPlayerNome.toLowerCase().trim())
                ).length === 0 && (
                <p className="empty-state">Nenhum personagem disponível para adicionar.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FactionDetails;
