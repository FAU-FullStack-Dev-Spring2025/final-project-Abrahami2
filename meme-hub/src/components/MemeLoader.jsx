// src/components/MemeLoader.jsx
import React from 'react';
import styles from './MemeLoader.module.css';

const MemeLoader = () => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loader}>
        <div className={styles.memeFrame}>
          <div className={styles.topText}>Loading</div>
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
          </div>
          <div className={styles.bottomText}>Memes...</div>
        </div>
      </div>
      <p className={styles.loadingText}>Please wait while we fetch the dankest content</p>
    </div>
  );
};

export default MemeLoader;