import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function MudaCentroMapa({ coordenadas }: { coordenadas: [number, number] }) {
  const map = useMap();
  map.setView(coordenadas, 14);
  return null;
}

export default function App() {
  const [endereco, setEndereco] = useState(''); //texto digitado pelo usuário
  const [carregando, setCarregando] = useState(false); //indica se há um requisição em andamento
  const [centro, setCentro] = useState<[number, number]>([-31.7654, -52.3376]); //ponto central atua do mapa
  const [marcadores, setMarcadores] = useState<Array<{ id: number; lat: number; lng: number; titulo: string }>>([]); //lista de locais buscados

  const buscarEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endereco.trim()) return;

    setCarregando(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        const novoLocal = {
          id: Date.now(),
          lat,
          lng,
          titulo: endereco,
        };

        setMarcadores((prev) => [...prev, novoLocal]);
        setCentro([lat, lng]);
        setEndereco('');
      } else {
        alert('Endereço não encontrado. Tente detalhar mais (ex: Rua, Número, Cidade).');
      }
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      alert('Erro ao conectar com a API de busca.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Demonstração React Leaflet + Geocodificação</h2>

      <form onSubmit={buscarEndereco} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Digite um endereço (ex: Avenida Paulista, 1000, São Paulo)"
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={carregando}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          {carregando ? 'Buscando...' : 'Marcar no Mapa'}
        </button>
      </form>

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        <MapContainer center={centro} zoom={13} style={{ height: '500px', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MudaCentroMapa coordenadas={centro} />

          {marcadores.map((marcador) => (
            <Marker key={marcador.id} position={[marcador.lat, marcador.lng]}>
              <Popup>
                <strong>Local:</strong> <br />
                {marcador.titulo}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}