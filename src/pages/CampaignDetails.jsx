import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { useCampaign } from "../context/CampaignContext.jsx";
import { uploadImage } from "../services/cloudinary.js";
import "../assets/campaigns.css";

function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentCampaign,
    currentUserId,
    currentRole,
    hasPermission,
    inviteMember,
    updateMemberRole,
    removeMember,
    deleteCampaign,
  } = useCampaign();
  const [campaign, setCampaign] = useState(null);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("player");
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingCampaignAsset, setUploadingCampaignAsset] = useState(false);
  const [editCampaignData, setEditCampaignData] = useState({
    nome: "",
    descricao: "",
    imagem: "",
    mapaPrincipal: "",
  });

  useEffect(() => {
    if (!id) return undefined;

    const campaignRef = doc(db, "campaigns", id);
    const unsubCampaign = onSnapshot(campaignRef, (snapshot) => {
      if (snapshot.exists()) {
        setCampaign({ id: snapshot.id, ...snapshot.data() });
        setEditCampaignData({
          nome: snapshot.data().nome || "",
          descricao: snapshot.data().descricao || "",
          imagem: snapshot.data().imagem || "",
          mapaPrincipal: snapshot.data().mapaPrincipal || "",
        });
      } else {
        setCampaign(null);
      }
    });

    const membersQuery = query(collection(db, "campaignMembers"), where("campaignId", "==", id));
    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      setMembers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const usersQuery = query(collection(db, "users"));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCampaign();
      unsubMembers();
      unsubUsers();
    };
  }, [id]);

  const memberDetails = useMemo(() => {
    return members.map((member) => {
      const profile = users.find((user) => user.uid === member.userId || user.id === member.userId);
      return {
        ...member,
        profile,
      };
    });
  }, [members, users]);

  const filteredUsers = useMemo(() => {
    const searchTerm = inviteSearch.trim().toLowerCase();
    if (!searchTerm) {
      return users;
    }

    return users.filter((user) => {
      const nome = (user.nome || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      return nome.includes(searchTerm) || email.includes(searchTerm);
    });
  }, [inviteSearch, users]);

  const handleInviteMember = async (event) => {
    event.preventDefault();

    if (!inviteEmail.trim()) return;

    const result = await inviteMember(inviteEmail, inviteRole);
    if (!result?.ok) {
      if (result?.reason === "already_member") {
        window.alert("Este usuário já participa da campanha.");
      } else if (result?.reason === "invite_pending") {
        window.alert("Já existe um convite pendente para este usuário.");
      } else if (result?.reason === "user_not_found") {
        window.alert("Nenhum usuário cadastrado foi encontrado com este e-mail.");
      } else {
        window.alert("Não foi possível enviar o convite.");
      }
      return;
    }

    setInviteEmail("");
    setInviteSearch("");
    setInviteRole("player");
    setShowMemberModal(false);
  };

  const handleCampaignAssetUpload = async (event, fieldName) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploadingCampaignAsset(true);
      const url = await uploadImage(file);
      setEditCampaignData((current) => ({ ...current, [fieldName]: url }));
    } catch (error) {
      window.alert(error?.message || "Não foi possível enviar o arquivo da campanha.");
    } finally {
      setUploadingCampaignAsset(false);
    }
  };

  const handleSaveCampaign = async (event) => {
    event.preventDefault();
    if (!campaign?.id) return;

    const campaignRef = doc(db, "campaigns", campaign.id);
    await updateDoc(campaignRef, {
      ...editCampaignData,
    });

    setShowEditModal(false);
  };

  const handleDeleteCampaign = async () => {
    const confirmation = window.confirm("Deseja excluir esta campanha e seus vinculos?");
    if (!confirmation) return;

    await deleteCampaign();
    navigate("/");
  };

  const canManageMembers = hasPermission("inviteMembers") || hasPermission("changeMemberRoles") || hasPermission("removeMembers");
  const canDeleteCampaign = currentRole === "owner" && currentCampaign?.ownerId === currentUserId;

  const handleRemoveMember = async (memberId) => {
    const confirmation = window.confirm("Deseja remover este membro da campanha?");
    if (!confirmation) {
      return;
    }

    await removeMember(memberId);
  };

  if (!campaign) {
    return <div className="campaigns-page"><p className="campaigns-empty">Campanha não encontrada.</p></div>;
  }

  return (
    <div className="campaigns-page">
      <div className="campaigns-toolbar">
        <button className="btn-back" onClick={() => navigate("/")}>← Voltar para campanhas</button>
        <div className="campaigns-actions-wrap">
          {hasPermission("editCampaign") && (
            <button className="btn-add-main" onClick={() => setShowEditModal(true)}>
              Editar Campanha
            </button>
          )}
          {canDeleteCampaign && (
            <button className="btn-delete" onClick={handleDeleteCampaign}>
              Excluir Campanha
            </button>
          )}
          {canManageMembers && (
            <button className="btn-add-main" onClick={() => setShowMemberModal(true)}>
              Convidar membro
            </button>
          )}
        </div>
      </div>

      <section className="campaign-detail-panel">
        {campaign.imagem && <img src={campaign.imagem} alt={campaign.nome} className="campaign-detail-image" />}
        <div className="campaign-detail-summary">
          <h1>{campaign.nome}</h1>
          <p>{campaign.descricao || "Sem descrição."}</p>
          <div className="campaign-detail-meta">
            <div className="meta-card">
              <span>Mapa principal</span>
              <p>{campaign.mapaPrincipal || "—"}</p>
            </div>
            <div className="meta-card">
              <span>Owner</span>
              <p>{campaign.ownerId || currentUserId}</p>
            </div>
            <div className="meta-card">
              <span>Cargo atual</span>
              <p>{currentRole}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="campaigns-members-section">
        <div className="campaign-tabs">
          <button
            type="button"
            className={`campaign-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Resumo
          </button>
          <button
            type="button"
            className={`campaign-tab ${activeTab === "members" ? "active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Membros
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="campaign-overview-panel">
            <h2>Detalhes da campanha</h2>
            <p className="campaigns-empty">Use a aba de membros para visualizar o elenco, alterar cargos e gerenciar acesso.</p>
          </div>
        ) : (
          <>
            <h2>Membros da Campanha</h2>
            {memberDetails.length === 0 ? (
              <p className="campaigns-empty">Nenhum membro cadastrado ainda.</p>
            ) : (
              <div className="campaigns-grid">
                {memberDetails.map((member) => {
                  const profile = member.profile || {};
                  return (
                    <article key={member.id} className="campaign-member-card">
                      <img
                        src={profile.foto || profile.imagem || "https://placehold.co/200x200?text=Usuário"}
                        alt={profile.nome || "Usuário"}
                        className="char-image"
                      />
                      <div className="char-info">
                        <div className="char-details">
                          <h3>{profile.nome || "Usuário"}</h3>
                          <p><strong>Email:</strong> {profile.email || "Sem email"}</p>
                          <p><strong>Cargo:</strong> {member.role}</p>
                        </div>
                        <div className="card-actions">
                          {hasPermission("changeMemberRoles") && member.role !== "owner" && (
                            <select
                              value={member.role}
                              onChange={async (event) => {
                                await updateMemberRole(member.id, event.target.value);
                              }}
                              className="search-input-char"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="player">Player</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}
                          {hasPermission("removeMembers") && member.role !== "owner" && (
                            <button
                              className="btn-delete"
                              onClick={() => handleRemoveMember(member.id)}
                              title="Remover membro"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {showMemberModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={() => setShowMemberModal(false)}>X</button>
            <h3>Convidar membro</h3>
            <form onSubmit={handleInviteMember}>
              <input
                placeholder="Buscar por nome ou e-mail"
                value={inviteSearch}
                onChange={(event) => setInviteSearch(event.target.value)}
              />
              <div className="campaign-member-search-list">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="campaign-member-search-item"
                    onClick={() => {
                      setInviteEmail(user.email || "");
                      setInviteSearch(user.nome || user.email || "");
                    }}
                  >
                    <span>{user.nome || "Usuário"}</span>
                    <small>{user.email || "Sem e-mail"}</small>
                  </button>
                ))}
              </div>
              <input
                placeholder="E-mail do usuário"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                required
              />
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="player">Player</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit" className="btn-save">Salvar convite</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={() => setShowEditModal(false)}>X</button>
            <h3>Editar campanha</h3>
            <form onSubmit={handleSaveCampaign}>
              <input
                placeholder="Nome"
                value={editCampaignData.nome}
                onChange={(event) => setEditCampaignData({ ...editCampaignData, nome: event.target.value })}
                required
              />
              <textarea
                placeholder="Descrição"
                value={editCampaignData.descricao}
                onChange={(event) => setEditCampaignData({ ...editCampaignData, descricao: event.target.value })}
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
              <button type="submit" className="btn-save">Salvar alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignDetails;
