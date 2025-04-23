// src/components/Loader.jsx
import React from 'react';
import '../global.css'; // Import your global styles

const Loader = () => {
  return (
    <div className="loader">
      <div className="sharingan">
        <div className="tomoe"></div>
        <div className="tomoe"></div>
        <div className="tomoe"></div>
      </div>
    </div>
  );
};

export default Loader;
