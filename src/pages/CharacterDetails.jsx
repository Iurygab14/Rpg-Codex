import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import "../assets/timeline.css";

function CharacterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);

  useEffect(() => {
    if (!id) return;
    const charRef = doc(db, "players", id);
    const unsub = onSnapshot(charRef, (snapshot) => {
      if (snapshot.exists()) {
        setCharacter({ id: snapshot.id, ...snapshot.data() });
      } else {
        setCharacter(null);
      }
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const eventsQuery = query(
      collection(db, "timeline"),
      where("personagens", "array-contains", id)
    );
    const unsub = onSnapshot(eventsQuery, (snapshot) => {
      setRelatedEvents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [id]);

  if (!character) {
    return (
      <div className="page-container">
        <p>Personagem não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="timeline-actions">
        <button className="btn-back" onClick={() => navigate("/characters")}>← Voltar para Personagens</button>
      </div>

      <div className="event-detail-card">
        {character.imagem && (
          <img
            src={character.imagem}
            alt={character.nome}
            className="event-detail-image"
          />
        )}
        <div className="event-detail-info">
          <h1>{character.nome}</h1>
          <div className="event-detail-stats">
            <span>Raça</span>
            <p>{character.raca || "—"}</p>
          </div>
          <div className="event-detail-stats">
            <span>Classe</span>
            <p>{character.classe || "—"}</p>
          </div>
          <div className="event-detail-stats">
            <span>Ocupação</span>
            <p>{character.ocupacao || "—"}</p>
          </div>
          <div className="event-detail-stats">
            <span>Status</span>
            <p>{character.status || "—"}</p>
          </div>
          <div className="event-detail-stats">
            <span>Descrição</span>
            <p>{character.descricao || "Sem descrição."}</p>
          </div>

          <div className="related-items">
            <div className="detail-section">
              <h2>Eventos Históricos</h2>
              {relatedEvents.length === 0 ? (
                <p>Nenhum evento histórico vinculado.</p>
              ) : (
                <div className="related-items-list">
                  {relatedEvents
                    .sort((a, b) => a.ano - b.ano)
                    .map((event) => (
                      <Link
                        key={event.id}
                        to={`/timeline/${event.id}`}
                        className="related-item-link"
                      >
                        {event.ano} — {event.titulo}
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

export default CharacterDetails;
