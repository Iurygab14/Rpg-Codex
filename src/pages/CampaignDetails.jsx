import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig.js";
import { useCampaign } from "../context/CampaignContext.jsx";
import "../assets/factions.css";

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
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("player");
  const [showEditModal, setShowEditModal] = useState(false);
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
      const profile = users.find((user) => user.userId === member.userId || user.id === member.userId);
      return {
        ...member,
        profile,
      };
    });
  }, [members, users]);

  const handleInviteMember = async (event) => {
    event.preventDefault();

    if (!inviteEmail.trim()) return;

    await inviteMember(inviteEmail, inviteRole);
    setInviteEmail("");
    setInviteRole("player");
    setShowMemberModal(false);
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

  if (!campaign) {
    return <div className="page-container"><p>Campanha não encontrada.</p></div>;
  }

  return (
    <div className="page-container">
      <div className="header-actions-faction">
        <div className="action-bar">
          <button className="btn-back" onClick={() => navigate("/")}>← Voltar para campanhas</button>
          <div className="action-buttons-row">
            {hasPermission("editCampaign") && (
              <button className="btn-add-main" onClick={() => setShowEditModal(true)}>
                Editar Campanha
              </button>
            )}
            {hasPermission("deleteCampaign") && (
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
      </div>

      <div className="faction-detail-card">
        {campaign.imagem && <img src={campaign.imagem} alt={campaign.nome} className="faction-detail-image" />}
        <div className="faction-detail-info">
          <h1>{campaign.nome}</h1>
          <p>{campaign.descricao || "Sem descrição."}</p>
          <div className="detail-row">
            <div>
              <span>Mapa principal</span>
              <p>{campaign.mapaPrincipal || "—"}</p>
            </div>
            <div>
              <span>Owner</span>
              <p>{campaign.ownerId || currentUserId}</p>
            </div>
          </div>
          <div className="detail-row">
            <span>Cargo atual</span>
            <p>{currentRole}</p>
          </div>
        </div>
      </div>

      <section className="members-section">
        <h2>Membros da Campanha</h2>
        {memberDetails.length === 0 ? (
          <p className="empty-state">Nenhum membro cadastrado ainda.</p>
        ) : (
          <div className="members-grid">
            {memberDetails.map((member) => {
              const profile = member.profile || {};
              return (
                <div key={member.id} className="character-card">
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
                        onClick={async () => {
                          await removeMember(member.id);
                        }}
                        title="Remover membro"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <img
                    src={profile.imagem || "https://placehold.co/200x200?text=Usuário"}
                    alt={profile.nome || "Usuário"}
                    className="char-image"
                  />
                  <div className="char-info">
                    <div className="char-details">
                      <h3>{profile.nome || "Usuário"}</h3>
                      <p><strong>Email:</strong> {profile.email || "Sem email"}</p>
                      <p><strong>Cargo:</strong> {member.role}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showMemberModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-close" onClick={() => setShowMemberModal(false)}>X</button>
            <h3>Convidar membro</h3>
            <form onSubmit={handleInviteMember}>
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
              <input
                placeholder="Imagem de capa"
                value={editCampaignData.imagem}
                onChange={(event) => setEditCampaignData({ ...editCampaignData, imagem: event.target.value })}
              />
              <input
                placeholder="Mapa principal"
                value={editCampaignData.mapaPrincipal}
                onChange={(event) => setEditCampaignData({ ...editCampaignData, mapaPrincipal: event.target.value })}
              />
              <button type="submit" className="btn-save">Salvar alterações</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignDetails;
