import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore";
import "../assets/missions.css";

function MissionCard({ mission, onEdit }) {
  const navigate = useNavigate();

  const handleExcluir = async (e) => {
    e.stopPropagation();
    const confirmar = window.confirm(`Deseja excluir a missão ${mission.titulo}?`);
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "missions", mission.id));
    } catch (error) {
      console.error("Erro ao excluir missão:", error);
    }
  };

  return (
    <div className="mission-card" onClick={() => navigate(`/missions/${mission.id}`)}>
      <div className="mission-card-actions">
        {onEdit && (
          <button
            className="btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(mission);
            }}
            title="Editar missão"
          >
            ✏️
          </button>
        )}
        <button
          className="btn-delete"
          onClick={handleExcluir}
          title="Excluir missão"
        >
          🗑️
        </button>
      </div>

      {mission.imagem ? (
        <img
          src={mission.imagem}
          alt={mission.titulo}
          className="mission-card-image"
        />
      ) : (
        <div className="mission-card-image mission-card-image-placeholder">
          Sem imagem
        </div>
      )}

      <div className="mission-card-body">
        <span className="mission-card-date">{mission.dataExibicao}</span>
        <h3>{mission.titulo}</h3>
        <p>
          {mission.descricao?.length > 150
            ? `${mission.descricao.slice(0, 150)}...`
            : mission.descricao || "Sem descrição."}
        </p>
        <span className="mission-card-meta">
          ⭐ XP: {Number(mission.xp ?? 0)}
        </span>
        <span className="mission-card-meta">
          {mission.personagens?.length || 0} personagem(s) participante(s)
        </span>
      </div>
    </div>
  );
}

export default MissionCard;
