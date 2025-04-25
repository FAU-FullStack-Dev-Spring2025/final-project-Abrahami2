// src/components/BannedPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import styles from './BannedPage.module.css';

function BannedPage() {
  const [banInfo, setBanInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getBanInfo = async () => {
      try {
        // Get user info if logged in
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user is banned
          const { data: userBan, error: userError } = await supabase
            .from('banned_users')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (!userError && userBan) {
            setBanInfo(userBan);
            setLoading(false);
            return;
          }
        }
        
        // If user not banned or not logged in, check IP
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          const ip = ipData.ip;
          
          const { data: ipBan, error: ipError } = await supabase
            .from('banned_ips')
            .select('*')
            .eq('ip_address', ip)
            .maybeSingle();
            
          if (!ipError && ipBan) {
            setBanInfo(ipBan);
          }
        } catch (ipError) {
          console.error('Error getting IP ban info:', ipError);
        }
      } catch (error) {
        console.error('Error fetching ban information:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getBanInfo();
  }, []);

  // Sign out the banned user
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/banned'; // Refresh the page
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bannedCard}>
        <h1 className={styles.bannedTitle}>Account Suspended</h1>
        
        <div className={styles.icon}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        
        <p className={styles.bannedMessage}>
          Your access to this platform has been suspended.
        </p>
        
        {banInfo && banInfo.reason && (
          <div className={styles.banReason}>
            <strong>Reason:</strong> {banInfo.reason}
          </div>
        )}
        
        {banInfo && !banInfo.is_permanent && banInfo.expires_at && (
          <div className={styles.banExpiry}>
            <strong>Ban expires:</strong> {new Date(banInfo.expires_at).toLocaleString()}
          </div>
        )}
        
        <div className={styles.actions}>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default BannedPage;