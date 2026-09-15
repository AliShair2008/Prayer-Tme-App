import React, { useState, useEffect } from 'react';
import './App.css';

// Admin dwara set ki gayi alag-alag masjido ka data
const MASJID_DATABASE = {
  'masjid-1': {
    name: 'Jamia Masjid Ahle Sunnat',
    timings: {
      Fajr: '05:15 AM',
      Dhuhr: '01:15 PM',
      Asr: '04:45 PM',
      Maghrib: '06:30 PM',
      Isha: '08:00 PM',
    },
  },
  'masjid-2': {
    name: 'Masjid-e-Quba',
    timings: {
      Fajr: '05:00 AM',
      Dhuhr: '01:30 PM',
      Asr: '05:00 PM',
      Maghrib: '06:32 PM',
      Isha: '08:15 PM',
    },
  },
};

function App() {
  const [masjidData, setMasjidData] = useState(null);
const [deferredPrompt, setDeferredPrompt] = useState(null);

 useEffect(() => {
    // URL parameter se masjid ID detect karna
    const urlParams = new URLSearchParams(window.location.search);
    const masjidId = urlParams.get('id') || 'masjid-1';

    const selectedMasjid = MASJID_DATABASE[masjidId] || MASJID_DATABASE['masjid-1'];
    setMasjidData(selectedMasjid);

    document.title = selectedMasjid.name;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Install Prompt Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);
  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('App Installed');
        }
        setDeferredPrompt(null);
      });
    }
  };
useEffect(() => {
    // URL parameter se masjid ID detect karna (e.g. app.com/?id=masjid-1)
    const urlParams = new URLSearchParams(window.location.search);
    const masjidId = urlParams.get('id') || 'masjid-1';

    const selectedMasjid = MASJID_DATABASE[masjidId] || MASJID_DATABASE['masjid-1'];
    setMasjidData(selectedMasjid);

    // Dynamic Title Update
    document.title = selectedMasjid.name;

    // Notification Permission Request
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

 const playAzaanSound = () => {
    const audio = new Audio('/azaan.mp3');
    audio.play().catch(e => alert("Audio Play Error: " + e.message));
  };

  if (!masjidData) return <div className="loading">Loading...</div>;

  return (
    <div className="app-container">
      <header className="masjid-header">
   {deferredPrompt && (
        <button 
          onClick={handleInstallClick} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#10b981', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            fontSize: '16px',
            marginBottom: '20px',
            cursor: 'pointer'
          }}
        >
          📲 Install App
        </button>
      )} 
        <h1>{masjidData.name}</h1>
        <p className="subtitle">Namaz Timings (Read-Only)</p>
      </header>

      <main className="timings-list">
        {Object.entries(masjidData.timings).map(([namaz, time]) => (
          <div key={namaz} className="timing-card">
            <span className="namaz-name">{namaz}</span>
            <span className="namaz-time">{time}</span>
          </div>
        ))}
      </main>

    <footer className="footer-action">
        <button className="azaan-btn" onClick={playAzaanSound}>
          🔊 Test Azaan Sound
        </button>

      </footer>
    </div>
  );
}

export default App;
