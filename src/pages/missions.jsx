import { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { uploadImage, uploadPdf } from "../services/cloudinary";
import MissionCard from "../components/MissionCard.jsx";
import "../assets/missions.css";

function Missions() {
  const [missions, setMissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [buscaTitulo, setBuscaTitulo] = useState("");
  const [imagemArquivo, setImagemArquivo] = useState(null);
  const [pdfArquivo, setPdfArquivo] = useState(null);
  const [players, setPlayers] = useState([]);
  const [buscaPersonagem, setBuscaPersonagem] = useState("");

  const [novaMissao, setNovaMissao] = useState({
    titulo: "",
    data: "",
    dataExibicao: "",
    descricao: "",
    imagem: "",
    relatorioUrl: "",
    relatorioNome: "",
    personagens: [],
    xp: 0,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "missions"), (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMissions(dados);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, "players"), (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubPlayers();
  }, []);

  const handleOpenEdit = (mission) => {
    setNovaMissao({
      titulo: mission.titulo || "",
      data: mission.data || "",
      dataExibicao: mission.dataExibicao || "",
      descricao: mission.descricao || "",
      imagem: mission.imagem || "",
      relatorioUrl: mission.relatorioUrl || "",
      relatorioNome: mission.relatorioNome || "",
      personagens: mission.personagens || [],
      xp: mission.xp ?? 0,
    });
    setCurrentId(mission.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
    setImagemArquivo(null);
    setPdfArquivo(null);
    setBuscaPersonagem("");
    setNovaMissao({
      titulo: "",
      data: "",
      dataExibicao: "",
      descricao: "",
      imagem: "",
      relatorioUrl: "",
      relatorioNome: "",
      personagens: [],
      xp: 0,
    });
  };

  const handleToggleSelection = (id) => {
    setNovaMissao((prev) => {
      const personagens = prev.personagens || [];
      const newList = personagens.includes(id)
        ? personagens.filter((item) => item !== id)
        : [...personagens, id];
      return {
        ...prev,
        personagens: newList,
      };
    });
  };

  const handleRemoveSelection = (id) => {
    setNovaMissao((prev) => ({
      ...prev,
      personagens: (prev.personagens || []).filter((item) => item !== id),
    }));
  };

  const getFilteredPlayers = () => {
    return players
      .filter((p) => p.nome.toLowerCase().includes(buscaPersonagem.toLowerCase()))
      .slice(0, 5);
  };

  const getLinkedPlayer = (id) => players.find((p) => p.id === id);

  const getMissionYear = (mission) => {
    const raw = `${mission.data || ""} ${mission.dataExibicao || ""}`;
    const match = raw.match(/\b(1[0-9]{3}|2[0-9]{3}|[0-9]{3,4})\b/);
    return match ? Number(match[1]) : 9999;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!novaMissao.titulo.trim() || !novaMissao.data.trim() || !novaMissao.dataExibicao.trim() || !novaMissao.descricao.trim()) {
      return;
    }

    const xpValue = Number(novaMissao.xp);
    if (!Number.isInteger(xpValue) || xpValue < 0 || !Number.isFinite(xpValue)) {
      return;
    }

    let imageUrl = novaMissao.imagem;
    if (imagemArquivo) {
      imageUrl = await uploadImage(imagemArquivo);
    }

    let pdfUrl = novaMissao.relatorioUrl || "";
    let pdfNome = novaMissao.relatorioNome || "";
    if (pdfArquivo) {
      pdfUrl = await uploadPdf(pdfArquivo);
      pdfNome = pdfArquivo.name;
    }

    const dadosParaSalvar = {
      ...novaMissao,
      imagem: imageUrl,
      relatorioUrl: pdfUrl,
      relatorioNome: pdfNome,
      xp: xpValue,
    };

    delete dadosParaSalvar.id;

    if (isEditing && currentId) {
      await updateDoc(doc(db, "missions", currentId), dadosParaSalvar);
    } else {
      await addDoc(collection(db, "missions"), {
        ...dadosParaSalvar,
        criadoEm: serverTimestamp(),
      });
    }

    fecharModal();
  };

  const missionsFiltradas = missions
    .filter((mission) =>
      mission.titulo?.toLowerCase().includes(buscaTitulo.toLowerCase().trim())
    )
    .sort((a, b) => {
      const yearA = getMissionYear(a);
      const yearB = getMissionYear(b);
      return yearA - yearB || (a.dataExibicao || "").localeCompare(b.dataExibicao || "") || (a.titulo || "").localeCompare(b.titulo || "");
    });

  const groupedMissions = missionsFiltradas.reduce((acc, mission) => {
    const year = getMissionYear(mission) === 9999 ? "Sem data" : String(getMissionYear(mission));
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(mission);
    return acc;
  }, {});

  const yearKeys = Object.keys(groupedMissions).sort((a, b) => {
    if (a === "Sem data") return 1;
    if (b === "Sem data") return -1;
    return Number(a) - Number(b);
  });

  return (
    <div className="page-container">
      <div className="header-actions-mission">
        <div className="mission-actions">
          <button className="btn-add-main" onClick={() => setShowModal(true)}>
            + Nova Missão
          </button>
          <div className="search-container-mission">
            <div className="filter-header-mission">Filtros de busca</div>
            <div className="filter-inputs-mission">
              <input
                type="text"
                placeholder="Ex: A Missão de X..."
                value={buscaTitulo}
                onChange={(e) => setBuscaTitulo(e.target.value)}
                className="search-input-mission"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="mission-summary">
        <h1>Missões</h1>
        <p>Registre as aventuras da campanha, suas imagens, personagens participantes e os relatórios em PDF da missão.</p>
      </section>

      <div className="mission-group">
        {missionsFiltradas.length === 0 ? (
          <p className="empty-state">Nenhuma missão cadastrada ainda.</p>
        ) : (
          yearKeys.map((year) => (
            <div key={year} className="mission-year-block">
              <div className="mission-year-label">{year}</div>
              <div className="mission-events-list">
                {groupedMissions[year].map((mission) => (
                  <MissionCard key={mission.id} mission={mission} onEdit={handleOpenEdit} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-scrollable">
            <button className="btn-close" onClick={fecharModal}>X</button>
            <h3>{isEditing ? "Editar Missão" : "Nova Missão"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-scroll-container">
                <div className="mission-form-meta">
                  <input
                    placeholder="Título"
                    value={novaMissao.titulo}
                    onChange={(e) => setNovaMissao({ ...novaMissao, titulo: e.target.value })}
                    required
                  />
                  <input
                    placeholder="Data da missão (Data real)"
                    value={novaMissao.data}
                    onChange={(e) => setNovaMissao({ ...novaMissao, data: e.target.value })}
                    required
                  />
                  <input
                    placeholder="Data de exibição (Ano no mundo)"
                    value={novaMissao.dataExibicao}
                    onChange={(e) => setNovaMissao({ ...novaMissao, dataExibicao: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Descrição"
                    value={novaMissao.descricao}
                    onChange={(e) => setNovaMissao({ ...novaMissao, descricao: e.target.value })}
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="XP da missão"
                    value={novaMissao.xp}
                    onChange={(e) =>
                      setNovaMissao({
                        ...novaMissao,
                        xp: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
                      })
                    }
                    required
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImagemArquivo(e.target.files[0])}
                  />
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setPdfArquivo(e.target.files[0])}
                  />
                </div>

                <div className="related-items">
                  <div className="detail-section">
                    <div className="search-select-group">
                      <input
                        type="text"
                        placeholder="Buscar personagem..."
                        value={buscaPersonagem}
                        onChange={(e) => setBuscaPersonagem(e.target.value)}
                        className="search-input-select"
                      />
                      {buscaPersonagem && (
                        <div className="search-results">
                          {getFilteredPlayers().length === 0 ? (
                            <p className="no-results">Nenhum resultado encontrado</p>
                          ) : (
                            getFilteredPlayers().map((player) => (
                              <label key={player.id} className="result-item">
                                <input
                                  type="checkbox"
                                  checked={novaMissao.personagens.includes(player.id)}
                                  onChange={() => handleToggleSelection(player.id)}
                                />
                                <span>{player.nome}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {novaMissao.personagens.length > 0 && (
                      <div className="linked-items">
                        {novaMissao.personagens.map((id) => {
                          const p = getLinkedPlayer(id);
                          return p ? (
                            <div key={id} className="item-chip">
                              <span>{p.nome}</span>
                              <button
                                type="button"
                                className="chip-remove"
                                onClick={() => handleRemoveSelection(id)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-save btn-save-sticky">
                {isEditing ? "Salvar Missão" : "Criar Missão"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Missions;
