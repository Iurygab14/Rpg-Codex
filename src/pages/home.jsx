import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import "../assets/home.css";

function Home() {
    const [characters, setCharacters] = useState([]);
    const [locations, setLocations] = useState([]);
    const [reports, setReports] = useState([]);
    const [bestiary, setBestiary] = useState([]);

    useEffect(() => {
        const unsubPlayers = onSnapshot(
            collection(db, "players"),
            (snapshot) => {
                setCharacters(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
            }
        );

        const unsubLocations = onSnapshot(
            collection(db, "locations"),
            (snapshot) => {
                setLocations(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
            }
        );

        const unsubReports = onSnapshot(
            collection(db, "reports"),
            (snapshot) => {
                setReports(
                    snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                );
            }
        );

        const unsubBestiary = onSnapshot(
            collection(db, "bestiary"),
            (snapshot) => {
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
            unsubReports();
            unsubBestiary();
        };
    }, []);

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

    const ultimosRelatorios = [...reports]
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 3);

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
                        <span>📄</span>
                        <h2>{reports.length}</h2>
                        <p>Relatórios</p>
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

                    <h2>📄 Últimos Relatórios</h2>

                    <div className="report-list">

                        {ultimosRelatorios.map(rep => (

                            <div
                                key={rep.id}
                                className="mini-card"
                            >

                                <div className="report-card-header">

                                    <div>

                                        <h4>{rep.nome}</h4>

                                        <p>
                                            {rep.data
                                                .split("-")
                                                .reverse()
                                                .join("/")}
                                        </p>

                                    </div>

                                    <a
                                        href={rep.pdfUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="report-download-btn"
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