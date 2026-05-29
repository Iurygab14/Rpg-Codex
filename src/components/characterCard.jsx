import "../assets/characterCard.css";
import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore"; 

function CharacterCard({ player, onEdit }) {

  const handleExcluir = async () => {
    const confirmar = window.confirm(`Deseja mesmo excluir ${player.nome}?`);
    if (confirmar) {
      try {
        const docRef = doc(db, "players", player.id); 
        await deleteDoc(docRef); 
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  return (
    <div className="character-card">
      <div className="card-actions">
        <button className="btn-edit" onClick={() => onEdit(player)} title="Editar">✏️</button>
        <button className="btn-delete" onClick={handleExcluir} title="Excluir">🗑️</button>
      </div>

      <img src={player.imagem} alt={player.nome} className="char-image" />

      <div className="char-info">
        <div className="char-details">
            <h3>{player.nome}</h3>
            
            {player.tipo === "Principais" && (
              <>
                <p><strong>Classe:</strong> {player.classe}</p>
                <p><strong>Raça:</strong> {player.raca}</p>
                <p><strong>Level:</strong> {player.lvl}</p>
                <p><strong>Alinhamento:</strong> {player.alinhamento}</p>
                <p><strong>Jogador:</strong> {player.jogador}</p>
              </>
            )}
              
            {player.tipo === "NPCs" && (
              <div className="npc-info">
                <p><strong>Raça:</strong> {player.raca}</p>
                <p><strong>Localização:</strong> {player.localizacao}</p>
                <p><strong>Reino:</strong> {player.reino}</p>
                <p><strong>Ocupação:</strong> {player.ocupacao}</p>
                <p className="char-desc">{player.descricao}</p>
              </div>
            )}
        </div>

        {/* COLUNA DA DIREITA (Agora para ambos os tipos) */}
        <div className="side-stats">
          {player.tipo === "Principais" ? (
            <div className="combat-stats">
              <p className="stat-hp">❤️ HP: {player.hp}</p>
              <p>🛡️ AC: {player.ac}</p>
              <p>⚡ Ini: {player.iniciativa}</p>
              <p className={`status-${player.status?.toLowerCase() || 'vivo'}`}>
                ● {player.status || "Vivo"}
              </p>
            </div>
          ) : (
            /* Layout para NPCs: Apenas o Status à direita */
            <div className="npc-side-info">
               <p className={`status-${player.status?.toLowerCase() || 'vivo'}`}>
                ● {player.status || "Vivo"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CharacterCard;