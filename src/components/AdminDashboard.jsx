import { useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';

const cardStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '12px',
  color: 'white',
  padding: '20px',
};

const inputStyle = {
  backgroundColor: '#374151',
  border: '1px solid #4b5563',
  borderRadius: '8px',
  boxSizing: 'border-box',
  color: 'white',
  outline: 'none',
  padding: '10px 12px',
  width: '100%',
};

const roleColors = {
  admin: '#7c3aed',
  faculty: '#2563eb',
  student: '#10b981',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Administrator');
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('Dashboard ready.');
  const [collegeName, setCollegeName] = useState('Faculty Tracker');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        setStatusMessage('Only admin accounts can access this dashboard.');
        navigate('/');
        return;
      }

      setAdminName(userDoc.data().name || user.email.split('@')[0]);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })));
    });

    const unsubscribeLocations = onSnapshot(collection(db, 'locations'), (snapshot) => {
      setLocations(snapshot.docs.map((locationDoc) => ({ id: locationDoc.id, ...locationDoc.data() })));
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (settingsDoc) => {
      if (!settingsDoc.exists()) return;
      const settings = settingsDoc.data();
      setCollegeName(settings.name || 'Faculty Tracker');
      setLogoUrl(settings.logoUrl || '');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeLocations();
      unsubscribeSettings();
    };
  }, [navigate]);

  const counts = useMemo(() => {
    return users.reduce(
      (summary, user) => {
        const role = user.role || 'unknown';
        return {
          ...summary,
          total: summary.total + 1,
          [role]: (summary[role] || 0) + 1,
        };
      },
      { total: 0, admin: 0, faculty: 0, student: 0 },
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const searchable = `${user.name || ''} ${user.email || ''} ${user.role || ''} ${user.rollNumber || ''} ${user.empId || ''}`;
      return searchable.toLowerCase().includes(query);
    });
  }, [searchTerm, users]);

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setIsSavingSettings(true);
    setStatusMessage('Saving college settings...');

    try {
      await setDoc(
        doc(db, 'settings', 'general'),
        {
          logoUrl: logoUrl.trim(),
          name: collegeName.trim() || 'Faculty Tracker',
        },
        { merge: true },
      );
      setStatusMessage('College settings updated successfully.');
    } catch (error) {
      setStatusMessage(`Unable to save settings: ${error.message}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRoleChange = async (uid, role) => {
    setStatusMessage('Updating user role...');

    try {
      await updateDoc(doc(db, 'users', uid), { role });
      setStatusMessage('User role updated successfully.');
    } catch (error) {
      setStatusMessage(`Unable to update role: ${error.message}`);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/'));
  };

  return (
    <div style={{ backgroundColor: '#111827', fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <div style={{ alignItems: 'center', backgroundColor: '#1f2937', borderBottom: '1px solid #374151', color: 'white', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'space-between', padding: '15px 20px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: '15px' }}>
          {logoUrl && <img src={logoUrl} alt="College logo" style={{ borderRadius: '4px', height: '42px', objectFit: 'contain' }} />}
          <div>
            <h2 style={{ color: '#a78bfa', margin: 0 }}>{collegeName} - Admin</h2>
            <p style={{ color: '#9ca3af', margin: 0 }}>Welcome, {adminName}</p>
          </div>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#dc2626', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: 'bold', padding: '8px 16px' }}>Logout</button>
      </div>

      <main style={{ display: 'grid', gap: '20px', padding: '20px' }}>
        <section style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[
            ['Total Users', counts.total, '#f9fafb'],
            ['Admins', counts.admin, '#c4b5fd'],
            ['Faculty', counts.faculty, '#93c5fd'],
            ['Students', counts.student, '#6ee7b7'],
            ['Live Locations', locations.length, '#fbbf24'],
          ].map(([label, value, color]) => (
            <div key={label} style={cardStyle}>
              <p style={{ color: '#9ca3af', margin: '0 0 8px 0' }}>{label}</p>
              <strong style={{ color, fontSize: '28px' }}>{value}</strong>
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <form onSubmit={handleSaveSettings} style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>College Branding</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <label>
                <span style={{ color: '#d1d5db', display: 'block', fontSize: '14px', marginBottom: '6px' }}>College name</span>
                <input style={inputStyle} value={collegeName} onChange={(event) => setCollegeName(event.target.value)} placeholder="College name" />
              </label>
              <label>
                <span style={{ color: '#d1d5db', display: 'block', fontSize: '14px', marginBottom: '6px' }}>Logo URL</span>
                <input style={inputStyle} value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://example.com/logo.png" />
              </label>
              <button disabled={isSavingSettings} style={{ backgroundColor: isSavingSettings ? '#6b7280' : '#7c3aed', border: 'none', borderRadius: '8px', color: 'white', cursor: isSavingSettings ? 'not-allowed' : 'pointer', fontWeight: 'bold', padding: '12px' }} type="submit">
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>System Status</h3>
            <p style={{ color: '#d1d5db', lineHeight: 1.5 }}>{statusMessage}</p>
            <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.5 }}>
              Faculty live locations are written to the <code>locations</code> collection and removed when tracking stops or the user logs out.
            </p>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>User Management</h3>
            <input style={{ ...inputStyle, maxWidth: '320px' }} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search users..." />
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {filteredUsers.map((user) => (
              <div key={user.id} style={{ alignItems: 'center', backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '10px', display: 'grid', gap: '12px', gridTemplateColumns: 'minmax(180px, 1fr) 140px minmax(160px, 220px)', padding: '12px' }}>
                <div>
                  <strong style={{ color: '#f9fafb', display: 'block' }}>{user.name || user.email || 'Unnamed user'}</strong>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: '13px' }}>{user.email}</span>
                  <span style={{ color: '#9ca3af', display: 'block', fontSize: '12px' }}>
                    {user.rollNumber ? `Roll: ${user.rollNumber}` : user.empId ? `Employee: ${user.empId}` : 'Profile ID only'}
                  </span>
                </div>

                <span style={{ backgroundColor: roleColors[user.role] || '#4b5563', borderRadius: '999px', color: 'white', fontSize: '13px', fontWeight: 'bold', justifySelf: 'start', padding: '5px 10px' }}>
                  {user.role || 'unknown'}
                </span>

                <select style={inputStyle} value={user.role || 'student'} onChange={(event) => handleRoleChange(user.id, event.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="faculty">Faculty</option>
                  <option value="student">Student</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
