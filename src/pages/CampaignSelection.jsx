import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaign } from "../context/CampaignContext.jsx";

function CampaignSelection() {
  const navigate = useNavigate();
  const {
    currentUserId,
    currentUserProfile,
    setCurrentUserId,
    accessibleCampaigns,
    selectCampaign,
    createCampaign,
    deleteCampaign,
    pendingInvites,
    acceptInvite,
    declineInvite,
    signUp,
    signIn,
    signOutUser,
  } = useCampaign();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const [inviteDetails, setInviteDetails] = useState([]);
  const [authForm, setAuthForm] = useState({ nome: "", email: "", password: "" });
  const [newCampaign, setNewCampaign] = useState({
    nome: "",
    descricao: "",
    imagem: "",
    mapaPrincipal: "",
  });

  const userInfoLabel = useMemo(() => {
    return currentUserProfile?.nome || currentUserId || "local-user";
  }, [currentUserId, currentUserProfile]);

  useEffect(() => {
    if (!pendingInvites.length) {
      setInviteDetails([]);
      return;
    }

    const nextDetails = pendingInvites.map((invite) => ({
      ...invite,
      campaignName: invite.campaignNome || "Campanha",
      invitedByName: invite.invitedByNome || "Usuário",
    }));

    setInviteDetails(nextDetails);
    setShowInvitesModal(true);
  }, [pendingInvites]);

  const handleChooseCampaign = (campaign) => {
    selectCampaign(campaign);
    navigate("/");
  };

  const handleDeleteCampaign = async (campaign) => {
    const confirmation = window.confirm(`Deseja excluir a campanha "${campaign.nome}"?`);
    if (!confirmation) {
      return;
    }

    await deleteCampaign(campaign.id);
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();

    await createCampaign({
      nome: newCampaign.nome.trim(),
      descricao: newCampaign.descricao.trim(),
      imagem: newCampaign.imagem.trim(),
      mapaPrincipal: newCampaign.mapaPrincipal.trim(),
    });

    setShowCreateModal(false);
    setNewCampaign({
      nome: "",
      descricao: "",
      imagem: "",
      mapaPrincipal: "",
    });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    if (authMode === "register") {
      await signUp(authForm.email, authForm.password, authForm.nome);
    } else {
      await signIn(authForm.email, authForm.password);
    }

    setShowAuthModal(false);
    setAuthForm({ nome: "", email: "", password: "" });
  };

  const handleAcceptInvite = async (inviteId) => {
    await acceptInvite(inviteId);
    setShowInvitesModal(false);
  };

  const handleDeclineInvite = async (inviteId) => {
    await declineInvite(inviteId);
    setShowInvitesModal(false);
  };

  return (
    <div className="page-container">
      <section className="hero-section">
        <h1>Escolha sua campanha</h1>
        <p>Antes de entrar no Codex, selecione uma campanha da qual você faz parte.</p>

        <div className="filter-inputs-char" style={{ marginTop: 16 }}>
          <label>
            Usuário atual
            <input
              value={currentUserId}
              onChange={(event) => setCurrentUserId(event.target.value || "local-user")}
              className="search-input-char"
              placeholder="Digite seu uid"
            />
          </label>
        </div>

        <div className="action-buttons-row" style={{ marginTop: 12 }}>
          <button className="btn-add-main" onClick={() => setShowAuthModal(true)}>
            Entrar com conta
          </button>
          <button className="btn-add-main" onClick={() => setShowCreateModal(true)}>
            + Nova campanha
          </button>
          {currentUserId && currentUserId !== "local-user" && (
            <button className="btn-delete" onClick={signOutUser}>
              Sair
            </button>
          )}
        </div>
      </section>

      <section className="home-dashboard">
        <div className="dashboard-left">
          <h2>Campanhas disponíveis para {userInfoLabel}</h2>

          {accessibleCampaigns.length === 0 ? (
            <p className="empty-state">Nenhuma campanha vinculada a este usuário foi encontrada.</p>
          ) : (
            <div className="characters-grid">
              {accessibleCampaigns.map((campaign) => (
                <div key={campaign.id} className="character-card">
                  {campaign.imagem && (
                    <img src={campaign.imagem} alt={campaign.nome} className="mission-detail-image" />
                  )}
                  <div className="featured-card-info">
                    <h3>{campaign.nome}</h3>
                    <p className="description">{campaign.descricao || "Sem descrição."}</p>
                    <div className="action-buttons-row" style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="btn-save"
                        onClick={() => handleChooseCampaign(campaign)}
                      >
                        Entrar na campanha
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDeleteCampaign(campaign)}
                      >
                        Excluir campanha
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={() => setShowAuthModal(false)}>
              X
            </button>
            <h3>{authMode === "register" ? "Criar conta" : "Entrar"}</h3>
            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <input
                  placeholder="Nome"
                  value={authForm.nome}
                  onChange={(event) => setAuthForm({ ...authForm, nome: event.target.value })}
                  required
                />
              )}
              <input
                placeholder="E-mail"
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                required
              />
              <input
                placeholder="Senha"
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                required
              />
              <div className="action-buttons-row">
                <button type="submit" className="btn-save">
                  {authMode === "register" ? "Criar conta" : "Entrar"}
                </button>
                <button
                  type="button"
                  className="btn-add-main"
                  onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}
                >
                  {authMode === "register" ? "Já tenho conta" : "Quero me cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInvitesModal && inviteDetails.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={() => setShowInvitesModal(false)}>
              X
            </button>
            <h3>Convites recebidos</h3>
            {inviteDetails.map((invite) => (
              <div key={invite.id} className="character-card" style={{ marginBottom: 12 }}>
                <div className="char-info">
                  <div className="char-details">
                    <h3>{invite.campaignName}</h3>
                    <p><strong>Enviado por:</strong> {invite.invitedByName}</p>
                    <p><strong>Cargo:</strong> {invite.role}</p>
                  </div>
                </div>
                <div className="action-buttons-row" style={{ marginTop: 12 }}>
                  <button type="button" className="btn-save" onClick={() => handleAcceptInvite(invite.id)}>
                    Aceitar
                  </button>
                  <button type="button" className="btn-delete" onClick={() => handleDeclineInvite(invite.id)}>
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={() => setShowCreateModal(false)}>
              X
            </button>
            <h3>Nova campanha</h3>
            <form onSubmit={handleCreateCampaign}>
              <input
                placeholder="Nome"
                value={newCampaign.nome}
                onChange={(event) => setNewCampaign({ ...newCampaign, nome: event.target.value })}
                required
              />
              <textarea
                placeholder="Descrição"
                value={newCampaign.descricao}
                onChange={(event) => setNewCampaign({ ...newCampaign, descricao: event.target.value })}
                required
              />
              <input
                placeholder="Imagem de capa"
                value={newCampaign.imagem}
                onChange={(event) => setNewCampaign({ ...newCampaign, imagem: event.target.value })}
              />
              <input
                placeholder="Mapa principal"
                value={newCampaign.mapaPrincipal}
                onChange={(event) => setNewCampaign({ ...newCampaign, mapaPrincipal: event.target.value })}
              />
              <button type="submit" className="btn-save">
                Criar campanha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignSelection;
