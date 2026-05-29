import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore"; 
import "../assets/locationCard.css";

function LocationCard({ location, onEdit }) {
    const handleExcluir = async () => {
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
    <div className="location-card">
      
      <div className="card-actions">
        <button className="btn-edit" onClick={() => onEdit(location)}>✏️</button>
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
            <p><strong>Localização:</strong> {location.localizacao}</p>
            <p><strong></strong> {location.descricao}</p>
        </div>        
      </div>
    </div>
  );
}

export default LocationCard;