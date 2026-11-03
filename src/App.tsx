import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
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
  const [enderecoOrigem, setEnderecoOrigem] = useState(''); //texto digitado pelo usuário
  const [enderecoDestino, setEnderecoDestino] = useState(''); //texto digitado pelo usuário
  const [carregando, setCarregando] = useState(false); //indica se há um requisição em andamento
  const [centro, setCentro] = useState<[number, number]>([-31.7654, -52.3376]); //ponto central atua do mapa
  const [marcadores, setMarcadores] = useState<Array<{ id: number; lat: number; lng: number; titulo: string }>>([]); //lista de locais buscados
  const [rota, setRota] = useState<Array<[number, number]>>([]);

  const buscarEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enderecoOrigem.trim() || !enderecoDestino.trim()) return;

    setCarregando(true);
    try {
      const [resOrigem, resDestino] = await Promise.all([
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoOrigem)}`),
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoDestino)}`)
      ]);

      const [dataOrigem, dataDestino] = await Promise.all([
        resOrigem.json(),
        resDestino.json()
      ]);
      
      if (dataOrigem.length > 0 && dataDestino.length > 0) {
        const latOrigem = parseFloat(dataOrigem[0].lat);
        const lngOrigem = parseFloat(dataOrigem[0].lon);

        const latDestino = parseFloat(dataDestino[0].lat);
        const lngDestino = parseFloat(dataDestino[0].lon);

        const pontoOrigem = {
          id: Date.now(),
          lat: latOrigem,
          lng: lngOrigem,
          titulo: `Origem: ${enderecoOrigem}`,
        };

        const pontoDestino = {
          id: Date.now() + 1,
          lat: latDestino,
          lng: lngDestino,
          titulo: `Destino: ${enderecoDestino}`,
        };

        setMarcadores([pontoOrigem, pontoDestino]);
        setCentro([latOrigem, lngOrigem]);

        const origemLngLat = `${lngOrigem},${latOrigem}`;
        const destinoLngLat = `${lngDestino},${latDestino}`;

        const pontosDaRota = await calculaRota(origemLngLat, destinoLngLat);
        setRota(pontosDaRota)

        setEnderecoOrigem('');
        setEnderecoDestino('');

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

  const calculaRota = async (origem: string, destino: string) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origem};${destino}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const rota = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );
        
        return rota;
      }

      alert('Nenhuma rota terrestre foi encontrada entre os dois pontos.');
      return [];
    } catch (error) {
      console.error('Erro ao calcular rota no OSRM:', error);
      return [];
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Demonstração React Leaflet + Geocodificação</h2>

      <form onSubmit={buscarEndereco} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={enderecoOrigem}
          onChange={(e) => setEnderecoOrigem(e.target.value)}
          placeholder="Endereço de Origem"
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          value={enderecoDestino}
          onChange={(e) => setEnderecoDestino(e.target.value)}
          placeholder="Enedereço de Destino"
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
          {rota.length > 0 && (
            <Polyline positions={rota} color="#0066ff" weight={5} opacity={0.7} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}