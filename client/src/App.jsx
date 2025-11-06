function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: 'bold' }}>
          🎉 ChatGrow Frontend
        </h1>
        <p style={{ fontSize: '24px', marginBottom: '10px' }}>
          React + Vite + RTL Support
        </p>
        <p style={{ fontSize: '18px', opacity: 0.9 }}>
          המערכת מוכנה לעבודה!
        </p>
      </div>
    </div>
  );
}

export default App;
