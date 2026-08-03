import { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { uploadImage } from "../services/cloudinary";
import "../assets/bestiary.css";
import BestiaryCard from "../components/bestiaryCard.jsx";
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, where } from "firebase/firestore";
import { useCampaign } from "../context/CampaignContext.jsx";

function Bestiary() {

  const { currentCampaign, hasPermission } = useCampaign();
  const [lista, setLista] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [imagemArquivo, setImagemArquivo] = useState(null);

  const [buscaNome, setBuscaNome] = useState("");
  const [buscaTipo, setBuscaTipo] = useState("");
  const [buscaCategoria, setBuscaCategoria] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [novaCriatura, setNovaCriatura] = useState({
    nome: "",
    imagem: "",
    tipo: "",
    categoria: "Comum",
    desafio: "",
    descricao: ""
  });

  useEffect(() => {

    if (!currentCampaign?.id) {
      setLista([]);
      return undefined;
    }

    const bestiaryQuery = query(collection(db, "bestiary"), where("campaignId", "==", currentCampaign.id));
    const unsub = onSnapshot(
      bestiaryQuery,
      (snapshot) => {

        const dados = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setLista(dados);
      }
    );

    return () => unsub();

  }, [currentCampaign?.id]);

  const fecharModal = () => {

    setShowModal(false);

    setIsEditing(false);

    setCurrentId(null);

    setNovaCriatura({
        nome: "",
        imagem: "",
        tipo: "",
        categoria: "Comum",
        desafio: "",
        descricao: ""
    });

    setImagemArquivo(null);

    };

  const handleSubmit = async (e) => {

    e.preventDefault();

    let imageUrl = novaCriatura.imagem || "";

    if (imagemArquivo) {

        imageUrl = await uploadImage(imagemArquivo);

    }

    const dadosParaSalvar = {
        ...novaCriatura,
        imagem: imageUrl,
        campaignId: currentCampaign.id
    };

    delete dadosParaSalvar.id;

    if (isEditing) {

        await updateDoc(
            doc(db, "bestiary", currentId),
            dadosParaSalvar
        );

    } else {

        await addDoc(
            collection(db, "bestiary"),
            {
                ...dadosParaSalvar,
                criadoEm: serverTimestamp()
            }
        );

    }

    fecharModal();

    };

  const handleOpenEdit = (monster) => {

    setNovaCriatura(monster);

    setCurrentId(monster.id);

    setIsEditing(true);

    setShowModal(true);
    };

  return (
    <div className="page-container">

      <div className="header-actions-best">

        <div className="action-bar">

            {hasPermission("createCharacters") && (
            <button
            className="btn-add-main"
            onClick={() => setShowModal(true)}
            >
            + Nova Criatura
            </button>
            )}

            <div className="search-container-best">

            <div className="filter-header-best">
                <span>FILTROS DE BUSCA</span>
            </div>

            <div className="filter-inputs-best">

                <label>
                Nome
                <input
                    type="text"
                    placeholder="Ex: Dragão..."
                    value={buscaNome}
                    onChange={(e) => setBuscaNome(e.target.value)}
                    className="search-input-best"
                />
                </label>

                <label>
                Tipo
                <input
                    type="text"
                    placeholder="Ex: Morto-vivo..."
                    value={buscaTipo}
                    onChange={(e) => setBuscaTipo(e.target.value)}
                    className="search-input-best"
                />
                </label>

                <label>
                Categoria
                <select
                    value={buscaCategoria}
                    onChange={(e) => setBuscaCategoria(e.target.value)}
                    className="search-input-best"
                >
                    <option value="">Todas</option>
                    <option value="Comum">Comum</option>
                    <option value="Elite">Elite</option>
                    <option value="Boss">Boss</option>
                </select>
                </label>

            </div>

            </div>

        </div>

        </div>

      {showModal && (

        <div className="modal-overlay">

          <div className="modal-content">

            <button
              className="btn-close"
              onClick={fecharModal}
            >
              X
            </button>

            <h3>
                {isEditing
                    ? "Editar Criatura"
                    : "Nova Criatura"}
            </h3>

            <form onSubmit={handleSubmit}>

              <input
                placeholder="Nome"
                required
                value={novaCriatura.nome}
                onChange={(e) =>
                  setNovaCriatura({
                    ...novaCriatura,
                    nome: e.target.value
                  })
                }
              />

              <input
                placeholder="Tipo"
                required
                value={novaCriatura.tipo}
                onChange={(e) =>
                  setNovaCriatura({
                    ...novaCriatura,
                    tipo: e.target.value
                  })
                }
              />

              <select
                value={novaCriatura.categoria}
                onChange={(e) =>
                  setNovaCriatura({
                    ...novaCriatura,
                    categoria: e.target.value
                  })
                }
              >
                <option value="Comum">Comum</option>
                <option value="Elite">Elite</option>
                <option value="Boss">Boss</option>
              </select>

              <input
                placeholder="ND / Desafio"
                value={novaCriatura.desafio}
                onChange={(e) =>
                  setNovaCriatura({
                    ...novaCriatura,
                    desafio: e.target.value
                  })
                }
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImagemArquivo(e.target.files[0])
                }
              />

              <textarea
                placeholder="Descrição"
                value={novaCriatura.descricao}
                onChange={(e) =>
                  setNovaCriatura({
                    ...novaCriatura,
                    descricao: e.target.value
                  })
                }
              />

              <button
                type="submit"
                className="btn-save"
                >
                {isEditing
                    ? "Salvar Alterações"
                    : "Adicionar ao Bestiário"}
                </button>

            </form>

          </div>

        </div>

      )}

      <div className="bestiary-grid">

        {lista

            .filter(criatura => {

            const bateNome =
                criatura.nome
                ?.toLowerCase()
                .includes(
                    buscaNome.toLowerCase()
                );

            const bateTipo =
                criatura.tipo
                ?.toLowerCase()
                .includes(
                    buscaTipo.toLowerCase()
                );

            const bateCategoria =
                buscaCategoria === "" ||
                criatura.categoria === buscaCategoria;

            return (
                bateNome &&
                bateTipo &&
                bateCategoria
            );
            })

            .sort((a, b) =>
            a.nome.localeCompare(b.nome)
            )


            
            .map(criatura => (
                <BestiaryCard
                    key={criatura.id}
                    criatura={criatura}
                    onEdit={handleOpenEdit}
                />
            ))}

        </div>

    </div>
  );
}

export default Bestiary;