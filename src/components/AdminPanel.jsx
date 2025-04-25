// src/components/AdminPanel.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserContext } from '../contexts/UserContext';
import styles from './AdminPanel.module.css';

function AdminPanel() {
  const { userId, username } = useContext(UserContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    userCount: 0,
    postCount: 0,
    bannedUserCount: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin - updated with your user ID
    const checkAdmin = () => {
      if (username && (
        username.toLowerCase().includes('admin') || 
        userId === '0fd9def3-c295-4c91-9522-3b340c89924d'
      )) {
        setIsAdmin(true);
        loadStats();
      } else {
        navigate('/'); // Redirect non-admins to home page
      }
      setIsLoading(false);
    };

    checkAdmin();
  }, [userId, username, navigate]);

  const loadStats = async () => {
    try {
      // Get post count
      const { count: postCount, error: postError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get banned user count
      const { count: bannedCount, error: bannedError } = await supabase
        .from('banned_users')
        .select('*', { count: 'exact', head: true });

      // Get unique user count (from posts)
      const { data: userData, error: userError } = await supabase
        .from('posts')
        .select('user_id')
        .limit(1000);

      if (postError) throw postError;
      if (bannedError) throw bannedError;
      if (userError) throw userError;

      // Count unique users
      const uniqueUsers = new Set();
      if (userData) {
        userData.forEach(post => uniqueUsers.add(post.user_id));
      }

      setStats({
        postCount: postCount || 0,
        bannedUserCount: bannedCount || 0,
        userCount: uniqueUsers.size || 0
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const handleNotImplemented = (feature) => {
    alert(`The ${feature} feature is not yet implemented. It will be available in a future update.`);
  };

  if (isLoading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <h2>Access Denied</h2>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.postCount}</div>
          <div className={styles.statLabel}>Posts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.userCount}</div>
          <div className={styles.statLabel}>Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.bannedUserCount}</div>
          <div className={styles.statLabel}>Banned Users</div>
        </div>
      </div>
      
      <div className={styles.adminLinks}>
        <h2>Admin Tools</h2>
        <div className={styles.linkGrid}>
          {/* Spam Monitor */}
          <Link to="/admin/spam" className={styles.adminLink}>
            <div className={styles.linkIcon}>🛡️</div>
            <div className={styles.linkText}>
              <h3>Spam Monitor</h3>
              <p>Monitor and manage spam content</p>
            </div>
          </Link>
          
          {/* User Management */}
          <Link to="/admin/users" className={styles.adminLink}>
            <div className={styles.linkIcon}>👥</div>
            <div className={styles.linkText}>
              <h3>User Management</h3>
              <p>Manage users and ban problematic accounts</p>
            </div>
          </Link>
          
          {/* Analytics - Currently just a button */}
          <div 
            className={`${styles.adminLink} ${styles.disabledLink}`}
            onClick={() => handleNotImplemented('Analytics')}
          >
            <div className={styles.linkIcon}>📊</div>
            <div className={styles.linkText}>
              <h3>Analytics</h3>
              <p>View site statistics and reports</p>
              <span className={styles.comingSoon}>Coming Soon</span>
            </div>
          </div>
          
          {/* Settings - Currently just a button */}
          <div 
            className={`${styles.adminLink} ${styles.disabledLink}`}
            onClick={() => handleNotImplemented('Settings')}
          >
            <div className={styles.linkIcon}>⚙️</div>
            <div className={styles.linkText}>
              <h3>Settings</h3>
              <p>Configure site settings</p>
              <span className={styles.comingSoon}>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;