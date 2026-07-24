import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

const createCustomMarker = (name, isMe = false) => {
  return L.divIcon({
    className: 'custom-name-marker',
    html: `<div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);"><div style="font-size: ${isMe ? '32px' : '28px'}; text-shadow: 0px 2px 4px rgba(0,0,0,0.5);">${isMe ? '🟢' : '📍'}</div><div style="background-color: ${isMe ? '#10b981' : 'white'}; border: 2px solid ${isMe ? '#047857' : '#2563eb'}; color: ${isMe ? 'white' : '#111827'}; font-weight: bold; font-size: 12px; padding: 2px 8px; border-radius: 12px; white-space: nowrap; box-shadow: 0px 2px 4px rgba(0,0,0,0.3); margin-top: -5px;">${name}</div></div>`,
    iconSize: [0, 0],
  });
};

function MapCameraUpdater({ selectedFaculty, myLocalPos, isTracking }) {
  const map = useMap();
  const initialLockRef = useRef(false);

  // Reset initial lock tracker when tracking is paused
  useEffect(() => {
    if (!isTracking) {
      initialLockRef.current = false;
    }
  }, [isTracking]);

  // 1. Fly to selected colleague from the side panel
  useEffect(() => { 
    if (selectedFaculty && selectedFaculty.latitude && selectedFaculty.longitude) {
      map.flyTo([selectedFaculty.latitude, selectedFaculty.longitude], 18, { animate: true, duration: 1.5 }); 
    }
  }, [selectedFaculty, map]);

  // 2. Instantly snap to your live GPS position on the first precise lock
  useEffect(() => {
    if (isTracking && !initialLockRef.current && myLocalPos && myLocalPos.latitude && myLocalPos.longitude) {
      initialLockRef.current = true;
      map.flyTo([myLocalPos.latitude, myLocalPos.longitude], 18, { animate: true, duration: 1.2 });
    }
  }, [myLocalPos, isTracking, map]);

  return null;
}

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Faculty');
  const [facultyClasses, setFacultyClasses] = useState([]); 
  const [statusMsg, setStatusMsg] = useState('System Ready. Start tracking when you arrive.');
  const [isTracking, setIsTracking] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColleague, setSelectedColleague] = useState(null); 
  const [myLocalPos, setMyLocalPos] = useState(null); // 🟢 Zero-latency local GPS state
  const [newBranch, setNewBranch] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newSection, setNewSection] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collegeSettings, setCollegeSettings] = useState({ name: 'Faculty Tracker', logoUrl: '' });
  const watchIdRef = useRef(null);

  // Fix for React stale closures during continuous GPS tracking
  const facultyClassesRef = useRef(facultyClasses);
  const userNameRef = useRef(userName);

  useEffect(() => { facultyClassesRef.current = facultyClasses; }, [facultyClasses]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);

  const collegeBoundary = { lat: 13.2480, lng: 79.0965, maxRadiusMeters: 300 }; 
  const campusBounds = [ [13.2450, 79.0940], [13.2500, 79.0990] ];
  const campusZones = [ {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Area name": "Canteen"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0960228,
              13.2468337
            ],
            [
              79.09606,
              13.2468632
            ],
            [
              79.0961084,
              13.2468549
            ],
            [
              79.0961354,
              13.246819
            ],
            [
              79.0962069,
              13.2468107
            ],
            [
              79.0962497,
              13.2468359
            ],
            [
              79.0962949,
              13.2468308
            ],
            [
              79.0963317,
              13.2467887
            ],
            [
              79.0963301,
              13.246751
            ],
            [
              79.0962941,
              13.2467254
            ],
            [
              79.0962343,
              13.246725
            ],
            [
              79.0962243,
              13.2467317
            ],
            [
              79.0962033,
              13.2467136
            ],
            [
              79.0961229,
              13.246725
            ],
            [
              79.0961067,
              13.2467447
            ],
            [
              79.096051,
              13.2467451
            ],
            [
              79.0960175,
              13.2467872
            ],
            [
              79.0960228,
              13.2468337
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Mech Block"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0956016,
              13.2477635
            ],
            [
              79.0954516,
              13.2477857
            ],
            [
              79.0952736,
              13.2478153
            ],
            [
              79.0953255,
              13.2480497
            ],
            [
              79.0953607,
              13.2482937
            ],
            [
              79.095491,
              13.2482697
            ],
            [
              79.0954997,
              13.2482951
            ],
            [
              79.0956907,
              13.2482641
            ],
            [
              79.0956016,
              13.2477635
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "CSE Block"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0957284,
              13.248227
            ],
            [
              79.0958056,
              13.2482115
            ],
            [
              79.0958114,
              13.2482496
            ],
            [
              79.0960054,
              13.2482186
            ],
            [
              79.0960126,
              13.2481791
            ],
            [
              79.0960778,
              13.248165
            ],
            [
              79.0960778,
              13.2480791
            ],
            [
              79.0961404,
              13.2480651
            ],
            [
              79.0961018,
              13.2478471
            ],
            [
              79.0960536,
              13.2478494
            ],
            [
              79.0960242,
              13.2478132
            ],
            [
              79.0960112,
              13.247729695305651
            ],
            [
              79.095933,
              13.2477442
            ],
            [
              79.0959229,
              13.2477089
            ],
            [
              79.0957391,
              13.2477442
            ],
            [
              79.0957312,
              13.2477718
            ],
            [
              79.0956489,
              13.2477815
            ],
            [
              79.0957284,
              13.248227
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Academic Block"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0960531,
              13.2475522
            ],
            [
              79.0961813,
              13.2475352
            ],
            [
              79.0961847,
              13.2475749
            ],
            [
              79.0962798,
              13.24756
            ],
            [
              79.0962849,
              13.2476079
            ],
            [
              79.0964583,
              13.2475784
            ],
            [
              79.09646,
              13.247527
            ],
            [
              79.0965467,
              13.2475171
            ],
            [
              79.0965458,
              13.2474691
            ],
            [
              79.0966613,
              13.2474509
            ],
            [
              79.0966528,
              13.2473774
            ],
            [
              79.0965943,
              13.2473856
            ],
            [
              79.0966053,
              13.2473443
            ],
            [
              79.096647,
              13.2471195
            ],
            [
              79.0965014,
              13.2470805
            ],
            [
              79.096505,
              13.2471266
            ],
            [
              79.0963303,
              13.2471479
            ],
            [
              79.0963157,
              13.2470486
            ],
            [
              79.0962574,
              13.2470415
            ],
            [
              79.0962684,
              13.2471585
            ],
            [
              79.0960863,
              13.2472046
            ],
            [
              79.0960779,
              13.2471557
            ],
            [
              79.0959373,
              13.2472306
            ],
            [
              79.0960615,
              13.2474332
            ],
            [
              79.0960916,
              13.247456
            ],
            [
              79.0960481,
              13.2474674
            ],
            [
              79.0960531,
              13.2475522
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Parking"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0965474,
              13.2490108
            ],
            [
              79.0969118,
              13.2489374
            ],
            [
              79.0970167,
              13.2496563
            ],
            [
              79.0970025,
              13.2496645
            ],
            [
              79.0966822,
              13.2495831
            ],
            [
              79.0965474,
              13.2490108
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Faculty Qurters"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0973707,
              13.24655842370278
            ],
            [
              79.09765305784555,
              13.24655842370278
            ],
            [
              79.09765305784555,
              13.246334
            ],
            [
              79.0973707,
              13.246334
            ],
            [
              79.0973707,
              13.24655842370278
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Boys Hostel"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0973895,
              13.2461424
            ],
            [
              79.0979092,
              13.2460579
            ],
            [
              79.0984279,
              13.2459625
            ],
            [
              79.0984263,
              13.245842
            ],
            [
              79.0978804,
              13.2459251
            ],
            [
              79.0973684,
              13.2460166
            ],
            [
              79.0973895,
              13.2461424
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Indoor Stadium"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0954975,
              13.2468985
            ],
            [
              79.0955922,
              13.2468985
            ],
            [
              79.0957163,
              13.2468726
            ],
            [
              79.0956526,
              13.2464835
            ],
            [
              79.0954414,
              13.2465153
            ],
            [
              79.0954975,
              13.2468985
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Hostel Canteen"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0954092,
              13.2467806
            ],
            [
              79.0950614,
              13.2468446
            ],
            [
              79.0950189,
              13.2466153
            ],
            [
              79.0951737,
              13.246586
            ],
            [
              79.0953654,
              13.2465527
            ],
            [
              79.0954092,
              13.2467806
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Girls Hostel"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0943357,
              13.2466529
            ],
            [
              79.0948347,
              13.2465577
            ],
            [
              79.0948151264023,
              13.24642815154236
            ],
            [
              79.0945686,
              13.2464777
            ],
            [
              79.0943162,
              13.2465348
            ],
            [
              79.0943357,
              13.2466529
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Main Gate Road"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0971262,
              13.2498048
            ],
            [
              79.097289,
              13.2497763
            ],
            [
              79.0969198,
              13.2475277
            ],
            [
              79.096857,
              13.247534
            ],
            [
              79.0971114,
              13.2491062
            ],
            [
              79.0970065,
              13.2491297
            ],
            [
              79.0971262,
              13.2498048
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Academic Block Road"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0961313,
              13.2477092
            ],
            [
              79.0967482,
              13.2476199
            ],
            [
              79.0968605,
              13.2475992
            ],
            [
              79.0968528,
              13.2475519
            ],
            [
              79.0961338,
              13.2476518
            ],
            [
              79.0961313,
              13.2477092
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Canteen Road"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.0958455,
              13.2470553
            ],
            [
              79.0960719,
              13.2470167
            ],
            [
              79.0971883,
              13.2468418
            ],
            [
              79.0971702,
              13.2467847
            ],
            [
              79.095928,
              13.2469873
            ],
            [
              79.0958225,
              13.2470026
            ],
            [
              79.0958455,
              13.2470553
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Area name": "Play Ground"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              79.097661,
              13.2488137660214
            ],
            [
              79.0986255,
              13.2488137660214
            ],
            [
              79.0986255,
              13.2476054
            ],
            [
              79.097661,
              13.2476054
            ],
            [
              79.097661,
              13.2488137660214
            ]
          ]
        ]
      }
    }
  ]
} ];
  // 1. Ray-Casting function (Keep this exactly as you have it)
  const isPointInGeoJSONPolygon = (lat, lng, polygonCoords) => {
    let isInside = false;
    const outerRing = polygonCoords[0]; 
    for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
      const vertexXi = outerRing[i][0], vertexYi = outerRing[i][1]; 
      const vertexXj = outerRing[j][0], vertexYj = outerRing[j][1];
      const intersect = ((vertexYi > lat) !== (vertexYj > lat)) && (lng < (vertexXj - vertexXi) * (lat - vertexYi) / (vertexYj - vertexYi) + vertexXi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  };

  // 2. NEW: Calculate the true "Center of Gravity" for any building shape
  const getPolygonCenter = (coords) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    coords[0].forEach(([lng, lat]) => {
      if (lng < minX) minX = lng; if (lng > maxX) maxX = lng;
      if (lat < minY) minY = lat; if (lat > maxY) maxY = lat;
    });
    return { lat: (minY + maxY) / 2, lng: (minX + maxX) / 2 };
  };
  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180);
    const Δλ = (lon2 - lon1) * (Math.PI / 180);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
  };
  
  // 3. UPGRADED: Smart determineBlock with Overlap Resolution and Drift Snapping
  
  const determineBlock = (lat, lng) => { 
    if (getDistanceInMeters(collegeBoundary.lat, collegeBoundary.lng, lat, lng) > collegeBoundary.maxRadiusMeters) {
      return "Out of Campus"; 
    }
    
    const features = campusZones[0].features;
    let insideFeatures = [];

    // Step A: Find EVERY building the GPS dot is currently touching
    for (let feature of features) {
      if (feature.geometry.type === "Polygon") {
        if (isPointInGeoJSONPolygon(lat, lng, feature.geometry.coordinates)) {
          insideFeatures.push(feature);
        }
      }
    }

    // Step B: If you are perfectly inside exactly ONE building, return it.
    if (insideFeatures.length === 1) {
      return insideFeatures[0].properties["Area name"];
    }

    // Step C: OVERLAP RESOLUTION (Mech vs CSE)
    // If the polygons overlap and you are inside both, calculate which center is actually closer.
    if (insideFeatures.length > 1) {
      let closestFeature = insideFeatures[0];
      let minDistance = Infinity;
      for (let feat of insideFeatures) {
         const center = getPolygonCenter(feat.geometry.coordinates);
         const dist = getDistanceInMeters(center.lat, center.lng, lat, lng);
         if (dist < minDistance) { minDistance = dist; closestFeature = feat; }
      }
      return closestFeature.properties["Area name"];
    }

    // Step D: INDOOR DRIFT RESOLUTION (The Alleyway Fallback)
    // If the GPS bounced outside the walls into an alleyway, find the absolute closest building.
    let nearestFeature = null;
    let minDistanceToCenter = Infinity;
    for (let feature of features) {
      const center = getPolygonCenter(feature.geometry.coordinates);
      const dist = getDistanceInMeters(center.lat, center.lng, lat, lng);
      if (dist < minDistanceToCenter) {
         minDistanceToCenter = dist;
         nearestFeature = feature;
      }
    }

    // If you are within 25 meters of a building's center but the Ray-Casting missed 
    // due to concrete ceiling interference, snap into that building.
    if (nearestFeature && minDistanceToCenter < 25) {
      return nearestFeature.properties["Area name"];
    }

    return "Walking on Campus"; 
  };

  useEffect(() => {
    const timer = setInterval(() => { const now = new Date(); setCurrentTime(now); if (now.getHours() >= 17 && isTracking) { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; setIsTracking(false); setMyLocalPos(null); setStatusMsg('🌙 College hours ended. Tracking automatically disabled.'); if (auth.currentUser) try { deleteDoc(doc(db, 'locations', auth.currentUser.uid)); } catch(e) {} } }, 60000);
    return () => clearInterval(timer);
  }, [isTracking]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => { if (!user) { navigate('/'); } else { const userDoc = await getDoc(doc(db, 'users', user.uid)); if (userDoc.exists()) { setUserName(userDoc.data().name || user.email.split('@')[0]); setFacultyClasses(userDoc.data().assigned_classes || []); } } });
    const unsubscribeDB = onSnapshot(collection(db, 'locations'), (snapshot) => setAllLocations(snapshot.docs.map(doc => doc.data())));
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => { if (docSnap.exists()) setCollegeSettings(docSnap.data()); });
    return () => { unsubscribeAuth(); unsubscribeDB(); unsubscribeSettings(); if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [navigate]);

  const updateFirebaseLocation = async (blockName, lat, lng) => { 
    const user = auth.currentUser; 
    const isOffCampus = blockName === "Out of Campus"; 
    
    if (user) { 
      try {
        await setDoc(doc(db, 'locations', user.uid), { 
          uid: user.uid, 
          email: user.email, 
          name: userNameRef.current, // <-- CHANGED from userName
          current_block: blockName, 
          latitude: isOffCampus ? null : lat, 
          longitude: isOffCampus ? null : lng, 
          timestamp: new Date().toLocaleTimeString(), 
          assigned_classes: facultyClassesRef.current // <-- CHANGED from facultyClasses
        }); 
        
        setStatusMsg(isOffCampus ? `🛡️ You are Out of Campus (Location hidden)` : `🟢 LIVE: You are in ${blockName}`); 
      } catch (error) {
        console.error("Firebase upload failed:", error);
        setStatusMsg(`❌ Database Error: ${error.message}`);
      }
    } 
  };
  const handleToggleTracking = async () => { 
    if (new Date().getHours() >= 17) { setStatusMsg('🌙 Tracking is disabled after 5:00 PM.'); return; } 
    if (!navigator.geolocation) { setStatusMsg('❌ GPS not supported.'); return; } 
    
    if (isTracking) { 
      navigator.geolocation.clearWatch(watchIdRef.current); 
      watchIdRef.current = null; 
      setIsTracking(false); 
      setMyLocalPos(null); // Clear local UI position
      setStatusMsg('⏸️ Live tracking paused.'); 
      if (auth.currentUser) await deleteDoc(doc(db, 'locations', auth.currentUser.uid)); 
      return; 
    } 
    
    setIsTracking(true); 
    setStatusMsg('🛰️ Acquiring high-precision GPS lock...'); 

    // 1. WARM-UP & INSTANT LOCAL UPDATE
    navigator.geolocation.getCurrentPosition(
      (position) => { 
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        if (accuracy <= 250) {
          setMyLocalPos({ latitude: lat, longitude: lng });
          updateFirebaseLocation(determineBlock(lat, lng), lat, lng);
        }
      },
      (err) => console.warn("Warmup skipped, relying on watch:", err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    // 2. CONTINUOUS HIGH-ACCURACY WATCH
    watchIdRef.current = navigator.geolocation.watchPosition( 
      async (position) => { 
        const { latitude: lat, longitude: lng, accuracy } = position.coords; 
        
        if (accuracy > 150) {
          console.warn(`Ignoring low-accuracy read (${accuracy}m).`);
          setStatusMsg(`⚠️ Weak GPS signal (${Math.round(accuracy)}m accuracy). Step near a window.`);
          return;
        }

        // Instantly update the UI state before waiting for Firebase
        setMyLocalPos({ latitude: lat, longitude: lng });
        await updateFirebaseLocation(determineBlock(lat, lng), lat, lng); 
      }, 
      (error) => { 
        let errorText = '❌ GPS Error. Check permissions.';
        if (error.code === 1) { errorText = '❌ Location Access Denied.'; setIsTracking(false); }
        else if (error.code === 2) errorText = '❌ Position Unavailable. No satellites found.';
        else if (error.code === 3) errorText = '⚠️ GPS Lock Timed Out. Retrying...';
        setStatusMsg(errorText); 
      }, 
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 } 
    ); 
  };

  const handleAddClass = async () => { if (!newBranch || !newYear || !newSection) return; const isDuplicate = facultyClasses.some(c => c.branch === newBranch && c.year === newYear && c.section === newSection); if (isDuplicate) return; const updatedClasses = [...facultyClasses, { branch: newBranch, year: newYear, section: newSection }]; setFacultyClasses(updatedClasses); if (auth.currentUser) { await updateDoc(doc(db, 'users', auth.currentUser.uid), { assigned_classes: updatedClasses }); if (isTracking) await updateDoc(doc(db, 'locations', auth.currentUser.uid), { assigned_classes: updatedClasses }); } setNewBranch(''); setNewYear(''); setNewSection(''); };
  const handleRemoveClass = async (indexToRemove) => { const updatedClasses = facultyClasses.filter((_, index) => index !== indexToRemove); setFacultyClasses(updatedClasses); if (auth.currentUser) { await updateDoc(doc(db, 'users', auth.currentUser.uid), { assigned_classes: updatedClasses }); if (isTracking) await updateDoc(doc(db, 'locations', auth.currentUser.uid), { assigned_classes: updatedClasses }); } };
  const handleLogout = () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); if (auth.currentUser) deleteDoc(doc(db, 'locations', auth.currentUser.uid)); signOut(auth).then(() => navigate('/')); };
  const handleSelectColleague = (colleague) => { if (colleague.current_block === "Out of Campus" || !colleague.latitude) { alert(`${colleague.name || 'This colleague'} is currently out of campus (Location Hidden).`); return; } setSelectedColleague(colleague); };

  const visibleColleagues = allLocations.filter(loc => (loc.name || loc.email).toLowerCase().includes(searchTerm.toLowerCase()));
  const inputStyle = { padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#374151', color: 'white', flex: 1, minWidth: '70px' };
  const currentHour = currentTime.getHours(); const isWorkingHours = currentHour >= 8 && currentHour < 17; const showReminder = !isTracking && isWorkingHours && !statusMsg.includes('Manual Override'); 

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', fontFamily: 'sans-serif' }}>
      {showReminder && <div style={{ backgroundColor: '#f59e0b', color: '#78350f', padding: '12px 20px', textAlign: 'center', fontWeight: 'bold', borderBottom: '2px solid #b45309', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '20px' }}>⚠️</span>It is currently college hours, but your Location Tracking is OFF. Please enable it below!</div>}

      <div style={{ backgroundColor: '#1f2937', padding: '15px 20px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', color: 'white', borderBottom: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {collegeSettings.logoUrl && <img src={collegeSettings.logoUrl} alt="Logo" style={{ height: '40px', borderRadius: '4px', objectFit: 'contain' }} />}
          <div>
            <h2 style={{ margin: 0, color: '#60a5fa', fontSize: '20px' }}>{collegeSettings.name} - Faculty</h2>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>Welcome, {userName}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', padding: '20px', gap: '20px' }}>
        <div style={{ flex: '1 1 60%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', border: `2px solid ${isTracking ? '#10b981' : (showReminder ? '#f59e0b' : '#374151')}`, display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>Auto-Tracking Status {isTracking && <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981', animation: 'pulse 1.5s infinite' }}></span>}</h3>
              <p style={{ margin: 0, color: isTracking ? '#a7f3d0' : (statusMsg.includes('❌') ? '#fca5a5' : '#9ca3af'), fontSize: '14px', fontWeight: 'bold' }}>{statusMsg}</p>
            </div>
            <button onClick={handleToggleTracking} style={{ width: '100%', maxWidth: '250px', padding: '12px 24px', backgroundColor: isTracking ? '#ef4444' : '#2563eb', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>{isTracking ? '⏹ Stop Auto-Tracking' : '▶️ Enable Auto-Tracking'}</button>
          </div>

          <div style={{ flex: 1, minHeight: '400px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #374151' }}>
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
                
              {/* Handles instant camera panning to you OR selected colleagues */}
              <MapCameraUpdater selectedFaculty={selectedColleague} myLocalPos={myLocalPos} isTracking={isTracking} />
              
              {/* 🟢 Render Optimistic Zero-Latency Marker for YOU */}
              {myLocalPos && myLocalPos.latitude && myLocalPos.longitude && (
                <Marker 
                  position={[myLocalPos.latitude, myLocalPos.longitude]} 
                  icon={createCustomMarker('You (Live)', true)} 
                />
              )}

              {/* Render Colleagues from Firestore (filters you out to prevent duplicates) */}
              {allLocations
                .filter(loc => loc.uid !== auth.currentUser?.uid)
                .map((loc, index) => {
                 if (loc.latitude && loc.longitude) {
                   const isInsideCampus = loc.latitude >= 13.2450 && loc.latitude <= 13.2500 && loc.longitude >= 79.0940 && loc.longitude <= 79.0990;
                   if (isInsideCampus) { 
                     return <Marker key={index} position={[loc.latitude, loc.longitude]} icon={createCustomMarker(loc.name || loc.email.split('@')[0], false)} /> 
                   }
                 }
                 return null;
              })}
            </MapContainer>
          </div>
        </div>

        <div style={{ flex: '1 1 30%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', color: 'white', border: '1px solid #374151' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>My Assigned Classes</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
              <select style={inputStyle} value={newBranch} onChange={e => setNewBranch(e.target.value)}><option value="">Branch</option><option value="CSE">CSE</option><option value="CAI">CAI</option><option value="CSM">CSM</option><option value="DS">DS</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option></select>
              <select style={inputStyle} value={newYear} onChange={e => setNewYear(e.target.value)}><option value="">Year</option><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option></select>
              <select style={inputStyle} value={newSection} onChange={e => setNewSection(e.target.value)}><option value="">Sec</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select>
              <button onClick={handleAddClass} style={{ padding: '8px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
            </div>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {facultyClasses.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No classes assigned.</p> : null}
              {facultyClasses.map((cls, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#374151', borderRadius: '6px' }}><span style={{ fontSize: '14px' }}>{cls.branch} - Year {cls.year} (Sec {cls.section})</span><button onClick={() => handleRemoveClass(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✖</button></div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: '#1f2937', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', color: 'white', border: '1px solid #374151' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Colleague Radar</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
                <input type="text" placeholder="Search colleagues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: '8px', border: '1px solid #4b5563', backgroundColor: '#374151', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={() => { setSearchTerm(''); setSelectedColleague(null); }} style={{ padding: '10px 16px', backgroundColor: '#374151', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
            </div>
            <div style={{ display: 'grid', gap: '10px', overflowY: 'auto', maxHeight: '250px', paddingRight: '5px' }}>
              {visibleColleagues.filter(l => l.uid !== auth.currentUser?.uid).map((loc, index) => {
                const isSelected = selectedColleague?.uid === loc.uid;
                const isOut = loc.current_block === "Out of Campus";
                return (
                  <div key={index} onClick={() => handleSelectColleague(loc)} style={{ padding: '12px', border: `1px solid ${isSelected ? '#3b82f6' : '#4b5563'}`, borderRadius: '8px', backgroundColor: isSelected ? '#1e3a8a' : '#111827', cursor: isOut ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isOut ? 0.6 : 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#f3f4f6', fontSize: '14px' }}>{loc.name || loc.email}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '11px', color: '#9ca3af' }}>{loc.timestamp}</span><span style={{ backgroundColor: isOut ? '#4b5563' : '#4f46e5', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{loc.current_block}</span></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}