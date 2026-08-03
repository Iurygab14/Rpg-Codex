import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import "../assets/home.css";
import { useCampaign } from "../context/CampaignContext.jsx";

function Home() {
    const { currentCampaign } = useCampaign();
    const [characters, setCharacters] = useState([]);
    const [locations, setLocations] = useState([]);
    const [missions, setMissions] = useState([]);
    const [bestiary, setBestiary] = useState([]);

    useEffect(() => {
        if (!currentCampaign?.id) {
            setCharacters([]);
            setLocations([]);
            setMissions([]);
            setBestiary([]);
            return undefined;
        }

        const playersQuery = query(collection(db, "players"), where("campaignId", "==", currentCampaign.id));
        const locationsQuery = query(collection(db, "locations"), where("campaignId", "==", currentCampaign.id));
        const missionsQuery = query(collection(db, "missions"), where("campaignId", "==", currentCampaign.id));
        const bestiaryQuery = query(collection(db, "bestiary"), where("campaignId", "==", currentCampaign.id));

        const unsubPlayers = onSnapshot(playersQuery, (snapshot) => {
                setCharacters(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
            }
        );

        const unsubLocations = onSnapshot(locationsQuery, (snapshot) => {
                setLocations(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
            }
        );

        const unsubMissions = onSnapshot(missionsQuery, (snapshot) => {
                setMissions(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
            }
        );

        const unsubBestiary = onSnapshot(bestiaryQuery, (snapshot) => {
                setBestiary(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
            }
        );

        return () => {
            unsubPlayers();
            unsubLocations();
            unsubMissions();
            unsubBestiary();
        };
    }, [currentCampaign?.id]);

    const ultimosPersonagens = [...characters]
        .filter(char => char.criadoEm)
        .sort(
            (a, b) =>
            b.criadoEm.seconds - a.criadoEm.seconds
        )
        .slice(0, 4);

    const ultimasLocations = [...locations]
    .filter(loc => loc.criadoEm)
    .sort(
        (a, b) =>
            b.criadoEm.seconds -
            a.criadoEm.seconds
    )
    .slice(0, 3);

    const personagemDestaque =
        characters.length > 0
            ? characters[
                Math.floor(
                Date.now() / (1000 * 60 * 60)
                ) % characters.length
            ]
            : null;

    const ultimasMissoes = [...missions]
        .sort((a, b) => (a.data || "").localeCompare(b.data || ""))
        .slice(0, 5);

    const ultimasCriaturas = [...bestiary]
        .filter(criatura => criatura.criadoEm)
        .sort(
            (a, b) =>
                b.criadoEm.seconds -
                a.criadoEm.seconds
        )
        .slice(0, 4);
    
    return (
        <div className="home-container">

            <section className="hero-section">

                <h1>RPG CODEX</h1>

                <p>
                    Arquivos, histórias e registros do nosso mundo.
                </p>

                <div className="hero-stats">

                    <div className="stat-card">
                        <span>👤</span>
                        <h2>{characters.length}</h2>
                        <p>Personagens</p>
                    </div>

                    <div className="stat-card">
                        <span>🏰</span>
                        <h2>{locations.length}</h2>
                        <p>Localizações</p>
                    </div>

                    <div className="stat-card">
                        <span>�️</span>
                        <h2>{missions.length}</h2>
                        <p>Missões</p>
                    </div>

                    <div className="stat-card">
                        <span>🐉</span>
                        <h2>{bestiary.length}</h2>
                        <p>Criaturas</p>
                    </div>

                </div>

            </section>

            <section className="home-dashboard">

                <div className="dashboard-left">

                    <h2>⭐ Personagem em Destaque</h2>

                    {personagemDestaque && (
                        <div
                            className="featured-card"
                            style={{
                                "--bg-image": `url(${personagemDestaque.imagem}`
                            }}
                        >

                            <img
                                src={personagemDestaque.imagem}
                                alt={personagemDestaque.nome}
                            />

                            <div className="featured-card-info">

                                <h3>{personagemDestaque.nome}</h3>

                                <p className="subtitle">
                                    {personagemDestaque.raca}
                                    {personagemDestaque.classe &&
                                        ` • ${personagemDestaque.classe}`}
                                </p>

                                <p className="description">
                                    {personagemDestaque.descricao ||
                                        "Nenhuma descrição cadastrada."}
                                </p>

                                <div className="featured-tags">

                                    <span className="featured-tag">
                                        {personagemDestaque.status}
                                    </span>

                                    <span className="featured-tag">
                                        {personagemDestaque.tipo}
                                    </span>

                                    {personagemDestaque.lvl && (
                                        <span className="featured-tag">
                                            Nível {personagemDestaque.lvl}
                                        </span>
                                    )}

                                </div>

                            </div>

                        </div>
                    )}

                </div>

                <div className="dashboard-right">

                    <h2>�️ Últimas Missões</h2>

                    <div className="mission-list">

                        {ultimasMissoes.map(rep => (

                            <div
                                key={rep.id}
                                className="mini-card"
                            >

                                <div className="mission-card-header">

                                    <div>

                                        <h4>{rep.titulo}</h4>

                                        <p>
                                            {rep.dataExibicao || rep.data}
                                        </p>

                                    </div>

                                    <a
                                        href={rep.relatorioUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mission-download-btn"
                                    >
                                        📥 Abrir
                                    </a>

                                </div>

                            </div>

                        ))}

                    </div>

                </div>

            </section>
            
            <section className="home-section">

                <h2>🆕 Últimos Personagens</h2>

                <div className="character-preview-grid">

                    {ultimosPersonagens.map(char => (

                        <div
                            key={char.id}
                            className="character-preview"
                        >

                            {char.imagem && (
                                <img
                                    src={char.imagem}
                                    alt={char.nome}
                                />
                            )}

                            <h4>{char.nome}</h4>
                            <p>{char.raca}</p>

                        </div>

                    ))}

                </div>

            </section>

            <section className="home-section">

                <h2>🏰 Últimas Localizações</h2>

                <div className="location-preview-grid">

                    {ultimasLocations.map(local => (

                        <div
                            key={local.id}
                            className="location-preview"
                        >

                            {local.imagem && (
                                <img
                                    src={local.imagem}
                                    alt={local.nome}
                                />
                            )}

                            <h4>{local.nome}</h4>

                            <p>{local.reino}</p>

                        </div>

                    ))}

                </div>

            </section>
            
            <section className="home-section">

                <h2>🐉 Últimas Criaturas</h2>

                <div className="bestiary-preview-grid">

                    {ultimasCriaturas.map(criatura => (

                        <div
                            key={criatura.id}
                            className="bestiary-preview"
                        >

                            {criatura.imagem && (
                                <img
                                    src={criatura.imagem}
                                    alt={criatura.nome}
                                />
                            )}

                            <h4>{criatura.nome}</h4>

                            <p>{criatura.tipo}</p>

                        </div>

                    ))}

                </div>

            </section>

        </div>
    );
}

export default Home;