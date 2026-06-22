import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
import "../assets/timeline.css";

function TimelineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [relatedCharacters, setRelatedCharacters] = useState([]);
  const [relatedFactions, setRelatedFactions] = useState([]);
  const [relatedLocations, setRelatedLocations] = useState([]);

  useEffect(() => {
    if (!id) return;
    const eventRef = doc(db, "timeline", id);
    const unsub = onSnapshot(eventRef, (snapshot) => {
      if (snapshot.exists()) {
        setEvent({ id: snapshot.id, ...snapshot.data() });
      } else {
        setEvent(null);
      }
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!event) return;

      const characterPromises = (event.personagens || []).map((charId) =>
        getDoc(doc(db, "players", charId))
      );
      const factionPromises = (event.faccoes || []).map((factionId) =>
        getDoc(doc(db, "factions", factionId))
      );
      const locationPromises = (event.localizacoes || []).map((locationId) =>
        getDoc(doc(db, "locations", locationId))
      );

      const [characterDocs, factionDocs, locationDocs] = await Promise.all([
        Promise.all(characterPromises),
        Promise.all(factionPromises),
        Promise.all(locationPromises),
      ]);

      setRelatedCharacters(
        characterDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setRelatedFactions(
        factionDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setRelatedLocations(
        locationDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };

    loadRelated();
  }, [event]);

  if (!event) {
    return (
      <div className="page-container">
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="timeline-actions">
        <button className="btn-back" onClick={() => navigate("/timeline")}>← Voltar para Cronologia</button>
      </div>

      <div className="event-detail-card">
        {event.imagem && (
          <img
            src={event.imagem}
            alt={event.titulo}
            className="event-detail-image"
          />
        )}

        <div className="event-detail-info">
          <h1>{event.titulo}</h1>
          <div className="event-detail-stats">
            <h2>Data de exibição</h2>
            <p>{event.dataExibicao}</p>
          </div>
          <div className="event-detail-stats">
            <h2>Descrição</h2>
            <p>{event.descricao}</p>
          </div>

          <div className="related-items">
            <div className="detail-section">
              <h2>Personagens Relacionados</h2>
              {relatedCharacters.length === 0 ? (
                <p>Nenhum personagem vinculado.</p>
              ) : (
                <div className="related-items-list">
                  {relatedCharacters.map((character) => (
                    <Link
                      key={character.id}
                      to={`/characters/${character.id}`}
                      className="related-item-link"
                    >
                      {character.nome}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-section">
              <h2>Facções Relacionadas</h2>
              {relatedFactions.length === 0 ? (
                <p>Nenhuma facção vinculada.</p>
              ) : (
                <div className="related-items-list">
                  {relatedFactions.map((faction) => (
                    <Link
                      key={faction.id}
                      to={`/factions/${faction.id}`}
                      className="related-item-link"
                    >
                      {faction.nome}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="detail-section">
              <h2>Localizações Relacionadas</h2>
              {relatedLocations.length === 0 ? (
                <p>Nenhuma localização vinculada.</p>
              ) : (
                <div className="related-items-list">
                  {relatedLocations.map((location) => (
                    <Link
                      key={location.id}
                      to={`/locations/${location.id}`}
                      className="related-item-link"
                    >
                      {location.nome}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimelineDetails;
