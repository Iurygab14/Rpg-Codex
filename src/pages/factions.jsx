import { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { uploadImage } from "../services/cloudinary";
import FactionCard from "../components/FactionCard.jsx";
import "../assets/factions.css";

function Factions() {
  const [lista, setLista] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [buscaNome, setBuscaNome] = useState("");
  const [imagemArquivo, setImagemArquivo] = useState(null);
  const [novaFaction, setNovaFaction] = useState({
    nome: "",
    imagem: "",
    descricao: "",
    lider: "",
    sede: "",
    objetivos: "",
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "factions"), (snapshot) => {
      const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLista(dados);
    });

    return () => unsub();
  }, []);

  const handleOpenEdit = (faction) => {
    setNovaFaction(faction);
    setCurrentId(faction.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
    setImagemArquivo(null);
    setNovaFaction({
      nome: "",
      imagem: "",
      descricao: "",
      lider: "",
      sede: "",
      objetivos: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = novaFaction.imagem;
    if (imagemArquivo) {
      imageUrl = await uploadImage(imagemArquivo);
    }

    const dadosParaSalvar = {
      ...novaFaction,
      imagem: imageUrl,
    };

    delete dadosParaSalvar.id;

    if (isEditing) {
      await updateDoc(doc(db, "factions", currentId), dadosParaSalvar);
    } else {
      await addDoc(collection(db, "factions"), {
        ...dadosParaSalvar,
        criadoEm: serverTimestamp(),
      });
    }

    fecharModal();
  };

  return (
    <div className="page-container">
      <div className="header-actions-faction">
        <div className="action-bar">
          <button className="btn-add-main" onClick={() => setShowModal(true)}>
            + Nova Facção
          </button>

          <div className="search-container-faction">
            <div className="filter-header-faction">
              <span>FILTROS DE BUSCA</span>
            </div>
            <div className="filter-inputs-faction">
              <label>
                Nome
                <input
                  type="text"
                  placeholder="Ex: Irmandade Sombria..."
                  value={buscaNome}
                  onChange={(e) => setBuscaNome(e.target.value)}
                  className="search-input-faction"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={fecharModal}>
              X
            </button>
            <h3>{isEditing ? "Editar Facção" : "Nova Facção"}</h3>

            <form onSubmit={handleSubmit}>
              <input
                placeholder="Nome"
                value={novaFaction.nome}
                onChange={(e) => setNovaFaction({ ...novaFaction, nome: e.target.value })}
                required
              />
              <input type="file" accept="image/*" onChange={(e) => setImagemArquivo(e.target.files[0])} />
              <input
                placeholder="Líder"
                value={novaFaction.lider}
                onChange={(e) => setNovaFaction({ ...novaFaction, lider: e.target.value })}
                required
              />
              <input
                placeholder="Sede"
                value={novaFaction.sede}
                onChange={(e) => setNovaFaction({ ...novaFaction, sede: e.target.value })}
                required
              />
              <textarea
                placeholder="Descrição"
                value={novaFaction.descricao}
                onChange={(e) => setNovaFaction({ ...novaFaction, descricao: e.target.value })}
                required
              />
              <textarea
                placeholder="Objetivos"
                value={novaFaction.objetivos}
                onChange={(e) => setNovaFaction({ ...novaFaction, objetivos: e.target.value })}
                required
              />
              <button type="submit" className="btn-save">
                {isEditing ? "Salvar Alterações" : "Registrar Facção"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="factions-grid">
        {lista
          .filter((f) => f.nome.toLowerCase().includes(buscaNome.toLowerCase().trim()))
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((faction) => (
            <FactionCard key={faction.id} faction={faction} onEdit={handleOpenEdit} />
          ))}
      </div>
    </div>
  );
}

export default Factions;
