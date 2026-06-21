import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore"; 
import "../assets/locationCard.css";

function LocationCard({ location, onEdit }) {
  const navigate = useNavigate();

  const handleExcluir = async (event) => {
    event.stopPropagation();
    const confirmar = window.confirm(`Deseja mesmo excluir ${location.nome}?`);
    
    if (confirmar) {
      try {
        const docRef = doc(db, "locations", location.id); 
        await deleteDoc(docRef); 
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  return (
    <div className="location-card" onClick={() => navigate(`/locations/${location.id}`)}>
      <div className="card-actions">
        <button className="btn-edit" onClick={(event) => { event.stopPropagation(); onEdit(location); }}>✏️</button>
        <button className="btn-delete" onClick={handleExcluir}>🗑️</button>
      </div>

      <img 
        src={location.imagem} 
        alt={location.nome} 
        className="loc-image" 
      />

      <div className="loc-info">
        <div className="loc-details">
            <h3>{location.nome}</h3>
            <p>{location.descricao}</p>
        </div>        
      </div>
    </div>
  );
}

export default LocationCard;