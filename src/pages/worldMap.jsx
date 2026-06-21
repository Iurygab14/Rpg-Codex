import { useEffect, useRef, useState } from "react";
import { db } from "../firebaseConfig";
import { addDoc, collection, deleteDoc, deleteField, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { uploadImage } from "../services/cloudinary";
import "../assets/worldMap.css";

function WorldMap() {
  const [markers, setMarkers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [markerImageFile, setMarkerImageFile] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [creatingMarker, setCreatingMarker] = useState(false);
  const [selectingPosition, setSelectingPosition] = useState(false);
  const [newMarkerName, setNewMarkerName] = useState("");
  const [newMarkerDescription, setNewMarkerDescription] = useState("");
  const [newMarkerPosition, setNewMarkerPosition] = useState(null);
  const [linkingMode, setLinkingMode] = useState(false);
  const [linkingLocationId, setLinkingLocationId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const mapRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "mapMarkers"), (snapshot) => {
      setMarkers(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
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

  const linkedLocations = selectedMarker
    ? locations.filter((location) => location.marcadorPai === selectedMarker.id)
    : [];

  const pointsForSelectedMarker = selectedMarker
    ? pointsOfInterest.filter((point) => linkedLocations.some((location) => location.id === point.locationId))
    : [];

  const availableLocationsToLink = locations.filter(
    (location) => !location.marcadorPai
  );

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) || null;

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setSelectedLocationId("");
    setCreatingMarker(false);
    setSelectingPosition(false);
    setLinkingMode(false);
    setErrorMessage("");
  };

  const closePanel = () => {
    setSelectedMarker(null);
    setSelectedLocationId("");
    setCreatingMarker(false);
    setSelectingPosition(false);
    setLinkingMode(false);
    setErrorMessage("");
  };

  const openCreateModal = () => {
    setCreatingMarker(true);
    setSelectedMarker(null);
    setSelectedLocationId("");
    setSelectingPosition(false);
    setLinkingMode(false);
    setNewMarkerName("");
    setNewMarkerDescription("");
    setNewMarkerPosition(null);
    setErrorMessage("");
  };

  const handleMapClick = (event) => {
    if (!selectingPosition || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setNewMarkerPosition({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    });
    setSelectingPosition(false);
    setErrorMessage("");
  };

  const handleSaveMarker = async (event) => {
    event.preventDefault();

    if (!newMarkerName.trim() || !newMarkerPosition) {
      setErrorMessage("Preencha o nome do marcador e posicione-o no mapa.");
      return;
    }

    try {
      let imageUrl = "";
      if (markerImageFile) {
        imageUrl = await uploadImage(markerImageFile);
      }

      await addDoc(collection(db, "mapMarkers"), {
        nome: newMarkerName.trim(),
        descricao: newMarkerDescription.trim(),
        imagem: imageUrl,
        x: newMarkerPosition.x,
        y: newMarkerPosition.y,
      });
      setCreatingMarker(false);
      setSelectingPosition(false);
      setNewMarkerName("");
      setNewMarkerDescription("");
      setNewMarkerPosition(null);
      setMarkerImageFile(null);
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao salvar marcador:", error);
      setErrorMessage("Erro ao salvar o marcador. Tente novamente.");
    }
  };

  const handleSelectPositionClick = () => {
    setSelectingPosition(true);
    setErrorMessage("Clique em um ponto do mapa para posicionar o marcador.");
  };

  const openLinkLocation = () => {
    setLinkingMode(true);
    setErrorMessage("");
    if (availableLocationsToLink.length > 0) {
      setLinkingLocationId(availableLocationsToLink[0].id);
    } else {
      setLinkingLocationId("");
    }
  };

  const handleLinkLocationSubmit = async () => {
    if (!selectedMarker) {
      setErrorMessage("Selecione um marcador antes de vincular uma localização.");
      return;
    }

    if (!linkingLocationId) {
      setErrorMessage("Selecione a localização que será vinculada.");
      return;
    }

    const locationToLink = locations.find((location) => location.id === linkingLocationId);
    if (locationToLink?.marcadorPai) {
      setErrorMessage("Esta localização já está vinculada a outro marcador.");
      return;
    }

    try {
      const locationRef = doc(db, "locations", linkingLocationId);
      await updateDoc(locationRef, {
        marcadorPai: selectedMarker.id,
      });
      setLinkingMode(false);
      setLinkingLocationId("");
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao vincular localização:", error);
      setErrorMessage("Erro ao vincular a localização. Tente novamente.");
    }
  };

  const handleDeleteMarker = async () => {
    if (!selectedMarker) return;

    const confirmation = window.confirm(
      `Remover marcador "${selectedMarker.nome}" e desvincular ${linkedLocations.length} localizações?`
    );
    if (!confirmation) return;

    try {
      await Promise.all(
        linkedLocations.map((location) =>
          updateDoc(doc(db, "locations", location.id), {
            marcadorPai: deleteField(),
          })
        )
      );
      await deleteDoc(doc(db, "mapMarkers", selectedMarker.id));
      setSelectedMarker(null);
      setSelectedLocationId("");
      setLinkingMode(false);
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao remover marcador:", error);
      setErrorMessage("Erro ao remover o marcador. Tente novamente.");
    }
  };

  const handleUnlinkLocation = async () => {
    if (!selectedMarker || !selectedLocation) {
      setErrorMessage("Selecione uma localização vinculada antes de removê-la.");
      return;
    }

    if (selectedLocation.marcadorPai !== selectedMarker.id) {
      setErrorMessage("Esta localização não está vinculada a este marcador.");
      return;
    }

    try {
      const locationRef = doc(db, "locations", selectedLocation.id);
      await updateDoc(locationRef, {
        marcadorPai: deleteField(),
      });
      setSelectedLocationId("");
      setErrorMessage("");
    } catch (error) {
      console.error("Erro ao remover vínculo da localização:", error);
      setErrorMessage("Erro ao remover o vínculo. Tente novamente.");
    }
  };

  const handleLocationSelect = (locationId) => {
    setSelectedLocationId(locationId);
    setErrorMessage("");
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
            <button className="worldmap-btn" onClick={openCreateModal}>
              + Novo Marcador
            </button>
            <button className="worldmap-btn" onClick={closePanel}>
              Limpar seleção
            </button>
          </div>
        </header>

        <div
          className={`worldmap-frame ${selectingPosition ? "selecting" : ""}`}
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
                className={`map-marker ${
                  selectedMarker?.id === marker.id ? "active" : ""
                }`}
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                type="button"
                title={marker.nome}
                onClick={(event) => {
                  event.stopPropagation();
                  handleMarkerClick(marker);
                }}
              >
                <span />
              </button>
            ))}

            {newMarkerPosition && (
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
            {selectingPosition
              ? "Clique em um ponto do mapa para posicionar o marcador."
              : "Clique em um marcador dourado para ver detalhes da localização."}
          </div>
        </div>
      </section>

      <aside className={`worldmap-panel ${(selectedMarker || creatingMarker) ? "open" : "closed"}`}>
        <div className="panel-header">
          <div>
            <p className="panel-label">Detalhes do Ponto</p>
            <h2>
              {creatingMarker
                ? "Novo Marcador"
                : selectedMarker?.nome || "Selecione um marcador"}
            </h2>
          </div>
          <button className="panel-close" onClick={closePanel} type="button">
            ✕
          </button>
        </div>

        {creatingMarker ? (
          <form className="panel-form" onSubmit={handleSaveMarker}>
            <section className="panel-section">
              <strong>Nome</strong>
              <input
                value={newMarkerName}
                onChange={(event) => setNewMarkerName(event.target.value)}
                placeholder="Kolbrook"
              />
            </section>

            <section className="panel-section">
              <strong>Descrição</strong>
              <textarea
                value={newMarkerDescription}
                onChange={(event) => setNewMarkerDescription(event.target.value)}
                placeholder="Descrição breve da região ou ponto de interesse principal"
                rows={4}
              />
            </section>

            <section className="panel-section">
              <strong>Imagem</strong>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setMarkerImageFile(event.target.files[0])}
              />
            </section>

            <section className="panel-section">
              <strong>Posição</strong>
              <div className="position-info">
                {newMarkerPosition ? (
                  <span>
                    X: {newMarkerPosition.x}% | Y: {newMarkerPosition.y}%
                  </span>
                ) : (
                  <span>Posição ainda não definida</span>
                )}
                <button
                  type="button"
                  className="worldmap-btn small"
                  onClick={handleSelectPositionClick}
                >
                  Selecionar posição no mapa
                </button>
              </div>
            </section>

            {errorMessage && <p className="panel-error">{errorMessage}</p>}

            <div className="panel-actions">
              <button type="submit" className="worldmap-btn">
                Salvar Marcador
              </button>
              <button
                type="button"
                className="worldmap-btn secondary"
                onClick={() => setCreatingMarker(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : selectedMarker ? (
          <>
            <section className="panel-section">
              <strong>Nome do marcador</strong>
              <p>{selectedMarker.nome}</p>
            </section>

            {selectedMarker.descricao && (
              <section className="panel-section">
                <strong>Descrição</strong>
                <p>{selectedMarker.descricao}</p>
              </section>
            )}

            <section className="panel-section">
              <strong>Localizações vinculadas</strong>
              {linkedLocations.length === 0 ? (
                <p>Este marcador ainda não possui uma localização principal vinculada.</p>
              ) : (
                <>
                  <p>{linkedLocations.length} localizações registradas</p>
                  <ul className="linked-location-list">
                    {linkedLocations.map((location) => (
                      <li
                        key={location.id}
                        className={`linked-location-item ${
                          selectedLocation?.id === location.id ? "active" : ""
                        }`}
                        onClick={() => handleLocationSelect(location.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleLocationSelect(location.id);
                        }}
                      >
                        {location.nome}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="panel-section">
              <strong>Localizações internas</strong>
              {pointsForSelectedMarker.length === 0 ? (
                <p>Não há pontos de interesse cadastrados para as localidades vinculadas.</p>
              ) : (
                <ul className="linked-location-list">
                  {pointsForSelectedMarker.map((point) => (
                    <li key={point.id}>{point.nome}</li>
                  ))}
                </ul>
              )}
            </section>

            <div className="panel-actions">
              <button
                type="button"
                className="worldmap-btn"
                onClick={openLinkLocation}
              >
                + Vincular Localização
              </button>
              <button
                type="button"
                className="worldmap-btn secondary"
                onClick={handleDeleteMarker}
              >
                Remover marcador
              </button>
            </div>

            {linkingMode && (
              <section className="panel-section">
                <strong>Selecionar localização</strong>
                {availableLocationsToLink.length > 0 ? (
                  <>
                    <select
                      value={linkingLocationId}
                      onChange={(event) => setLinkingLocationId(event.target.value)}
                    >
                      {availableLocationsToLink.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.nome}
                        </option>
                      ))}
                    </select>
                    <div className="panel-actions">
                      <button
                        type="button"
                        className="worldmap-btn"
                        onClick={handleLinkLocationSubmit}
                      >
                        Vincular ao marcador
                      </button>
                      <button
                        type="button"
                        className="worldmap-btn secondary"
                        onClick={() => {
                          setLinkingMode(false);
                          setLinkingLocationId("");
                        }}
                      >
                        Fechar
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="panel-hint">
                    Não há locations livres para vincular. Remova o vínculo de uma localidade primeiro.
                  </p>
                )}
              </section>
            )}

            {selectedLocation && (
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

                {selectedLocation.marcadorPai === selectedMarker?.id && (
                  <button
                    type="button"
                    className="worldmap-btn secondary"
                    onClick={handleUnlinkLocation}
                  >
                    Remover do marcador
                  </button>
                )}
              </>
            )}

            {errorMessage && <p className="panel-error">{errorMessage}</p>}
          </>
        ) : (
          <div className="panel-empty">
            Selecione um marcador dourado para ver as informações da região.
          </div>
        )}
      </aside>
    </div>
  );
}

export default WorldMap;
