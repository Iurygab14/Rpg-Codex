import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaign } from "../context/CampaignContext.jsx";
import { uploadImage } from "../services/cloudinary.js";
import "../assets/profile.css";

function Profile() {
  const navigate = useNavigate();
  const {
    currentUserProfile,
    accessibleCampaigns,
    clearSelection,
    updateCurrentUserProfile,
    updateUserPassword,
    signOutUser,
  } = useCampaign();

  const [profileForm, setProfileForm] = useState({
    nome: currentUserProfile?.nome || "",
    foto: currentUserProfile?.foto || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const createdAtLabel = useMemo(() => {
    if (!currentUserProfile?.createdAt) {
      return "—";
    }

    if (typeof currentUserProfile.createdAt?.toDate === "function") {
      return currentUserProfile.createdAt.toDate().toLocaleDateString("pt-BR");
    }

    return new Date(currentUserProfile.createdAt).toLocaleDateString("pt-BR");
  }, [currentUserProfile]);

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingPhoto(true);
      const url = await uploadImage(file);
      setProfileForm((current) => ({ ...current, foto: url }));
      setProfileMessage("Foto carregada com sucesso. Salve o perfil para confirmar.");
    } catch (error) {
      setProfileMessage(error?.message || "Não foi possível enviar a foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");

    try {
      await updateCurrentUserProfile({
        nome: profileForm.nome.trim(),
        foto: profileForm.foto.trim(),
      });
      setProfileMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setProfileMessage(error?.message || "Não foi possível atualizar o perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordMessage("");

    try {
      await updateUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Senha alterada com sucesso.");
    } catch (error) {
      setPasswordMessage(error?.message || "Não foi possível alterar a senha.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    navigate("/");
  };

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-avatar">
          <img
            src={currentUserProfile?.foto || currentUserProfile?.imagem || "https://placehold.co/200x200?text=Perfil"}
            alt={currentUserProfile?.nome || "Perfil"}
          />
        </div>
        <div className="profile-hero-copy">
          <span className="profile-eyebrow">Meu Perfil</span>
          <h1>{currentUserProfile?.nome || "Usuário"}</h1>
          <p>{currentUserProfile?.email || "Sem e-mail cadastrado."}</p>
          <div className="profile-hero-actions">
            <button
              type="button"
              className="btn-add-main"
              onClick={() => {
                clearSelection();
                navigate("/");
              }}
            >
              Trocar Campanha
            </button>
            <button type="button" className="btn-delete" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Dados do perfil</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <label>
              Nome
              <input
                value={profileForm.nome}
                onChange={(event) => setProfileForm({ ...profileForm, nome: event.target.value })}
                placeholder="Digite o nome do usuário"
                required
              />
            </label>
            <label>
              Foto de perfil
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
              />
              {uploadingPhoto && <span className="profile-uploading">Enviando foto...</span>}
              {profileForm.foto && <span className="profile-uploaded-url">Foto pronta para salvar.</span>}
            </label>
            <label>
              Email
              <input value={currentUserProfile?.email || ""} readOnly />
            </label>
            <label>
              Data de criação
              <input value={createdAtLabel} readOnly />
            </label>
            {profileMessage && <p className="profile-message">{profileMessage}</p>}
            <button type="submit" className="btn-save" disabled={savingProfile}>
              {savingProfile ? "Salvando..." : "Salvar perfil"}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <div className="profile-card-header">
            <h2>Alterar senha</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <label>
              Senha atual
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                placeholder="Insira a senha atual"
                required
              />
            </label>
            <label>
              Nova senha
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                placeholder="Digite a nova senha"
                required
              />
            </label>
            {passwordMessage && <p className="profile-message">{passwordMessage}</p>}
            <button type="submit" className="btn-save" disabled={savingPassword}>
              {savingPassword ? "Atualizando..." : "Alterar senha"}
            </button>
          </form>
        </div>
      </section>

      <section className="profile-card profile-campaigns-card">
        <div className="profile-card-header">
          <h2>Campanhas das quais participo</h2>
        </div>

        {accessibleCampaigns.length === 0 ? (
          <p className="campaigns-empty">Você ainda não participa de nenhuma campanha.</p>
        ) : (
          <div className="profile-campaigns-grid">
            {accessibleCampaigns.map((campaign) => (
              <article key={campaign.id} className="campaign-card">
                {campaign.imagem && <img src={campaign.imagem} alt={campaign.nome} className="campaign-card-media" />}
                <div className="campaign-card-content">
                  <h3>{campaign.nome}</h3>
                  <p className="campaign-card-description">{campaign.descricao || "Sem descrição."}</p>
                  <div className="campaigns-card-actions">
                    <button type="button" className="btn-save" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                      Gerenciar campanha
                    </button>
                    <button type="button" className="btn-add-main" onClick={() => navigate("/home")}>
                      Entrar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Profile;
