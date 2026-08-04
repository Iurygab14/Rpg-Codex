import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaign } from "../context/CampaignContext.jsx";
import { uploadImage } from "../services/cloudinary.js";
import "../assets/campaigns.css";

function CampaignSelection() {
  const navigate = useNavigate();
  const {
    currentUserId,
    currentUserProfile,
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
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [uploadingCampaignAsset, setUploadingCampaignAsset] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    nome: "",
    descricao: "",
    imagem: "",
    mapaPrincipal: "",
  });

  const isAuthenticated = Boolean(currentUserId);

  const userInfoLabel = useMemo(() => {
    return currentUserProfile?.nome || currentUserProfile?.email || "Usuário";
  }, [currentUserProfile]);

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

    const removed = await deleteCampaign(campaign.id);
    if (!removed) {
      setAuthError("Apenas o proprietário pode excluir esta campanha.");
    }
  };

  const handleCampaignAssetUpload = async (event, fieldName) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingCampaignAsset(true);
      const url = await uploadImage(file);
      setNewCampaign((current) => ({ ...current, [fieldName]: url }));
    } catch (error) {
      setAuthError(error?.message || "Não foi possível enviar o arquivo da campanha.");
    } finally {
      setUploadingCampaignAsset(false);
    }
  };

  const handleCreateCampaign = async (event) => {
    event.preventDefault();

    if (!currentUserId) {
      setShowCreateModal(false);
      setShowAuthModal(true);
      setAuthMode("login");
      setAuthError("Faça login para criar campanhas.");
      return;
    }

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
    setAuthError("");

    if (!authForm.email.trim() || !authForm.password.trim()) {
      setAuthError("Preencha e-mail e senha para continuar.");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "register") {
        await signUp(authForm.email.trim(), authForm.password, authForm.nome.trim());
      } else {
        await signIn(authForm.email.trim(), authForm.password);
      }

      setShowAuthModal(false);
      setAuthForm({ nome: "", email: "", password: "" });
    } catch (error) {
      const code = error?.code || "";
      if (code === "auth/invalid-email") {
        setAuthError("Digite um endereço de e-mail válido.");
      } else if (code === "auth/user-not-found") {
        setAuthError("Nenhuma conta foi encontrada com este e-mail.");
      } else if (code === "auth/wrong-password") {
        setAuthError("E-mail ou senha incorretos.");
      } else if (code === "auth/too-many-requests") {
        setAuthError("Muitas tentativas de login. Tente novamente mais tarde.");
      } else if (code === "auth/email-already-in-use") {
        setAuthError("Este e-mail já está cadastrado.");
      } else if (code === "auth/weak-password") {
        setAuthError("A senha deve possuir pelo menos 6 caracteres.");
      } else {
        setAuthError(authMode === "register"
          ? "Não foi possível criar a conta. Tente novamente."
          : "Não foi possível entrar na conta. Tente novamente.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    await acceptInvite(inviteId);
    setShowInvitesModal(false);
  };

  const handleDeclineInvite = async (inviteId) => {
    await declineInvite(inviteId);
    setShowInvitesModal(false);
  };

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/");
  };

  return (
    <div className="campaigns-page">
      <section className="campaigns-hero">
        <h1>Escolha sua campanha</h1>
        <p>Antes de entrar no Codex, selecione uma campanha da qual você faz parte.</p>

        <div className="campaigns-toolbar" style={{ marginTop: 20 }}>
          {isAuthenticated ? (
            <div className="campaigns-identity">
              Usuário autenticado · {userInfoLabel}
            </div>
          ) : null}

          <div className="campaigns-actions-wrap">
            {!isAuthenticated && (
              <button className="btn-add-main" onClick={() => setShowAuthModal(true)}>
                Entrar com conta
              </button>
            )}
            {isAuthenticated && (
              <button className="btn-add-main" onClick={() => setShowCreateModal(true)}>
                + Nova campanha
              </button>
            )}
            {isAuthenticated && (
              <button className="btn-delete" onClick={handleSignOut}>
                Sair
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="campaigns-board">
        <div className="campaigns-title-row">
          <h2>Campanhas disponíveis para {userInfoLabel}</h2>
        </div>

        {authError && <p className="campaigns-empty">{authError}</p>}

        {accessibleCampaigns.length === 0 ? (
          <p className="campaigns-empty">Nenhuma campanha vinculada a este usuário foi encontrada.</p>
        ) : (
          <div className="campaigns-grid">
            {accessibleCampaigns.map((campaign) => (
              <article key={campaign.id} className="campaign-card">
                {campaign.imagem && (
                  <img src={campaign.imagem} alt={campaign.nome} className="campaign-card-media" />
                )}
                <div className="campaign-card-content">
                  <h3>{campaign.nome}</h3>
                  <p className="campaign-card-description">{campaign.descricao || "Sem descrição."}</p>
                  <div className="campaigns-card-actions">
                    <button
                      type="button"
                      className="btn-save"
                      onClick={() => handleChooseCampaign(campaign)}
                    >
                      Entrar na campanha
                    </button>
                    {campaign.ownerId === currentUserId && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDeleteCampaign(campaign)}
                      >
                        Excluir campanha
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
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
              {authError && <p className="empty-state">{authError}</p>}
              <div className="action-buttons-row">
                <button type="submit" className="btn-save" disabled={authLoading}>
                  {authLoading ? "Processando..." : authMode === "register" ? "Criar conta" : "Entrar"}
                </button>
                <button
                  type="button"
                  className="btn-add-main"
                  onClick={() => {
                    setAuthError("");
                    setAuthMode(authMode === "register" ? "login" : "register");
                  }}
                  disabled={authLoading}
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
              <label>
                Imagem de capa
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleCampaignAssetUpload(event, "imagem")}
                />
                {uploadingCampaignAsset && <span className="profile-uploading">Enviando imagem...</span>}
              </label>
              <label>
                Mapa principal
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleCampaignAssetUpload(event, "mapaPrincipal")}
                />
                {uploadingCampaignAsset && <span className="profile-uploading">Enviando mapa...</span>}
              </label>
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
