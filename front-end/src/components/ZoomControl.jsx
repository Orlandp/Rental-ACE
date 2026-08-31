import React, { useState, useEffect } from 'react';

function ZoomControl() {
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('rental-ace-zoom');
    return saved ? parseInt(saved, 10) : 100;
  });

  useEffect(() => {
    document.body.style.zoom = `${zoom}%`;
    localStorage.setItem('rental-ace-zoom', zoom.toString());
  }, [zoom]);

  function zoomIn() {
    setZoom((z) => Math.min(z + 10, 150));
  }

  function zoomOut() {
    setZoom((z) => Math.max(z - 10, 70));
  }

  function resetZoom() {
    setZoom(100);
  }

  useEffect(() => {
    function handleWheel(e) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(z + 10, 150));
      } else {
        setZoom((z) => Math.max(z - 10, 70));
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div style={styles.container}>
      <button onClick={zoomOut} style={styles.btn} title="Zoom out">−</button>
      <button onClick={resetZoom} style={styles.resetBtn} title="Reset zoom">{zoom}%</button>
      <button onClick={zoomIn} style={styles.btn} title="Zoom in">+</button>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-surface)',
    borderRadius: '10px',
    boxShadow: 'var(--shadow-md)',
    zIndex: 9999,
    overflow: 'hidden',
  },
  btn: {
    width: '38px',
    height: '38px',
    border: 'none',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-brand)',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  resetBtn: {
    width: '54px',
    height: '38px',
    border: 'none',
    borderLeft: '1px solid var(--color-border-soft)',
    borderRight: '1px solid var(--color-border-soft)',
    backgroundColor: 'var(--color-bg-alt)',
    color: 'var(--color-ink-soft)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};

export default ZoomControl;