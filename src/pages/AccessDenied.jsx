import { useNavigate } from "react-router-dom";
import { useCampaign } from "../context/CampaignContext.jsx";

function AccessDenied() {
  const navigate = useNavigate();
  const { clearSelection } = useCampaign();

  return (
    <div className="page-container">
      <section className="hero-section">
        <h1>Acesso negado</h1>
        <p>Você não possui acesso a esta campanha.</p>
        <button
          type="button"
          className="btn-save"
          onClick={() => {
            clearSelection();
            navigate("/");
          }}
        >
          Voltar para seleção de campanha
        </button>
      </section>
    </div>
  );
}

export default AccessDenied;
