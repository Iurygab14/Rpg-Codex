import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore";
import "../assets/bestiaryCard.css";

function BestiaryCard({ criatura, onEdit }) {

  const handleExcluir = async () => {

    const confirmar = window.confirm(
      `Deseja mesmo excluir ${criatura.nome}?`
    );

    if (confirmar) {
      try {

        const docRef = doc(
          db,
          "bestiary",
          criatura.id
        );

        await deleteDoc(docRef);

      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  return (
    <div className="beast-card">

      <div className="card-actions">
        <button
          className="btn-edit"
          onClick={() => onEdit(criatura)}
        >
          ✏️
        </button>

        <button
          className="btn-delete"
          onClick={handleExcluir}
        >
          🗑️
        </button>
      </div>

      <img
        src={criatura.imagem}
        alt={criatura.nome}
        className="beast-image"
      />

      <div className="beast-info">

        <div className="beast-details">

          <h3>{criatura.nome}</h3>

          <p>
            <strong>Tipo:</strong> {criatura.tipo}
          </p>

          <p>
            <strong>Categoria:</strong> {criatura.categoria}
          </p>

          <p>
            <strong>ND:</strong> {criatura.desafio}
          </p>

          <p>{criatura.descricao}</p>

        </div>

      </div>

    </div>
  );
}

export default BestiaryCard;