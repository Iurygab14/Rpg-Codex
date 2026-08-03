import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import "../assets/missions.css";
import { useCampaign } from "../context/CampaignContext.jsx";

function CharacterDetails() {
  const { id } = useParams();
  const { currentCampaign } = useCampaign();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [relatedMissions, setRelatedMissions] = useState([]);

  useEffect(() => {
    if (!id || !currentCampaign?.id) return undefined;
    const charRef = doc(db, "players", id);
    const unsub = onSnapshot(charRef, (snapshot) => {
      if (snapshot.exists() && snapshot.data().campaignId === currentCampaign.id) {
        setCharacter({ id: snapshot.id, ...snapshot.data() });
      } else {
        setCharacter(null);
      }
    });
    return () => unsub();
  }, [currentCampaign?.id, id]);

  useEffect(() => {
    if (!id || !currentCampaign?.id) return undefined;
    const missionsQuery = query(
      collection(db, "missions"),
      where("campaignId", "==", currentCampaign.id),
      where("personagens", "array-contains", id)
    );
    const unsub = onSnapshot(missionsQuery, (snapshot) => {
      setRelatedMissions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [currentCampaign?.id, id]);

  if (!character) {
    return (
      <div className="page-container">
        <p>Personagem não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mission-actions">
        <button className="btn-back" onClick={() => navigate("/characters")}>← Voltar para Personagens</button>
      </div>

      <div className="mission-detail-card">
        {character.imagem && (
          <img
            src={character.imagem}
            alt={character.nome}
            className="mission-detail-image"
          />
        )}
        <div className="mission-detail-info">
          <h1>{character.nome}</h1>
          <div className="mission-detail-stats">
            <span>Raça</span>
            <p>{character.raca || "—"}</p>
          </div>
          <div className="mission-detail-stats">
            <span>Classe</span>
            <p>{character.classe || "—"}</p>
          </div>
          <div className="mission-detail-stats">
            <span>Ocupação</span>
            <p>{character.ocupacao || "—"}</p>
          </div>
          <div className="mission-detail-stats">
            <span>Status</span>
            <p>{character.status || "—"}</p>
          </div>
          <div className="mission-detail-stats">
            <span>Descrição</span>
            <p>{character.descricao || "Sem descrição."}</p>
          </div>

          <div className="related-items">
            <div className="detail-section">
              <h2>Missões vinculadas</h2>
              {relatedMissions.length === 0 ? (
                <p>Nenhuma missão vinculada.</p>
              ) : (
                <div className="related-items-list">
                  {relatedMissions
                    .sort((a, b) => Number(a.data || 0) - Number(b.data || 0))
                    .map((mission) => (
                      <Link
                        key={mission.id}
                        to={`/missions/${mission.id}`}
                        className="related-item-link"
                      >
                        {mission.dataExibicao || mission.data} — {mission.titulo}
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
