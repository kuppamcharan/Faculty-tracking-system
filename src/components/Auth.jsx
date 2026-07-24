import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const inputStyle = { padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' };

export default function Auth() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('student'); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Global Settings for Header
  const [collegeSettings, setCollegeSettings] = useState({ name: 'Faculty Tracker', logoUrl: '' });

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [empId, setEmpId] = useState('');
  const [facultyType, setFacultyType] = useState('teaching'); 

  useEffect(() => {
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) setCollegeSettings(docSnap.data());
    });
    return () => unsubscribeSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userData = { uid: user.uid, email: user.email, name: name, role: role };

        if (role === 'student') {
          userData.rollNumber = rollNumber; userData.branch = branch; userData.year = year; userData.section = section;
        } else {
          userData.empId = empId; userData.type = facultyType;
          if (facultyType === 'teaching') userData.assigned_classes = [{ branch, year, section }]; 
          else userData.assigned_classes = []; 
        }

        try {
          await setDoc(doc(db, 'users', user.uid), userData);
          alert("Registration Successful! You can now log in.");
          setIsRegistering(false); 
        } catch {
          await user.delete(); // Rollback Auth creation
          throw new Error("Failed to create user profile. Please check your connection and try again.");
        }
        
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') navigate('/admin');
          else if (userData.role === 'student') navigate('/student');
          else if (userData.role === 'faculty') navigate('/faculty');
          else setError("Routing error: Unrecognized role in database.");
        } else {
          // Add this fail-safe to gracefully reject orphaned auth accounts
          await signOut(auth);
          setError("Your account has been deactivated or removed by an Administrator.");
        }
      }
    } catch (err) { setError("Error: " + err.message); } finally { setIsLoading(false); }
  };

  const showClassMapping = role === 'student' || (role === 'faculty' && facultyType === 'teaching');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif', padding: '15px' }}>
      <div style={{ width: '100%', maxWidth: '450px', backgroundColor: '#ffffff', padding: '30px 20px', borderRadius: '12px', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
          {collegeSettings.logoUrl && <img src={collegeSettings.logoUrl} alt="Logo" style={{ height: '40px', borderRadius: '4px', objectFit: 'contain' }} />}
          <h2 style={{ textAlign: 'center', color: '#333', margin: 0 }}>{isRegistering ? `Join ${collegeSettings.name}` : `Welcome to ${collegeSettings.name}`}</h2>
        </div>
        
        {error && <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input style={inputStyle} type="email" placeholder="College Email" required onChange={(e) => setEmail(e.target.value)} />
          <input style={inputStyle} type="password" placeholder="Password" required onChange={(e) => setPassword(e.target.value)} />

          {isRegistering && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />
              <input style={inputStyle} type="text" placeholder="Full Name" required onChange={(e) => setName(e.target.value)} />
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '10px 0' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="radio" checked={role === 'student'} onChange={() => setRole('student')} /><span>Student</span></label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><input type="radio" checked={role === 'faculty'} onChange={() => setRole('faculty')} /><span>Faculty</span></label>
              </div>

              {role === 'student' && <input style={inputStyle} type="text" placeholder="Roll Number (e.g., CS101)" required onChange={(e) => setRollNumber(e.target.value)} />}
              {role === 'faculty' && (
                <>
                  <input style={inputStyle} type="text" placeholder="Employee ID (e.g., F123)" required onChange={(e) => setEmpId(e.target.value)} />
                  <select style={inputStyle} value={facultyType} onChange={(e) => setFacultyType(e.target.value)} required>
                    <option value="teaching">Teaching Faculty</option><option value="non-teaching">Non-Teaching Faculty</option><option value="administrative">Administrative Faculty</option>
                  </select>
                </>
              )}

              {showClassMapping && (
                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                  <select style={inputStyle} value={branch} onChange={(e) => setBranch(e.target.value)} required>
                    <option value="">Branch</option><option value="CSE">CSE</option><option value="CAI">CAI</option><option value="CSM">CSM</option><option value="DS">DS</option><option value="ECE">ECE</option><option value="EEE">EEE</option><option value="MECH">MECH</option>
                  </select>
                  <select style={inputStyle} value={year} onChange={(e) => setYear(e.target.value)} required>
                    <option value="">Year</option><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option>
                  </select>
                  <select style={inputStyle} value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">Section</option><option value="A">A</option><option value="B">B</option><option value="C">C</option>
                  </select>
                </div>
              )}
              
            </>
          )}

          <button type="submit" disabled={isLoading} style={{ padding: '14px', backgroundColor: isLoading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
            {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Login securely')}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', cursor: 'pointer', color: '#2563eb', fontSize: '14px' }} onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Already have an account? Log in.' : 'Need an account? Register here.'}
        </p>
      </div>
    </div>
  );
}
