import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import "../assets/missions.css";

function MissionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState(null);
  const [relatedCharacters, setRelatedCharacters] = useState([]);

  useEffect(() => {
    if (!id) return;
    const missionRef = doc(db, "missions", id);
    const unsub = onSnapshot(missionRef, (snapshot) => {
      if (snapshot.exists()) {
        setMission({ id: snapshot.id, ...snapshot.data() });
      } else {
        setMission(null);
      }
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!mission) return;

      const characterPromises = (mission.personagens || []).map((charId) =>
        getDoc(doc(db, "players", charId))
      );

      const characterDocs = await Promise.all(characterPromises);
      setRelatedCharacters(
        characterDocs
          .filter((doc) => doc.exists())
          .map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };

    loadRelated();
  }, [mission]);

  if (!mission) {
    return (
      <div className="page-container">
        <p>Missão não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mission-actions">
        <button className="btn-back" onClick={() => navigate("/missions")}>← Voltar para Missões</button>
      </div>

      <div className="mission-detail-card">
        {mission.imagem && (
          <img src={mission.imagem} alt={mission.titulo} className="mission-detail-image" />
        )}

        <div className="mission-detail-info">
          <h1>{mission.titulo}</h1>
          <div className="mission-detail-stats">
            <h2>Data</h2>
            <p>{mission.dataExibicao || mission.data}</p>
          </div>
          <div className="mission-detail-stats">
            <h2>Descrição</h2>
            <p>{mission.descricao}</p>
          </div>
          <div className="mission-detail-stats">
            <h2>XP concedido</h2>
            <p>{Number(mission.xp ?? 0)} XP</p>
          </div>

          <div className="related-items">
            <div className="detail-section">
              <h2>Personagens participantes</h2>
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
              <h2>Relatório</h2>
              {mission.relatorioUrl ? (
                <a
                  href={mission.relatorioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-save"
                  style={{ display: "inline-flex", justifyContent: "center", textDecoration: "none" }}
                >
                  📄 Baixar Relatório
                </a>
              ) : (
                <p>Nenhum relatório anexado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionDetails;
