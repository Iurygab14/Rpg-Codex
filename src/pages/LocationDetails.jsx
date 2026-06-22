import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { uploadImage } from "../services/cloudinary";
import "../assets/locations.css";

function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [points, setPoints] = useState([]);
  const [historicalEvents, setHistoricalEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLocationEditModal, setShowLocationEditModal] = useState(false);
  const [imagemArquivo, setImagemArquivo] = useState(null);
  const [imagemArquivoLocation, setImagemArquivoLocation] = useState(null);
  const [novoPoint, setNovoPoint] = useState({ nome: "", descricao: "", imagem: "" });
  const [editLocationData, setEditLocationData] = useState({ nome: "", descricao: "", imagem: "" });
  const [editingPoint, setEditingPoint] = useState(null);

  useEffect(() => {
    if (!id) return;
    const locationRef = doc(db, "locations", id);
    const unsub = onSnapshot(locationRef, (snapshot) => {
      setLocation({ id: snapshot.id, ...snapshot.data() });
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "pointsOfInterest"), where("locationId", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      setPoints(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const eventsQuery = query(
      collection(db, "timeline"),
      where("localizacoes", "array-contains", id)
    );
    const unsub = onSnapshot(eventsQuery, (snapshot) => {
      setHistoricalEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [id]);

  const closePointModal = () => {
    setShowModal(false);
    setEditingPoint(null);
    setImagemArquivo(null);
    setNovoPoint({ nome: "", descricao: "", imagem: "" });
  };

  const openNewPointModal = () => {
    setEditingPoint(null);
    setNovoPoint({ nome: "", descricao: "", imagem: "" });
    setImagemArquivo(null);
    setShowModal(true);
  };

  const openEditPointModal = (point) => {
    setEditingPoint(point);
    setNovoPoint({ nome: point.nome || "", descricao: point.descricao || "", imagem: point.imagem || "" });
    setImagemArquivo(null);
    setShowModal(true);
  };

  const openEditLocationModal = () => {
    if (!location) return;
    setEditLocationData({ nome: location.nome || "", descricao: location.descricao || "", imagem: location.imagem || "" });
    setImagemArquivoLocation(null);
    setShowLocationEditModal(true);
  };

  const closeLocationEditModal = () => {
    setShowLocationEditModal(false);
    setImagemArquivoLocation(null);
  };

  const handleSubmitPoint = async (event) => {
    event.preventDefault();
    if (!novoPoint.nome.trim() || !novoPoint.descricao.trim()) return;

    let imageUrl = novoPoint.imagem;
    if (imagemArquivo) {
      imageUrl = await uploadImage(imagemArquivo);
    }

    if (editingPoint) {
      const pointRef = doc(db, "pointsOfInterest", editingPoint.id);
      await updateDoc(pointRef, {
        nome: novoPoint.nome.trim(),
        descricao: novoPoint.descricao.trim(),
        imagem: imageUrl,
      });
    } else {
      await addDoc(collection(db, "pointsOfInterest"), {
        nome: novoPoint.nome.trim(),
        descricao: novoPoint.descricao.trim(),
        imagem: imageUrl,
        locationId: id,
        criadoEm: serverTimestamp(),
      });
    }

    closePointModal();
  };

  const handleDeletePoint = async (pointId) => {
    const confirmation = window.confirm("Tem certeza que deseja excluir esta localização interna?");
    if (!confirmation) return;

    await deleteDoc(doc(db, "pointsOfInterest", pointId));
  };

  const handleEditLocation = async (event) => {
    event.preventDefault();
    if (!editLocationData.nome.trim() || !editLocationData.descricao.trim()) return;

    let imageUrl = editLocationData.imagem;
    if (imagemArquivoLocation) {
      imageUrl = await uploadImage(imagemArquivoLocation);
    }

    const locationRef = doc(db, "locations", id);
    await updateDoc(locationRef, {
      nome: editLocationData.nome.trim(),
      descricao: editLocationData.descricao.trim(),
      imagem: imageUrl,
    });

    setShowLocationEditModal(false);
  };

  if (!location) {
    return <div className="page-container">Carregando localização...</div>;
  }

  return (
    <div className="page-container">
      <div className="header-actions-location">
        <div className="action-bar">
          <button className="btn-back" onClick={() => navigate("/locations")}>← Voltar para Localizações</button>
          <div className="action-buttons-row">
            <button className="btn-add-main" onClick={openEditLocationModal}>
              Editar Localização
            </button>
            <button className="btn-add-main" onClick={openNewPointModal}>
              + Adicionar Localização
            </button>
          </div>
        </div>
      </div>

      <div className="location-detail-card">
        {location.imagem && (
          <img className="location-detail-image" src={location.imagem} alt={location.nome} />
        )}

        <div className="location-detail-info">
          <h1>{location.nome}</h1>
          <p>{location.descricao || "Sem descrição."}</p>

          <div className="detail-row">
            <span>Localizações internas</span>
            <p>{points.length} registro(s)</p>
          </div>
        </div>
      </div>

      <section className="points-section">
        <div className="points-header">
          <h2>Localizações internas</h2>
          <p>{points.length} registro(s)</p>
        </div>

        {points.length === 0 ? (
          <p>Esta localização ainda não tem pontos de interesse cadastrados.</p>
        ) : (
          <ul className="points-list">
            {points.map((point) => (
              <li key={point.id} className="point-item">
                <div className="point-card">
                  {point.imagem && <img src={point.imagem} alt={point.nome} />}
                  <div className="point-card-body">
                    <strong>{point.nome}</strong>
                    <p>{point.descricao}</p>
                  </div>
                  <div className="point-card-actions">
                    <button type="button" className="btn-edit" onClick={() => openEditPointModal(point)}>
                      ✏️
                    </button>
                    <button type="button" className="btn-delete" onClick={() => handleDeletePoint(point.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="points-section">
        <div className="points-header">
          <h2>Eventos Históricos</h2>
          <p>{historicalEvents.length} registro(s)</p>
        </div>

        {historicalEvents.length === 0 ? (
          <p>Esta localização ainda não tem eventos vinculados.</p>
        ) : (
          <div className="points-list">
            {historicalEvents
              .sort((a, b) => a.ano - b.ano)
              .map((event) => (
                <div key={event.id} className="point-card">
                  {event.imagem && <img src={event.imagem} alt={event.titulo} />}
                  <div className="point-card-body">
                    <strong>{event.titulo}</strong>
                    <p>{event.ano} — {event.dataExibicao}</p>
                  </div>
                  <div className="point-card-actions">
                    <Link to={`/timeline/${event.id}`} className="btn-save">Ver</Link>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {showLocationEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={closeLocationEditModal}>X</button>
            <h3>Editar Localização</h3>
            <form onSubmit={handleEditLocation}>
              <input
                placeholder="Nome"
                value={editLocationData.nome}
                onChange={(e) => setEditLocationData({ ...editLocationData, nome: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImagemArquivoLocation(e.target.files[0])}
              />
              <textarea
                placeholder="Descrição"
                value={editLocationData.descricao}
                onChange={(e) => setEditLocationData({ ...editLocationData, descricao: e.target.value })}
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
            <button className="btn-close" onClick={closePointModal}>X</button>
            <h3>{editingPoint ? "Editar localização interna" : "Nova localização interna"}</h3>
            <form onSubmit={handleSubmitPoint}>
              <input
                placeholder="Nome"
                value={novoPoint.nome}
                onChange={(e) => setNovoPoint({ ...novoPoint, nome: e.target.value })}
                required
              />
              <textarea
                placeholder="Descrição"
                value={novoPoint.descricao}
                onChange={(e) => setNovoPoint({ ...novoPoint, descricao: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImagemArquivo(e.target.files[0])}
              />
              <button type="submit" className="btn-save">
                {editingPoint ? "Salvar Alterações" : "Salvar localização interna"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationDetails;
