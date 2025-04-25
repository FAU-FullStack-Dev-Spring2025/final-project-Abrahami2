// src/components/BanCheck.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserContext } from '../contexts/UserContext';
import Loader from './Loader'; // Using your existing Loader component

function BanCheck({ children }) {
  const [checking, setChecking] = useState(true);
  const { userId } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBanStatus = async () => {
      try {
        // Check if user account is banned
        if (userId) {
          const { data: userBan, error: userError } = await supabase
            .from('banned_users')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (userError) throw userError;
          
          if (userBan) {
            // User is banned, redirect to banned page
            navigate('/banned');
            return;
          }
        }
        
        // Check if IP is banned
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ip = ipData.ip;
        
        const { data: ipBan, error: ipError } = await supabase
          .from('banned_ips')
          .select('*')
          .eq('ip_address', ip)
          .maybeSingle();
          
        if (ipError) throw ipError;
        
        if (ipBan) {
          // IP is banned, redirect to banned page
          navigate('/banned');
          return;
        }
      } catch (error) {
        console.error('Error in ban check:', error);
      } finally {
        setChecking(false);
      }
    };
    
    checkBanStatus();
  }, [userId, navigate]);
  
  if (checking) {
    return <Loader />;
  }
  
  return <>{children}</>;
}

export default BanCheck;