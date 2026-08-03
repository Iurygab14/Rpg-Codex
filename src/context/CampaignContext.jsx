import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebaseConfig.js";

const CampaignContext = createContext(null);
const STORAGE_CAMPAIGN_KEY = "rpg-codex-selected-campaign";
const STORAGE_USER_KEY = "rpg-codex-current-user";

const PERMISSION_MATRIX = {
  owner: [
    "manageCampaign",
    "editCampaign",
    "deleteCampaign",
    "inviteMembers",
    "removeMembers",
    "changeMemberRoles",
    "editAnyContent",
    "createCharacters",
    "editCharacters",
    "deleteCharacters",
    "createFactions",
    "editFactions",
    "deleteFactions",
    "createLocations",
    "editLocations",
    "deleteLocations",
    "createMissions",
    "editMissions",
    "deleteMissions",
    "editMap",
    "viewContent",
  ],
  admin: [
    "createCharacters",
    "editCharacters",
    "deleteCharacters",
    "createFactions",
    "editFactions",
    "deleteFactions",
    "createLocations",
    "editLocations",
    "deleteLocations",
    "createMissions",
    "editMissions",
    "deleteMissions",
    "editMap",
    "viewContent",
  ],
  player: ["viewContent"],
  viewer: ["viewContent"],
};

export function CampaignProvider({ children }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => {
    const storedValue = window.localStorage.getItem(STORAGE_CAMPAIGN_KEY);
    return storedValue || "";
  });
  const [currentUserId, setCurrentUserId] = useState(() => {
    const storedValue = window.localStorage.getItem(STORAGE_USER_KEY);
    return storedValue || "local-user";
  });
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [campaignMembership, setCampaignMembership] = useState(null);
  const [currentMember, setCurrentMember] = useState(null);
  const [currentRole, setCurrentRole] = useState("viewer");
  const [accessibleCampaignIds, setAccessibleCampaignIds] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCampaigns(docs);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedCampaignId) {
      setCurrentCampaign(null);
      return;
    }

    const foundCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) || null;
    setCurrentCampaign(foundCampaign);
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.uid) {
        const uid = firebaseUser.uid;
        setCurrentUserId(uid);
        await ensureProfileForUser(uid, {
          nome: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Usuário",
          email: firebaseUser.email || "",
          foto: firebaseUser.photoURL || "",
        });
      } else {
        const storedValue = window.localStorage.getItem(STORAGE_USER_KEY);
        if (storedValue) {
          setCurrentUserId(storedValue);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setCurrentUserProfile(null);
      return undefined;
    }

    const userRef = doc(db, "users", currentUserId);
    const unsubProfile = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUserProfile({ id: snapshot.id, ...snapshot.data() });
      } else {
        setCurrentUserProfile(null);
      }
    });

    return () => unsubProfile();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setPendingInvites([]);
      return undefined;
    }

    const invitesQuery = query(
      collection(db, "campaignInvites"),
      where("invitedUserId", "==", currentUserId),
      where("status", "==", "pending")
    );

    const unsubInvites = onSnapshot(invitesQuery, async (snapshot) => {
      const inviteDocs = snapshot.docs.map((inviteDoc) => ({ id: inviteDoc.id, ...inviteDoc.data() }));

      const enrichedInvites = await Promise.all(
        inviteDocs.map(async (invite) => {
          const campaignDoc = campaigns.find((campaign) => campaign.id === invite.campaignId);
          const inviterDoc = await getDoc(doc(db, "users", invite.invitedBy));

          return {
            ...invite,
            campaignNome: campaignDoc?.nome || "Campanha",
            invitedByNome: inviterDoc.exists() ? inviterDoc.data().nome || inviterDoc.data().email || "Usuário" : "Usuário",
          };
        })
      );

      setPendingInvites(enrichedInvites);
    });

    return () => unsubInvites();
  }, [currentUserId, campaigns]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    void ensureProfileForUser(currentUserId, {
      nome: currentUserId,
      email: currentUserId,
      foto: "",
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !currentCampaign?.id) {
      setCampaignMembership(null);
      setCurrentMember(null);
      setCurrentRole("viewer");
      return undefined;
    }

    const membershipsQuery = query(
      collection(db, "campaignMembers"),
      where("campaignId", "==", currentCampaign.id),
      where("userId", "==", currentUserId)
    );

    const unsub = onSnapshot(membershipsQuery, (snapshot) => {
      const memberDoc = snapshot.docs[0];
      const nextMember = memberDoc ? { id: memberDoc.id, ...memberDoc.data() } : null;
      setCampaignMembership(nextMember);
      setCurrentMember(nextMember);
      setCurrentRole(nextMember?.role || "viewer");
    });

    return () => unsub();
  }, [currentCampaign?.id, currentUserId]);

  useEffect(() => {
    if (!currentUserId) {
      setAccessibleCampaignIds([]);
      return undefined;
    }

    const membersQuery = query(collection(db, "campaignMembers"), where("userId", "==", currentUserId));
    const unsub = onSnapshot(membersQuery, (snapshot) => {
      setAccessibleCampaignIds(
        snapshot.docs.map((doc) => doc.data().campaignId).filter(Boolean)
      );
    });

    return () => unsub();
  }, [currentUserId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_CAMPAIGN_KEY, selectedCampaignId || "");
  }, [selectedCampaignId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_USER_KEY, currentUserId || "");
  }, [currentUserId]);

  const accessibleCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => accessibleCampaignIds.includes(campaign.id));
  }, [campaigns, accessibleCampaignIds]);

  const hasPermission = (permissionName) => {
    const rolePermissions = PERMISSION_MATRIX[currentRole] || [];

    if (currentRole === "owner") {
      return true;
    }

    return rolePermissions.includes(permissionName);
  };

  const selectCampaign = (campaign) => {
    setSelectedCampaignId(campaign.id);
    setCurrentCampaign(campaign);
  };

  const clearSelection = () => {
    setSelectedCampaignId("");
    setCurrentCampaign(null);
    setCampaignMembership(null);
    setCurrentMember(null);
    setCurrentRole("viewer");
  };

  const ensureProfileForUser = async (userId, profile = {}) => {
    const profileRef = doc(db, "users", userId);
    const profileSnapshot = await getDoc(profileRef);

    await setDoc(
      profileRef,
      {
        uid: userId,
        nome: profile.nome || "Usuário",
        email: profile.email || "",
        foto: profile.foto || profile.imagem || "",
        createdAt: profileSnapshot.exists() ? profileSnapshot.data().createdAt || serverTimestamp() : serverTimestamp(),
      },
      { merge: true }
    );
  };

  const signUp = async (email, password, nome) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureProfileForUser(credential.user.uid, {
      nome: nome.trim() || credential.user.email?.split("@")[0] || "Usuário",
      email: credential.user.email || email,
      foto: credential.user.photoURL || "",
    });
    return credential.user;
  };

  const signIn = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await ensureProfileForUser(credential.user.uid, {
      nome: credential.user.displayName || credential.user.email?.split("@")[0] || "Usuário",
      email: credential.user.email || email,
      foto: credential.user.photoURL || "",
    });
    return credential.user;
  };

  const signOutUser = async () => {
    await signOut(auth);
    clearSelection();
  };

  const inviteMember = async (email, role) => {
    if (!currentCampaign?.id) {
      return { ok: false, reason: "campaign_missing" };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { ok: false, reason: "email_missing" };
    }

    const profileQuery = query(collection(db, "users"), where("email", "==", normalizedEmail));
    const profileSnapshot = await getDocs(profileQuery);

    if (profileSnapshot.empty) {
      return { ok: false, reason: "user_not_found" };
    }

    const profileDoc = profileSnapshot.docs[0];
    const invitedUserId = profileDoc.data().uid || profileDoc.id;

    const pendingInviteQuery = query(
      collection(db, "campaignInvites"),
      where("campaignId", "==", currentCampaign.id),
      where("invitedUserId", "==", invitedUserId),
      where("status", "==", "pending")
    );
    const pendingInviteSnapshot = await getDocs(pendingInviteQuery);

    if (!pendingInviteSnapshot.empty) {
      return { ok: false, reason: "invite_pending" };
    }

    await addDoc(collection(db, "campaignInvites"), {
      campaignId: currentCampaign.id,
      invitedUserId,
      invitedBy: currentUserId,
      role,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return { ok: true, invitedUserId };
  };

  const acceptInvite = async (inviteId) => {
    if (!inviteId) {
      return;
    }

    const inviteRef = doc(db, "campaignInvites", inviteId);
    const inviteSnapshot = await getDoc(inviteRef);

    if (!inviteSnapshot.exists()) {
      return;
    }

    const inviteData = inviteSnapshot.data();
    const membershipQuery = query(
      collection(db, "campaignMembers"),
      where("campaignId", "==", inviteData.campaignId),
      where("userId", "==", inviteData.invitedUserId)
    );
    const membershipSnapshot = await getDocs(membershipQuery);

    if (membershipSnapshot.empty) {
      await addDoc(collection(db, "campaignMembers"), {
        campaignId: inviteData.campaignId,
        userId: inviteData.invitedUserId,
        role: inviteData.role,
      });
    }

    await updateDoc(inviteRef, {
      status: "accepted",
      updatedAt: serverTimestamp(),
    });
  };

  const declineInvite = async (inviteId) => {
    if (!inviteId) {
      return;
    }

    const inviteRef = doc(db, "campaignInvites", inviteId);
    await updateDoc(inviteRef, {
      status: "declined",
      updatedAt: serverTimestamp(),
    });
  };

  const updateMemberRole = async (memberId, role) => {
    if (!memberId || !role) {
      return;
    }

    const memberRef = doc(db, "campaignMembers", memberId);
    await updateDoc(memberRef, { role });
  };

  const removeMember = async (memberId) => {
    if (!memberId) {
      return;
    }

    const memberRef = doc(db, "campaignMembers", memberId);
    await deleteDoc(memberRef);
  };

  const deleteCampaign = async (campaignId = currentCampaign?.id) => {
    if (!campaignId) {
      return;
    }

    const membersQuery = query(collection(db, "campaignMembers"), where("campaignId", "==", campaignId));
    const membershipSnapshot = await getDocs(membersQuery);
    const invitesQuery = query(collection(db, "campaignInvites"), where("campaignId", "==", campaignId));
    const inviteSnapshot = await getDocs(invitesQuery);

    await Promise.all(
      membershipSnapshot.docs.map((memberDoc) => deleteDoc(doc(db, "campaignMembers", memberDoc.id)))
    );

    await Promise.all(
      inviteSnapshot.docs.map((inviteDoc) => deleteDoc(doc(db, "campaignInvites", inviteDoc.id)))
    );

    await deleteDoc(doc(db, "campaigns", campaignId));

    if (selectedCampaignId === campaignId) {
      clearSelection();
    }
  };

  const createCampaign = async (campaignData) => {
    const campaignRef = await addDoc(collection(db, "campaigns"), {
      ...campaignData,
      ownerId: currentUserId,
      createdAt: serverTimestamp(),
    });

    await addDoc(collection(db, "campaignMembers"), {
      campaignId: campaignRef.id,
      userId: currentUserId,
      role: "owner",
    });

    await ensureProfileForUser(currentUserId, {
      nome: currentUserId,
      email: currentUserId,
      imagem: "",
    });

    const createdCampaign = {
      id: campaignRef.id,
      ...campaignData,
      ownerId: currentUserId,
    };

    selectCampaign(createdCampaign);
    return createdCampaign;
  };

  const value = {
    campaigns,
    currentCampaign,
    currentUserId,
    currentUserProfile,
    setCurrentUserId,
    accessibleCampaigns,
    selectCampaign,
    clearSelection,
    currentMember,
    currentRole,
    campaignMembership,
    createCampaign,
    hasPermission,
    inviteMember,
    acceptInvite,
    declineInvite,
    updateMemberRole,
    removeMember,
    deleteCampaign,
    pendingInvites,
    signUp,
    signIn,
    signOutUser,
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign deve ser usado dentro de CampaignProvider");
  }

  return context;
}
