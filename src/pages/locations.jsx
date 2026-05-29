import { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import { collection, onSnapshot, addDoc, doc, updateDoc } from "firebase/firestore";
import LocationCard from "../components/locationCard.jsx";
import "../assets/locations.css";

function Locations() {
    const [lista, setLista] = useState([]);
    const [showModal, setShowModal] = useState(false); 
    const [isEditing, setIsEditing] = useState(false); 
    const [currentId, setCurrentId] = useState(null);
    const [buscaNome, setBuscaNome] = useState("");
    const [buscaLocalizacao, setBuscaLocalizacao] = useState("");
    const [novoLocal, setNovoLocal] = useState({
        nome: "", 
        imagem: "",
        localizacao: "", 
        descricao: ""
    });
    
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "locations"), (snapshot) => {
            const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLista(dados);
        });
        return () => unsub();
    }, []);

    const handleOpenEdit = (location) => {
        setNovoLocal(location); 
        setCurrentId(location.id);
        setIsEditing(true);
        setShowModal(true);
    };

    const fecharModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setCurrentId(null);
        setNovoLocal({ nome: "", imagem: "", localizacao: "", descricao: "" });
    }; 

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dadosParaSalvar = { ...novoLocal };
        delete dadosParaSalvar.id;

        if (isEditing) {
            await updateDoc(doc(db, "locations", currentId), dadosParaSalvar); 
        } else {
            await addDoc(collection(db, "locations"), dadosParaSalvar); 
        }
        fecharModal();
    };
    
    return (
        <div className="page-container">
            <div className="header-actions-loc">
                <div className="action-bar">
                    <button className="btn-add-main" onClick={() => setShowModal(true)}>+ Nova Localidade</button>

                    <div className="search-container-loc">
                        <div className="filter-header-loc">
                            <span>FILTROS DE BUSCA</span>
                        </div>
                        <div className="filter-inputs-loc">
                            <label>Nome
                                <input 
                                    type="text" 
                                    placeholder="Ex: Taverna..." 
                                    value={buscaNome}
                                    onChange={(e) => setBuscaNome(e.target.value)}
                                    className="search-input-loc"
                                />
                            </label>

                            <label>Localização
                                <input 
                                    type="text" 
                                    placeholder="Ex: Kolbrook..." 
                                    value={buscaLocalizacao}
                                    onChange={(e) => setBuscaLocalizacao(e.target.value)}
                                    className="search-input-loc"
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="btn-close" onClick={fecharModal}>X</button>
                        <h3>{isEditing ? "Editar Registro" : "Novo Local"}</h3>

                        <form onSubmit={handleSubmit}>
                            <input placeholder="Nome" value={novoLocal.nome} onChange={(e) => setNovoLocal({...novoLocal, nome: e.target.value})} required />
                            <input placeholder="URL da Imagem" value={novoLocal.imagem} onChange={(e) => setNovoLocal({...novoLocal, imagem: e.target.value})} required />
                            <input placeholder="Localização" value={novoLocal.localizacao} onChange={(e) => setNovoLocal({...novoLocal, localizacao: e.target.value})} required />
                            <input placeholder="Descrição" value={novoLocal.descricao} onChange={(e) => setNovoLocal({...novoLocal, descricao: e.target.value})} required />

                            <button type="submit" className="btn-save">
                                {isEditing ? "Salvar Alterações" : "Registrar Local"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="locations-grid">
                {lista
                    .filter(loc => {
                        const termoNome = buscaNome.toLowerCase().trim();
                        const termoLocal = buscaLocalizacao.toLowerCase().trim();

                        const palavrasNome = loc.nome.toLowerCase().split(" ");
                        const bateNome = termoNome === "" || palavrasNome.some(p => p.startsWith(termoNome));

                        const palavrasLocal = loc.localizacao.toLowerCase().split(" ");
                        const bateLocal = termoLocal === "" || palavrasLocal.some(p => p.startsWith(termoLocal));

                        return bateNome && bateLocal;
                    })
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((loc) => (
                        <LocationCard key={loc.id} location={loc} onEdit={handleOpenEdit} />
                    ))
                }
            </div>
      </div>
    );
}

export default Locations;