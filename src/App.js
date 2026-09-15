import React, { useState, useEffect } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_4YE6Rt9x9GGuYB8R4eZ_wRAQ5xGvCVyA",
  authDomain: "masjid-app-49e5f.firebaseapp.com",
  projectId: "masjid-app-49e5f",
  storageBucket: "masjid-app-49e5f.firebasestorage.app",
  messagingSenderId: "332113237991",
  appId: "1:332113237991:web:f8ef435f3b16996bc4cf42"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [masjidData, setMasjidData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [editTimings, setEditTimings] = useState({});
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const masjidId = urlParams.get('id') || 'masjid-1';

  // 1. Firebase Data Fetching
  useEffect(() => {
    const docRef = doc(db, 'masjids', masjidId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasjidData(data);
        setEditTimings(data.timings || {});
        document.title = data.name || 'Masjid App';
      } else {
        const defaultData = {
          name: masjidId === 'masjid-2' ? 'Masjid-e-Quba' : 'Jamia Masjid Ahle Sunnat',
          timings: {
            Fajr: '05:15 AM',
            Dhuhr: '01:15 PM',
            Asr: '04:45 PM',
            Maghrib: '06:30 PM',
            Isha: '08:00 PM'
          }
        };
        setMasjidData(defaultData);
        setEditTimings(defaultData.timings);
      }
    });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsubscribe();
  }, [masjidId]);

  // 2. Azan Alarm Logic
  useEffect(() => {
    if (!masjidData || !masjidData.timings) return;

    const timer = setInterval(() => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 baje ko 12 banana
      minutes = minutes < 10 ? '0' + minutes : minutes;
      
      // Exact time format match karna zaroori hai, e.g., "05:15 AM"
      const strTime = (hours < 10 ? '0' + hours : hours) + ':' + minutes + ' ' + ampm;

      Object.entries(masjidData.timings).forEach(([prayer, time]) => {
        // Check karega ke time match ho aur current second 0 ho taake 1 baar baje
        if (time === strTime && now.getSeconds() === 0) {
          playAzanSound();
          if (Notification.permission === "granted") {
            new Notification("Prayer Time!", {
              body: `${prayer} ka waqt ho gaya hai! (${time})`,
              icon: "/logo192.png" 
            });
          }
        }
      });
    }, 1000); // Har 1 second baad check karega

    return () => clearInterval(timer);
  }, [masjidData]);

  const playAzanSound = () => {
    try {
      const audio = new Audio('/azan.mp3'); 
      audio.play().catch((err) => {
        console.log("Browser ne azan block kar di. Screen par ek dafa click karein.", err);
      });
    } catch (error) {
      console.log("Audio error", error);
    }
  };

  // 3. Admin & Install App Logic
  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pinInput === '1234') {
      setIsAdmin(true);
      setPinInput('');
    } else {
      alert('Incorrect PIN!');
    }
  };

  const handleTimingChange = (prayer, value) => {
    setEditTimings((prev) => ({ ...prev, [prayer]: value }));
  };

  const handleSaveTimings = async () => {
    try {
      const docRef = doc(db, 'masjids', masjidId);
      await updateDoc(docRef, { timings: editTimings });
      alert('Timings updated live for all users!');
    } catch (err) {
      const docRef = doc(db, 'masjids', masjidId);
      await setDoc(docRef, {
        name: masjidData?.name || 'Jamia Masjid',
        timings: editTimings
      });
      alert('Timings saved successfully!');
    }
  };

  if (!masjidData) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Prayer Times...</div>;
  }

  return (
    <div className="container">
      <h1>{masjidData.name}</h1>
      
      <div className="timings-card">
        <h2>Prayer Timings</h2>
        <ul>
          {Object.entries(masjidData.timings || {}).map(([prayer, time]) => (
            <li key={prayer}>
              <strong>{prayer}:</strong> {time}
            </li>
          ))}
        </ul>
      </div>

      {/* Azan Test Button */}
      <div style={{ textAlign: 'center', margin: '20px' }}>
         <button onClick={playAzanSound} className="install-btn" style={{ backgroundColor: '#28a745' }}>
           Test Azan Sound
         </button>
      </div>

      {!isAdmin ? (
        <form onSubmit={handleAdminLogin} className="admin-form">
          <h3>Admin Panel Login</h3>
          <input
            type="password"
            placeholder="Enter Admin PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div className="admin-panel">
          <h3>Admin Settings (Update Timings)</h3>
          {Object.entries(editTimings).map(([prayer, time]) => (
            <div key={prayer} className="timing-input">
              <label>{prayer}: </label>
              <input
                type="text"
                value={time}
                onChange={(e) => handleTimingChange(prayer, e.target.value)}
              />
            </div>
          ))}
          <button onClick={handleSaveTimings} className="save-btn">Save Changes Live</button>
        </div>
      )}

      {deferredPrompt && (
        <button
          onClick={() => {
            deferredPrompt.prompt();
            setDeferredPrompt(null);
          }}
          className="install-btn"
        >
          Install App
        </button>
      )}
    </div>
  );
}

export default App;
