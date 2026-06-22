import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore";
import "../assets/timeline.css";

function TimelineCard({ event, onEdit }) {
  const navigate = useNavigate();

  const handleExcluir = async (e) => {
    e.stopPropagation();
    const confirmar = window.confirm(`Deseja excluir o evento ${event.titulo}?`);
    if (!confirmar) return;

    try {
      await deleteDoc(doc(db, "timeline", event.id));
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
    }
  };

  return (
    <div className="timeline-card" onClick={() => navigate(`/timeline/${event.id}`)}>
      <div className="timeline-card-actions">
        {onEdit && (
          <button
            className="btn-edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            title="Editar evento"
          >
            ✏️
          </button>
        )}
        <button
          className="btn-delete"
          onClick={handleExcluir}
          title="Excluir evento"
        >
          🗑️
        </button>
      </div>

      {event.imagem ? (
        <img
          src={event.imagem}
          alt={event.titulo}
          className="timeline-card-image"
        />
      ) : (
        <div className="timeline-card-image timeline-card-image-placeholder">
          Sem imagem
        </div>
      )}

      <div className="timeline-card-body">
        <span className="timeline-card-date">{event.dataExibicao}</span>
        <h3>{event.titulo}</h3>
        <p>
          {event.descricao?.length > 150
            ? `${event.descricao.slice(0, 150)}...`
            : event.descricao || "Sem descrição."}
        </p>
      </div>
    </div>
  );
}

export default TimelineCard;
