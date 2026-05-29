import { db } from "../firebaseConfig.js";
import { doc, deleteDoc } from "firebase/firestore";
import "../assets/reportCard.css";

function ReportCard({ report }) {
    const handleExcluir = async () => {
        const confirmar = window.confirm(`Deseja apagar o relatório: ${report.nome}?`);
        
        if (confirmar) {
            try {
                await deleteDoc(doc(db, "reports", report.id)); 
                alert("Relatório removido com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar:", error);
            }
        }
    };

    return (
        <div className="report-card">
            <div className="card-actions">
                <button className="btn-delete" onClick={handleExcluir} title="Excluir Relatório">
                    🗑️
                </button>
            </div>
            
            <div className="report-icon">📄</div>
            <div className="report-info">
                <h4>{report.nome}</h4>
                <p>Data: {report.data.split('-').reverse().join('/')}</p>
                <a href={report.pdfUrl} target="_blank" rel="noreferrer" className="btn-download">
                    📥 Baixar Relatório
                </a>
            </div>
        </div>
    );
}

export default ReportCard;