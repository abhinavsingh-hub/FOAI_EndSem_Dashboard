import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RefreshCw, Users, MapPin, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Default Icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom ISS Icon
const issIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Haversine formula to calculate distance between two lat/lon in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Component to recenter map
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function ISSTracker() {
  const [position, setPosition] = useState([0, 0]);
  const [path, setPath] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [locationName, setLocationName] = useState('Loading...');
  const [astros, setAstros] = useState({ number: 0, people: [] });
  const [loading, setLoading] = useState(true);

  const fetchAstros = async () => {
    try {
      const isDev = import.meta.env.DEV;
      const url = isDev ? 'http://api.open-notify.org/astros.json' : '/api/iss?endpoint=astros.json';
      const res = await fetch(url);
      const data = await res.json();
      if (data.message === 'success') {
        setAstros({ number: data.number, people: data.people });
      }
    } catch (e) {
      console.error("Failed to fetch astros", e);
    }
  };

  const fetchLocationName = async (lat, lon) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const data = await res.json();
      if (data && (data.city || data.locality || data.countryName)) {
        setLocationName(data.city || data.locality || data.countryName || 'Unknown Land');
      } else {
        setLocationName('Over the Ocean');
      }
    } catch (e) {
      setLocationName('Unknown Location');
    }
  };

  const fetchISS = useCallback(async (isManual = false) => {
    try {
      setLoading(true);
      const isDev = import.meta.env.DEV;
      const url = isDev ? 'http://api.open-notify.org/iss-now.json' : '/api/iss?endpoint=iss-now.json';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.message === 'success') {
        const newLat = parseFloat(data.iss_position.latitude);
        const newLon = parseFloat(data.iss_position.longitude);
        const newPos = [newLat, newLon];
        
        setPosition(newPos);
        fetchLocationName(newLat, newLon);
        
        setPath(prevPath => {
          const newPath = [...prevPath, newPos].slice(-15); // Keep last 15
          
          if (prevPath.length > 0) {
            const lastPos = prevPath[prevPath.length - 1];
            const dist = calculateDistance(lastPos[0], lastPos[1], newLat, newLon);
            // 15 seconds passed. Speed = (dist / 15) * 3600
            const currentSpeed = (dist / 15) * 3600;
            if (currentSpeed > 0 && currentSpeed < 40000) {
              setSpeed(currentSpeed);
              // Save speed for chart
              const speedHistory = JSON.parse(localStorage.getItem('iss_speed_history') || '[]');
              speedHistory.push({ time: new Date().toLocaleTimeString(), speed: currentSpeed });
              localStorage.setItem('iss_speed_history', JSON.stringify(speedHistory.slice(-30)));
              // Dispatch custom event to notify chart
              window.dispatchEvent(new Event('iss_speed_update'));
            }
          }
          return newPath;
        });

        if (isManual) toast.success('ISS Location Updated!');
      }
    } catch (e) {
      toast.error('Failed to fetch ISS data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchISS();
    fetchAstros();
    const interval = setInterval(() => fetchISS(), 15000);
    return () => clearInterval(interval);
  }, [fetchISS]);

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-blue-500" />
          Live ISS Tracker
        </h2>
        <button 
          onClick={() => fetchISS(true)}
          disabled={loading}
          className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border border-b border-border text-sm">
        <div className="p-4 flex flex-col justify-center">
          <span className="text-muted-foreground mb-1">Coordinates</span>
          <span className="font-mono font-medium">{position[0].toFixed(4)}, {position[1].toFixed(4)}</span>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <span className="text-muted-foreground mb-1">Speed</span>
          <span className="font-mono font-medium">{speed > 0 ? `${speed.toFixed(0)} km/h` : 'Calculating...'}</span>
        </div>
        <div className="p-4 flex flex-col justify-center">
          <span className="text-muted-foreground mb-1">Nearest Place</span>
          <span className="font-medium flex items-center gap-1">
            <MapPin className="h-4 w-4 text-red-400" /> {locationName}
          </span>
        </div>
        <div className="p-4 flex flex-col justify-center relative group cursor-help">
          <span className="text-muted-foreground mb-1">Crew</span>
          <span className="font-medium flex items-center gap-1">
            <Users className="h-4 w-4 text-green-500" /> {astros.number} People
          </span>
          {/* Tooltip for Crew */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-popover text-popover-foreground border border-border p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
            <div className="font-semibold mb-1 text-xs uppercase text-muted-foreground">Astronauts</div>
            <ul className="text-sm space-y-1">
              {astros.people.map((p, i) => <li key={i}>{p.name}</li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] relative z-0">
        {position[0] === 0 && position[1] === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MapContainer center={position} zoom={4} scrollWheelZoom={true} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={position} />
            {path.length > 1 && <Polyline positions={path} color="red" weight={3} dashArray="5, 10" />}
            <Marker position={position} icon={issIcon}>
              <Popup>
                <strong>International Space Station</strong><br/>
                Lat: {position[0].toFixed(4)}<br/>
                Lon: {position[1].toFixed(4)}<br/>
                Speed: {speed.toFixed(0)} km/h
              </Popup>
            </Marker>
          </MapContainer>
        )}
      </div>
    </div>
  );
}
