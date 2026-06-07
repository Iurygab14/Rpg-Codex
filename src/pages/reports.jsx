import { useState, useEffect } from "react";
import { db } from "../firebaseConfig.js";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import ReportCard from "../components/reportCard";
import "../assets/reports.css";
import { uploadPdf } from "../services/cloudinary";

function Reports() {
    const [lista, setLista] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [novoRelatorio, setNovoRelatorio] = useState({ nome: "", data: "", pdfUrl: "" });
    const [buscaNome, setBuscaNome] = useState("");
    const [buscaData, setBuscaData] = useState("");
    const [pdfArquivo, setPdfArquivo] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "reports"), (snapshot) => {
            const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLista(dados);
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        let pdfUrl = "";

        if (pdfArquivo) {
            pdfUrl = await uploadPdf(pdfArquivo);
        }

        await addDoc(collection(db, "reports"), {
            ...novoRelatorio,
            pdfUrl,
        });

        setShowModal(false);

        setNovoRelatorio({
            nome: "",
            data: "",
            pdfUrl: "",
        });

        setPdfArquivo(null);
    };

    return (
        <div className="page-container">
            <div className="header-actions-rep">
                <div className="action-bar">
                    
                    <button className="btn-add-main" onClick={() => setShowModal(true)}>
                        + Novo Relatório
                    </button>
    
                    <div className="search-container-rep">
                        <div className="filter-header-rep">
                            <span><i className="fas fa-filter"></i> Filtros de Busca</span>
                        </div>
                        
                        <div className="filter-inputs-rep">
                            <label>Nome
                                <input 
                                    type="text" 
                                    placeholder="Ex: Projeto..." 
                                    value={buscaNome}
                                    onChange={(e) => setBuscaNome(e.target.value)}
                                    className="search-input-rep"
                                />
                            </label>
                            
                            <label>Data
                                <input 
                                    type="text" 
                                    placeholder="Ex: 01/01..." 
                                    value={buscaData}
                                    onChange={(e) => setBuscaData(e.target.value)}
                                    className="search-input-rep"
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="btn-close" onClick={() => setShowModal(false)}>X</button>
                        <h3>Arquivar Missão</h3>
                        <form onSubmit={handleSubmit}>
                            <input placeholder="Nome da Missão" value={novoRelatorio.nome} onChange={(e) => setNovoRelatorio({...novoRelatorio, nome: e.target.value})} required />
                            <input type="date" value={novoRelatorio.data} onChange={(e) => setNovoRelatorio({...novoRelatorio, data: e.target.value})} required />
                            <input type="file"  accept=".pdf,application/pdf"  onChange={(e) => setPdfArquivo(e.target.files[0])} required/>
                            <button type="submit" className="btn-save">Entregar Relatório</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="reports-grid">
                {lista
                    .filter(report => {
                        const termoNome = buscaNome.toLowerCase().trim();
                        const palavrasNome = report.nome.toLowerCase().split(" ");
                        const bateNome = termoNome === "" || palavrasNome.some(p => p.startsWith(termoNome));

                        const dataBR = report.data.split('-').reverse().join('/');
                        const termoData = buscaData.trim();
                        const bateData = termoData === "" || report.data.includes(termoData) || dataBR.includes(termoData);

                        return bateNome && bateData;
                    })
                    .sort((a, b) => b.data.localeCompare(a.data))
                    .map((rep) => (
                        <ReportCard key={rep.id} report={rep} />
                    ))
                }
            </div>
        </div>
    );
}

export default Reports;