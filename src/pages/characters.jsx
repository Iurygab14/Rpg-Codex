import { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import { collection, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import CharacterCard from "../components/characterCard.jsx";
import "../assets/characters.css"
import { uploadImage } from "../services/cloudinary";
import { serverTimestamp } from "firebase/firestore";

function Characters() {
  const [lista, setLista] = useState([]);
  const [showModal, setShowModal] = useState(false); 
  const [isEditing, setIsEditing] = useState(false); 
  const [currentId, setCurrentId] = useState(null);
  
  // Estados de busca
  const [buscaNome, setBuscaNome] = useState("");
  const [buscaRaca, setBuscaRaca] = useState("");
  const [buscaClasse, setBuscaClasse] = useState("");
  const [buscaStatus, setBuscaStatus] = useState("");
  const [buscaTipo, setBuscaTipo] = useState("");
  const [imagemArquivo, setImagemArquivo] = useState(null);

  const [novoChar, setNovoChar] = useState({
    nome: "", imagem: "", tipo: "NPCs",
    classe: "", raca: "", lvl: "", jogador: "", alinhamento: "",
    localizacao: "", reino: "", ocupacao: "", descricao: "", 
    hp: "", ac: "", iniciativa: "", status: "Vivo"
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "players"), (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLista(dados);
    });
    return () => unsub();
  }, []);

  const handleOpenEdit = (player) => {
    setNovoChar(player); 
    setCurrentId(player.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
    setNovoChar({ 
      nome: "", imagem: "", tipo: "NPCs",
      classe: "", raca: "", lvl: "", jogador: "", alinhamento: "",
      localizacao: "", reino: "", ocupacao: "", descricao: "", 
      hp: "", ac: "", iniciativa: "", status: "Vivo" 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = novoChar.imagem;

    if (imagemArquivo) {
      imageUrl = await uploadImage(imagemArquivo);
    }

    const dadosParaSalvar = {
      ...novoChar,
      imagem: imageUrl,
    };

    delete dadosParaSalvar.id;

    if (isEditing) {
      await updateDoc(
        doc(db, "players", currentId),
        dadosParaSalvar
      );
    } else {
      await addDoc(collection(db, "players"), {
        ...dadosParaSalvar,
        criadoEm: serverTimestamp(),
      });
    }

    fecharModal();
  };

  return (
    <div className="page-container">
      <div className="header-actions-char">
        <div className="action-bar">
          <button className="btn-add-main" onClick={() => setShowModal(true)}>
            + Novo Peronagem
          </button>
          <div className="search-container-char">
            <div className="filter-header-char"><span>FILTROS DE BUSCA</span></div>
            <div className="filter-inputs-char">
              <label>Nome
                <input type="text" placeholder="Ex: Azimeth..." value={buscaNome} onChange={(e) => setBuscaNome(e.target.value)} className="search-input-char" />
              </label>
              <label>Raça
                <input type="text" placeholder="Ex: Humano..." value={buscaRaca} onChange={(e) => setBuscaRaca(e.target.value)} className="search-input-char" />
              </label>
              <label>Classe
                <input type="text" placeholder="Ex: Guerreiro..." value={buscaClasse} onChange={(e) => setBuscaClasse(e.target.value)} className="search-input-char" />
              </label>
              <label>Status
                <select value={buscaStatus} onChange={(e) => setBuscaStatus(e.target.value)} className="search-input-char">
                  <option value="">Todos</option>
                  <option value="Vivo">Vivo</option>
                  <option value="Morto">Morto</option>
                  <option value="Desaparecido">Desaparecido</option>
                </select>
              </label>
              <label>Tipo
                <select value={buscaTipo} onChange={(e) => setBuscaTipo(e.target.value)} className="search-input-char">
                  <option value="">Todos</option>
                  <option value="Principais">Principais</option>
                  <option value="NPCs">NPCs</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={fecharModal}>X</button>
            <h3>{isEditing ? "Editar Registro" : "Novo Personagem"}</h3>
            
            <form onSubmit={handleSubmit}>
              <input placeholder="Nome" value={novoChar.nome} onChange={(e) => setNovoChar({...novoChar, nome: e.target.value})} required />
              <input placeholder="Raça" value={novoChar.raca} onChange={(e) => setNovoChar({...novoChar, raca: e.target.value})} required />

              <input type="file" accept="image/*" onChange={(e) => setImagemArquivo(e.target.files[0])}/>
              
              {novoChar.tipo === "Principais" ? (
                <>
                  <input placeholder="Classe" value={novoChar.classe} onChange={(e) => setNovoChar({...novoChar, classe: e.target.value})} required />
                  <div className="input-row">
                    <input type="number" placeholder="Lvl" value={novoChar.lvl} onChange={(e) => setNovoChar({...novoChar, lvl: e.target.value})} required />
                    <input placeholder="Jogador" value={novoChar.jogador} onChange={(e) => setNovoChar({...novoChar, jogador: e.target.value})} required />
                  </div>
                  <div className="input-row">
                    <input type="number" placeholder="HP" value={novoChar.hp} onChange={(e) => setNovoChar({...novoChar, hp: e.target.value})} required />
                    <input type="number" placeholder="AC" value={novoChar.ac} onChange={(e) => setNovoChar({...novoChar, ac: e.target.value})} required />
                    <select value={novoChar.status} onChange={(e) => setNovoChar({...novoChar, status: e.target.value})} required>
                      <option value="Vivo">Vivo</option>
                      <option value="Desaparecido">Desaparecido</option>
                      <option value="Morto">Morto</option>
                    </select>
                    <select value={novoChar.tipo} onChange={(e) => setNovoChar({...novoChar, tipo: e.target.value})} required>
                      <option value="Principais">Personagem Principal</option>
                      <option value="NPCs">NPC</option>
                    </select>
                  </div>
                  <textarea placeholder="Descrição/Notas" value={novoChar.descricao} onChange={(e) => setNovoChar({...novoChar, descricao: e.target.value})} required />
                </>
              ) : (
                <>
                  <div className="input-row">
                    <input placeholder="Localização" value={novoChar.localizacao} onChange={(e) => setNovoChar({...novoChar, localizacao: e.target.value})} required />
                    <input placeholder="Ocupação" value={novoChar.ocupacao} onChange={(e) => setNovoChar({...novoChar, ocupacao: e.target.value})} required />
                    <select value={novoChar.status} onChange={(e) => setNovoChar({...novoChar, status: e.target.value})} required>
                      <option value="Vivo">Vivo</option>
                      <option value="Desaparecido">Desaparecido</option>
                      <option value="Morto">Morto</option>
                    </select>
                    <select value={novoChar.tipo} onChange={(e) => setNovoChar({...novoChar, tipo: e.target.value})} required>
                      <option value="Principais">Personagem Principal</option>
                      <option value="NPCs">NPC</option>
                    </select>
                  </div>
                  <textarea placeholder="Descrição/Notas" value={novoChar.descricao} onChange={(e) => setNovoChar({...novoChar, descricao: e.target.value})} required />
                </>
              )}
              <button type="submit" className="btn-save">
                {isEditing ? "Salvar Alterações" : "Adicionar ao Codex"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="characters-grid">
        {lista
          .filter((p) => {
            const tNome = buscaNome.toLowerCase().trim();
            const palNome = p.nome?.toLowerCase().split(" ") || [];
            const bateNome = tNome === "" || palNome.some(pal => pal.startsWith(tNome));

            const bateRaca = (p.raca || "").toLowerCase().includes(buscaRaca.toLowerCase().trim());
            const bateClasse = (p.classe || "").toLowerCase().includes(buscaClasse.toLowerCase().trim());
            const bateStatus = buscaStatus === "" || p.status === buscaStatus;
            const bateTipo = buscaTipo === "" || p.tipo === buscaTipo;

            return bateNome && bateRaca && bateClasse && bateStatus && bateTipo;
          })
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((p) => (
            <CharacterCard key={p.id} player={p} onEdit={handleOpenEdit} />
          ))
        }
      </div>
    </div>
  );
}

export default Characters;