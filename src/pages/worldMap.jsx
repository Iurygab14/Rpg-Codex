import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../firebaseConfig";
import { addDoc, collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import "../assets/worldMap.css";

function WorldMap() {
  const routerLocation = useLocation();
  const [markers, setMarkers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [positioningMode, setPositioningMode] = useState(false);
  const [positioningLocationId, setPositioningLocationId] = useState("");
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const mapRef = useRef(null);

  useEffect(() => {
    if (routerLocation.state?.positioningLocationId) {
      setPositioningLocationId(routerLocation.state.positioningLocationId);
      setPositioningMode(true);
      setSelectedMarker(null);
      setErrorMessage("Clique no mapa para posicionar a localização criada.");
    }
  }, [routerLocation.state]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "mapMarkers"), (snapshot) => {
      setMarkers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "locations"), (snapshot) => {
      setLocations(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "pointsOfInterest"), (snapshot) => {
      setPointsOfInterest(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  const positioningLocation = locations.find((location) => location.id === positioningLocationId) || null;
  const selectedLocation = selectedMarker
    ? locations.find((location) => location.id === selectedMarker.locationId)
    : null;

  const pointsForSelectedLocation = selectedLocation
    ? pointsOfInterest.filter((point) => point.locationId === selectedLocation.id)
    : [];

  const unpositionedLocations = locations.filter(
    (location) => !markers.some((marker) => marker.locationId === location.id)
  );

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setPositioningMode(false);
    setPositioningLocationId("");
    setNewMarkerPosition(null);
    setErrorMessage("");
  };

  const closePanel = () => {
    setSelectedMarker(null);
    setPositioningMode(false);
    setPositioningLocationId("");
    setNewMarkerPosition(null);
    setErrorMessage("");
  };

  const startPositioningLocation = (locationId) => {
    setPositioningLocationId(locationId);
    setPositioningMode(true);
    setSelectedMarker(null);
    setNewMarkerPosition(null);
    setErrorMessage("Clique no mapa para posicionar a localização criada.");
  };

  const cancelPositioning = () => {
    setPositioningMode(false);
    setPositioningLocationId("");
    setNewMarkerPosition(null);
    setErrorMessage("");
  };

  const handleMapClick = async (event) => {
    if (!positioningMode || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (!positioningLocationId) {
      setErrorMessage("Selecione uma localização para posicionar no mapa.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "mapMarkers"), {
        locationId: positioningLocationId,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
      });

      setNewMarkerPosition({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      setPositioningMode(false);
      setPositioningLocationId("");
      setSelectedMarker({ id: docRef.id, locationId: positioningLocationId, x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao posicionar localização:", error);
      setErrorMessage("Erro ao posicionar a localização. Tente novamente.");
    }
  };

  const handleDeleteMarker = async () => {
    if (!selectedMarker) return;

    const confirmation = window.confirm(
      `Remover marcador da localização selecionada?`
    );
    if (!confirmation) return;

    try {
      await deleteDoc(doc(db, "mapMarkers", selectedMarker.id));
      setSelectedMarker(null);
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao remover marcador:", error);
      setErrorMessage("Erro ao remover o marcador. Tente novamente.");
    }
  };

  return (
    <div className="worldmap-page">
      <section className="worldmap-shell">
        <header className="worldmap-header">
          <div>
            <p className="worldmap-label">Mapa do Mundo</p>
            <h1>Mapa das Terras</h1>
          </div>
          <div className="worldmap-actions">
            <span>{markers.length} marcadores no mapa</span>
            {positioningMode && (
              <button className="worldmap-btn secondary" onClick={cancelPositioning}>
                Cancelar posicionamento
              </button>
            )}
          </div>
        </header>

        <div
          className={`worldmap-frame ${positioningMode ? "positioning" : ""}`}
          ref={mapRef}
          onClick={handleMapClick}
        >
          <img
            className="worldmap-image"
            src="/imgs/world-map.jpg"
            alt="Mapa do Mundo"
          />

          <div className="map-overlay">
            {markers.map((marker) => (
              <button
                key={marker.id}
                className={`map-marker ${selectedMarker?.id === marker.id ? "active" : ""}`}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                type="button"
                title={marker.locationId}
                onClick={(event) => {
                  event.stopPropagation();
                  handleMarkerClick(marker);
                }}
              >
                <span />
              </button>
            ))}

            {positioningMode && newMarkerPosition && (
              <div
                className="map-marker preview"
                style={{
                  left: `${newMarkerPosition.x}%`,
                  top: `${newMarkerPosition.y}%`,
                }}
              >
                <span />
              </div>
            )}
          </div>

          <div className="worldmap-footnote">
            {positioningMode
              ? `Clique no mapa para posicionar ${positioningLocation?.nome || "a localização"}.`
              : "Clique em um marcador dourado para ver detalhes da localização."}
          </div>
        </div>
      </section>

      <aside className={`worldmap-panel ${(selectedMarker || positioningMode || unpositionedLocations.length > 0) ? "open" : "closed"}`}>
        <div className="panel-header">
          <div>
            <p className="panel-label">Detalhes do Local</p>
            <h2>
              {positioningMode
                ? "Posicionar Localização"
                : selectedLocation
                ? selectedLocation.nome
                : "Selecione um marcador"}
            </h2>
          </div>
          <button className="panel-close" onClick={closePanel} type="button">
            ✕
          </button>
        </div>

        {positioningMode ? (
          <>
            <section className="panel-section">
              <strong>Localização</strong>
              <p>{positioningLocation?.nome || "Localização pendente"}</p>
            </section>
            <section className="panel-section">
              <strong>Instruções</strong>
              <p>{errorMessage || "Clique no mapa para salvar as coordenadas da localização."}</p>
            </section>
          </>
        ) : selectedLocation ? (
          <>
            {selectedLocation.imagem && (
              <div className="panel-image-wrap">
                <img
                  className="panel-image"
                  src={selectedLocation.imagem}
                  alt={selectedLocation.nome}
                />
              </div>
            )}

            <section className="panel-section">
              <strong>Nome</strong>
              <p>{selectedLocation.nome}</p>
            </section>

            <section className="panel-section">
              <strong>Descrição</strong>
              <p>{selectedLocation.descricao || "Sem descrição."}</p>
            </section>

            <section className="panel-section">
              <strong>Localizações internas</strong>
              {pointsForSelectedLocation.length === 0 ? (
                <p>Não há pontos de interesse cadastrados para esta localidade.</p>
              ) : (
                <ul className="linked-location-list">
                  {pointsForSelectedLocation.map((point) => (
                    <li key={point.id}>{point.nome}</li>
                  ))}
                </ul>
              )}
            </section>

            <div className="panel-actions">
              <button className="worldmap-btn secondary" onClick={handleDeleteMarker}>
                Remover marcador
              </button>
            </div>

            {errorMessage && <p className="panel-error">{errorMessage}</p>}
          </>
        ) : (
          <>
            <div className="panel-empty">
              Selecione um marcador dourado para ver as informações da região.
            </div>
            {unpositionedLocations.length > 0 && (
              <section className="panel-section">
                <strong>Localizações sem marcador</strong>
                <ul className="linked-location-list">
                  {unpositionedLocations.map((location) => (
                    <li key={location.id}>
                      <button
                        type="button"
                        className="worldmap-btn small"
                        onClick={() => startPositioningLocation(location.id)}
                      >
                        Posicionar {location.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

export default WorldMap;
