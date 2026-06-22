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
import { uploadImage } from "../services/cloudinary";
import TimelineCard from "../components/TimelineCard.jsx";
import "../assets/timeline.css";

function Timeline() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [buscaTitulo, setBuscaTitulo] = useState("");
  const [imagemArquivo, setImagemArquivo] = useState(null);
  const [players, setPlayers] = useState([]);
  const [factions, setFactions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [buscaPersonagem, setBuscaPersonagem] = useState("");
  const [buscaFaccao, setBuscaFaccao] = useState("");
  const [buscaLocalizacao, setBuscaLocalizacao] = useState("");

  const [novoEvento, setNovoEvento] = useState({
    titulo: "",
    dataExibicao: "",
    descricao: "",
    imagem: "",
    personagens: [],
    faccoes: [],
    localizacoes: [],
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "timeline"), (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEvents(dados);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubPlayers = onSnapshot(collection(db, "players"), (snapshot) => {
      setPlayers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubFactions = onSnapshot(collection(db, "factions"), (snapshot) => {
      setFactions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
      setLocations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPlayers();
      unsubFactions();
      unsubLocations();
    };
  }, []);

  const handleOpenEdit = (event) => {
    setNovoEvento({
      titulo: event.titulo || "",
      dataExibicao: event.dataExibicao || "",
      descricao: event.descricao || "",
      imagem: event.imagem || "",
      personagens: event.personagens || [],
      faccoes: event.faccoes || [],
      localizacoes: event.localizacoes || [],
    });
    setCurrentId(event.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
    setImagemArquivo(null);
    setBuscaPersonagem("");
    setBuscaFaccao("");
    setBuscaLocalizacao("");
    setNovoEvento({
      titulo: "",
      dataExibicao: "",
      descricao: "",
      imagem: "",
      personagens: [],
      faccoes: [],
      localizacoes: [],
    });
  };

  const handleToggleSelection = (key, id) => {
    setNovoEvento((prev) => {
      const list = prev[key] || [];
      const newList = list.includes(id)
        ? list.filter((item) => item !== id)
        : [...list, id];
      return {
        ...prev,
        [key]: newList,
      };
    });
  };

  const handleRemoveSelection = (key, id) => {
    setNovoEvento((prev) => {
      const list = prev[key] || [];
      return {
        ...prev,
        [key]: list.filter((item) => item !== id),
      };
    });
  };

  const getFilteredPlayers = () => {
    return players
      .filter((p) => p.nome.toLowerCase().includes(buscaPersonagem.toLowerCase()))
      .slice(0, 5);
  };

  const getFilteredFactions = () => {
    return factions
      .filter((f) => f.nome.toLowerCase().includes(buscaFaccao.toLowerCase()))
      .slice(0, 5);
  };

  const getFilteredLocations = () => {
    return locations
      .filter((l) => l.nome.toLowerCase().includes(buscaLocalizacao.toLowerCase()))
      .slice(0, 5);
  };

  const getLinkedPlayer = (id) => players.find((p) => p.id === id);
  const getLinkedFaction = (id) => factions.find((f) => f.id === id);
  const getLinkedLocation = (id) => locations.find((l) => l.id === id);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!novoEvento.titulo.trim() || !novoEvento.dataExibicao.trim() || !novoEvento.descricao.trim()) {
      return;
    }

    let imageUrl = novoEvento.imagem;
    if (imagemArquivo) {
      imageUrl = await uploadImage(imagemArquivo);
    }

    const dadosParaSalvar = {
      ...novoEvento,
      imagem: imageUrl,
    };

    delete dadosParaSalvar.id;

    if (isEditing && currentId) {
      await updateDoc(doc(db, "timeline", currentId), dadosParaSalvar);
    } else {
      await addDoc(collection(db, "timeline"), {
        ...dadosParaSalvar,
        criadoEm: serverTimestamp(),
      });
    }

    fecharModal();
  };

  const eventosFiltrados = events
    .filter((event) =>
      event.titulo.toLowerCase().includes(buscaTitulo.toLowerCase().trim())
    )
    .sort((a, b) => (a.dataExibicao || "").localeCompare(b.dataExibicao || ""));

  return (
    <div className="page-container">
      <div className="header-actions-timeline">
        <div className="timeline-actions">
          <button className="btn-add-main" onClick={() => setShowModal(true)}>
            + Novo Evento
          </button>
          <div className="search-container-timeline">
            <div className="filter-header-timeline">Filtros de busca</div>
            <div className="filter-inputs-timeline">
            
                <input 
                  type="text"
                  placeholder="Ex: Guerra dos Três Reinos..."
                  value={buscaTitulo}
                  onChange={(e) => setBuscaTitulo(e.target.value)}
                  className="search-input-timeline"
                />
            </div>
          </div>
        </div>
      </div>

      <section className="timeline-summary">
        <h1>Cronologia</h1>
        <p>Cadastre e organize os eventos históricos do mundo por ano. Clique em um card para abrir os detalhes do evento.</p>
      </section>

      <div className="timeline-group">
        {eventosFiltrados.length === 0 ? (
          <p className="empty-state">Nenhum evento cadastrado ainda.</p>
        ) : (
          <div className="timeline-events-list">
            {eventosFiltrados.map((event) => (
              <TimelineCard key={event.id} event={event} onEdit={handleOpenEdit} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-scrollable">
            <button className="btn-close" onClick={fecharModal}>X</button>
            <h3>{isEditing ? "Editar Evento" : "Novo Evento Histórico"}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-scroll-container">
                <div className="event-meta">
                    <input
                      placeholder="Título"
                      value={novoEvento.titulo}
                      onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                      required
                    />
                    <input
                      placeholder="Data de Exibição (ex: Primavera de 1420)"
                      value={novoEvento.dataExibicao}
                      onChange={(e) => setNovoEvento({ ...novoEvento, dataExibicao: e.target.value })}
                      required
                    />
                    <textarea
                      placeholder="Descrição"
                      value={novoEvento.descricao}
                      onChange={(e) => setNovoEvento({ ...novoEvento, descricao: e.target.value })}
                      required
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImagemArquivo(e.target.files[0])}
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
                                  checked={novoEvento.personagens.includes(player.id)}
                                  onChange={() => handleToggleSelection("personagens", player.id)}
                                />
                                <span>{player.nome}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {novoEvento.personagens.length > 0 && (
                      <div className="linked-items">
                        {novoEvento.personagens.map((id) => {
                          const p = getLinkedPlayer(id);
                          return p ? (
                            <div key={id} className="item-chip">
                              <span>{p.nome}</span>
                              <button
                                type="button"
                                className="chip-remove"
                                onClick={() => handleRemoveSelection("personagens", id)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <div className="search-select-group">
                      <input
                        type="text"
                        placeholder="Buscar facção..."
                        value={buscaFaccao}
                        onChange={(e) => setBuscaFaccao(e.target.value)}
                        className="search-input-select"
                      />
                      {buscaFaccao && (
                        <div className="search-results">
                          {getFilteredFactions().length === 0 ? (
                            <p className="no-results">Nenhum resultado encontrado</p>
                          ) : (
                            getFilteredFactions().map((faction) => (
                              <label key={faction.id} className="result-item">
                                <input
                                  type="checkbox"
                                  checked={novoEvento.faccoes.includes(faction.id)}
                                  onChange={() => handleToggleSelection("faccoes", faction.id)}
                                />
                                <span>{faction.nome}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {novoEvento.faccoes.length > 0 && (
                      <div className="linked-items">
                        {novoEvento.faccoes.map((id) => {
                          const f = getLinkedFaction(id);
                          return f ? (
                            <div key={id} className="item-chip">
                              <span>{f.nome}</span>
                              <button
                                type="button"
                                className="chip-remove"
                                onClick={() => handleRemoveSelection("faccoes", id)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <div className="search-select-group">
                      <input
                        type="text"
                        placeholder="Buscar localização..."
                        value={buscaLocalizacao}
                        onChange={(e) => setBuscaLocalizacao(e.target.value)}
                        className="search-input-select"
                      />
                      {buscaLocalizacao && (
                        <div className="search-results">
                          {getFilteredLocations().length === 0 ? (
                            <p className="no-results">Nenhum resultado encontrado</p>
                          ) : (
                            getFilteredLocations().map((location) => (
                              <label key={location.id} className="result-item">
                                <input
                                  type="checkbox"
                                  checked={novoEvento.localizacoes.includes(location.id)}
                                  onChange={() => handleToggleSelection("localizacoes", location.id)}
                                />
                                <span>{location.nome}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {novoEvento.localizacoes.length > 0 && (
                      <div className="linked-items">
                        {novoEvento.localizacoes.map((id) => {
                          const l = getLinkedLocation(id);
                          return l ? (
                            <div key={id} className="item-chip">
                              <span>{l.nome}</span>
                              <button
                                type="button"
                                className="chip-remove"
                                onClick={() => handleRemoveSelection("localizacoes", id)}
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
                {isEditing ? "Salvar Alterações" : "Registrar Evento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timeline;
