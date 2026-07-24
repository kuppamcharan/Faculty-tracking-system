import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

const createCustomMarker = (name) => {
  return L.divIcon({
    className: 'custom-name-marker',
    html: `<div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);"><div style="font-size: 28px; text-shadow: 0px 2px 4px rgba(0,0,0,0.5);">📍</div><div style="background-color: white; border: 2px solid #2563eb; color: #111827; font-weight: bold; font-size: 12px; padding: 2px 8px; border-radius: 12px; white-space: nowrap; box-shadow: 0px 2px 4px rgba(0,0,0,0.3); margin-top: -5px;">${name}</div></div>`,
    iconSize: [0, 0],
  });
};

function MapCameraUpdater({ selectedFaculty }) {
  const map = useMap();
  useEffect(() => {
    if (selectedFaculty && selectedFaculty.latitude && selectedFaculty.longitude) {
      map.flyTo([selectedFaculty.latitude, selectedFaculty.longitude], 21, { animate: true, duration: 1.5 });
    }
  }, [selectedFaculty, map]);
  return null;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [facultyLocations, setFacultyLocations] = useState([]);
  const [studentInfo, setStudentInfo] = useState({ branch: '', year: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [collegeSettings, setCollegeSettings] = useState({ name: 'Faculty Tracker', logoUrl: '' });

  const centerOfCampus = [13.2475, 79.0965];
  const campusBounds = [ [13.2450, 79.0940], [13.2500, 79.0990] ];

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) navigate('/'); 
      else {
        const studentDoc = await getDoc(doc(db, 'users', user.uid));
        if (studentDoc.exists()) setStudentInfo({ branch: studentDoc.data().branch, year: studentDoc.data().year });
        setLoading(false);
      }
    });

    const unsubscribeDB = onSnapshot(collection(db, 'locations'), (snapshot) => setFacultyLocations(snapshot.docs.map(doc => doc.data())));
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => { if (docSnap.exists()) setCollegeSettings(docSnap.data()); });

    return () => { unsubscribeAuth(); unsubscribeDB(); unsubscribeSettings(); };
  }, [navigate]);

  const handleSelectFaculty = (faculty) => {
    if (faculty.current_block === "Out of Campus" || !faculty.latitude) { alert(`${faculty.name || 'This faculty'} is currently out of campus.`); return; }
    setSelectedFaculty(faculty);
  };

  const visibleFaculty = facultyLocations.filter(loc => {
    if (!loc.assigned_classes) return false;
    const matchesClass = loc.assigned_classes.some(cls => cls.branch === studentInfo.branch && cls.year === studentInfo.year);
    const matchesSearch = (loc.name || loc.email).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'white', backgroundColor: '#111827', minHeight: '100vh' }}>Loading radar...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#1f2937', padding: '15px 20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', color: 'white', borderBottom: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {collegeSettings.logoUrl && <img src={collegeSettings.logoUrl} alt="Logo" style={{ height: '40px', borderRadius: '4px', objectFit: 'contain' }} />}
          <div>
            <h2 style={{ margin: 0, color: '#60a5fa', fontSize: '20px' }}>{collegeSettings.name} - Student</h2>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Tracking: {studentInfo.branch} - Year {studentInfo.year}</p>
          </div>
        </div>
        <button onClick={() => signOut(auth).then(() => navigate('/'))} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', padding: '20px', gap: '20px' }}>
        <div style={{ flex: '1 1 60%', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, minHeight: '500px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #374151' }}>
            <MapContainer center={[13.2475, 79.0965]} zoom={17} minZoom={16} maxZoom={20} maxBounds={campusBounds} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%', backgroundColor: '#000' }}>
  
              {/* LAYER 1: Pure Satellite Imagery (No text to get stretched) */}
              <TileLayer 
                url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" 
                maxNativeZoom={20}
                maxZoom={22}
              />

              {/* LAYER 2: High-Res Labels & Roads (Transparent background) */}
              <TileLayer 
                url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}&scale=2" 
                attribution="&copy; Google Maps" 
                maxNativeZoom={20}
                maxZoom={22}
              />
              <MapCameraUpdater selectedFaculty={selectedFaculty} />
              {visibleFaculty.map((faculty, index) => {
                 if (faculty.latitude && faculty.longitude) {
                   const isInsideCampus = faculty.latitude >= 13.2450 && faculty.latitude <= 13.2500 && faculty.longitude >= 79.0940 && faculty.longitude <= 79.0990;
                   if (isInsideCampus) return <Marker key={index} position={[faculty.latitude, faculty.longitude]} icon={createCustomMarker(faculty.name || faculty.email.split('@')[0])} />
                 }
                 return null;
              })}
            </MapContainer>
          </div>
        </div>

        <div style={{ flex: '1 1 30%', minWidth: '300px', backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', color: 'white', border: '1px solid #374151' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Assigned Faculty</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
              <input type="text" placeholder="Search teacher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => { setSearchTerm(''); setSelectedFaculty(null); }} style={{ padding: '10px 16px', backgroundColor: '#374151', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
          </div>

          <div style={{ display: 'grid', gap: '15px', overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' }}>
            {visibleFaculty.length === 0 ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>No teachers active on campus.</p> : visibleFaculty.map((loc, index) => {
                const isSelected = selectedFaculty?.uid === loc.uid;
                const isOut = loc.current_block === "Out of Campus";
                return (
                  <div key={index} onClick={() => handleSelectFaculty(loc)} style={{ padding: '15px', border: `1px solid ${isSelected ? '#3b82f6' : '#4b5563'}`, borderRadius: '8px', backgroundColor: isSelected ? '#1e3a8a' : '#111827', cursor: isOut ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isOut ? 0.6 : 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#f3f4f6' }}>{loc.name || loc.email}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Updated: {loc.timestamp}</span>
                      <span style={{ backgroundColor: isOut ? '#4b5563' : '#2563eb', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{loc.current_block}</span>
                    </div>
                  </div>
                )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}