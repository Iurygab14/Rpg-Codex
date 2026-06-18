import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore";
import "../assets/factionCard.css";

function FactionCard({ faction, onEdit }) {
  const navigate = useNavigate();

  const handleExcluir = async () => {
    const confirmar = window.confirm(`Deseja mesmo excluir ${faction.nome}?`);
    if (!confirmar) return;

    try {
      const docRef = doc(db, "factions", faction.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  return (
    <div className="faction-card" onClick={() => navigate(`/factions/${faction.id}`)}>
      <div className="card-actions">
        {onEdit && (
          <button
            className="btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(faction);
            }}
            title="Editar"
          >
            ✏️
          </button>
        )}
        <button
          className="btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            handleExcluir();
          }}
          title="Excluir"
        >
          🗑️
        </button>
      </div>

      <img
        src={faction.imagem}
        alt={faction.nome}
        className="faction-image"
      />

      <div className="faction-info">
        <h3>{faction.nome}</h3>
        <p>
          {faction.descricao?.length > 140
            ? `${faction.descricao.slice(0, 140)}...`
            : faction.descricao}
        </p>
      </div>
    </div>
  );
}

export default FactionCard;
