// src/components/UserManagement.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserContext } from '../contexts/UserContext';
import styles from './AdminPanel.module.css';

function UserManagement() {
  const { userId, username } = useContext(UserContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log("UserManagement component mounted, checking admin status...");
    console.log("Current userId:", userId);
    console.log("Current username:", username);
    
    // Check if user is admin - updated with your user ID
    const checkAdmin = () => {
      if (username && (
        username.toLowerCase().includes('admin') || 
        userId === '0fd9def3-c295-4c91-9522-3b340c89924d'
      )) {
        console.log("User is admin, loading data...");
        setIsAdmin(true);
        loadUsers();
        loadBannedUsers();
      } else {
        console.log("User is not admin, redirecting...");
        navigate('/'); // Redirect non-admins to home page
      }
      setIsLoading(false);
    };

    checkAdmin();
  }, [userId, username, navigate]);

  const loadUsers = async () => {
    console.log("Loading users...");
    try {
      // First, try to get users from the profiles table if it exists
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id as user_id, username')
        .order('username', { ascending: true });
        
      console.log("Profiles data attempt:", profilesData, profilesError);
      
      // If profiles table doesn't exist or has no data, try to get users from posts
      if (profilesError || !profilesData || profilesData.length === 0) {
        console.log("No profiles found, trying posts table...");
        
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('user_id, username')
          .order('username', { ascending: true });
          
        console.log("Posts data attempt:", postsData, postsError);

        if (postsError) {
          console.error("Error getting users from posts:", postsError);
          throw postsError;
        }

        if (!postsData || postsData.length === 0) {
          console.log("No users found in either table");
          setMessage({
            text: "No users found in the database. Users will appear here once they create posts.",
            type: "info"
          });
          setUsers([]);
          return;
        }

        // De-duplicate users from posts
        const uniqueUsers = Array.from(
          new Map(postsData.map(item => [item.user_id, item])).values()
        );
        console.log("Unique users from posts:", uniqueUsers);
        setUsers(uniqueUsers);
      } else {
        // We have user profiles
        console.log("Using profiles for user data:", profilesData);
        setUsers(profilesData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({
        text: `Error loading users: ${error.message}`,
        type: 'error'
      });
      // Set empty array to prevent undefined errors in rendering
      setUsers([]);
    }
  };

  const loadBannedUsers = async () => {
    console.log("Loading banned users...");
    try {
      // Make sure the banned_users table exists
      try {
        await supabase.from('banned_users').select('count').limit(1);
      } catch (tableError) {
        console.error("banned_users table may not exist:", tableError);
        // Create the table if it doesn't exist
        console.log("Attempting to create banned_users table...");
        
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS banned_users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            username TEXT NOT NULL,
            reason TEXT,
            banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            banned_by UUID,
            is_permanent BOOLEAN DEFAULT TRUE,
            expires_at TIMESTAMP WITH TIME ZONE
          );
        `;
        
        const { error: createError } = await supabase.rpc('execute_sql', { 
          sql_query: createTableSQL 
        });
        
        if (createError) {
          console.error("Failed to create banned_users table:", createError);
          setBannedUsers([]);
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .order('banned_at', { ascending: false });

      if (error) throw error;

      console.log("Banned users data received:", data || []);
      setBannedUsers(data || []);
    } catch (error) {
      console.error('Error loading banned users:', error);
      setMessage({
        text: `Error loading banned users: ${error.message}`,
        type: 'error'
      });
      // Set empty array to prevent undefined errors in rendering
      setBannedUsers([]);
    }
  };

  const openBanDialog = (user) => {
    console.log("Opening ban dialog for user:", user);
    setSelectedUser(user);
    setBanReason('');
    setShowConfirmation(true);
  };

  const closeBanDialog = () => {
    setSelectedUser(null);
    setBanReason('');
    setShowConfirmation(false);
  };

  const banUser = async () => {
    if (!selectedUser) return;

    console.log("Banning user:", selectedUser);
    try {
      // Check if user is already banned
      const existingBan = bannedUsers.find(
        ban => ban.user_id === selectedUser.user_id
      );

      if (existingBan) {
        setMessage({
          text: `User ${selectedUser.username} is already banned`,
          type: 'warning'
        });
        closeBanDialog();
        return;
      }

      // Add user to banned_users table
      const { error } = await supabase
        .from('banned_users')
        .insert([{
          user_id: selectedUser.user_id,
          username: selectedUser.username,
          reason: banReason || 'Violation of community guidelines',
          is_permanent: true,
          banned_by: userId
        }]);

      if (error) throw error;

      console.log(`User ${selectedUser.username} banned successfully`);
      setMessage({
        text: `User ${selectedUser.username} has been banned successfully`,
        type: 'success'
      });

      // Refresh banned users list
      loadBannedUsers();
      closeBanDialog();
    } catch (error) {
      console.error('Error banning user:', error);
      setMessage({
        text: `Error banning user: ${error.message}`,
        type: 'error'
      });
    }
  };

  const unbanUser = async (bannedUser) => {
    if (!window.confirm(`Are you sure you want to unban ${bannedUser.username}?`)) {
      return;
    }

    console.log("Unbanning user:", bannedUser);
    try {
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('id', bannedUser.id);

      if (error) throw error;

      console.log(`User ${bannedUser.username} unbanned successfully`);
      setMessage({
        text: `User ${bannedUser.username} has been unbanned successfully`,
        type: 'success'
      });

      // Refresh banned users list
      loadBannedUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      setMessage({
        text: `Error unbanning user: ${error.message}`,
        type: 'error'
      });
    }
  };

  const deleteUserPosts = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ALL posts by ${user.username}? This cannot be undone.`)) {
      return;
    }

    console.log("Deleting posts for user:", user);
    try {
      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', user.user_id)
        .select('count');

      if (error) throw error;

      const count = data?.length || 0;
      console.log(`Deleted ${count} posts by ${user.username}`);
      
      setMessage({
        text: `Deleted ${count} posts by ${user.username}`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting posts:', error);
      setMessage({
        text: `Error deleting posts: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <h1 className={styles.title}>User Management</h1>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.section}>
        <h2>Banned Users</h2>
        {bannedUsers.length === 0 ? (
          <p>No banned users found</p>
        ) : (
          <div className={styles.userList}>
            {bannedUsers.map(bannedUser => (
              <div key={bannedUser.id || `banned-${bannedUser.user_id}`} className={styles.userItem}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{bannedUser.username}</span>
                  <span className={styles.userBadge}>Banned</span>
                </div>
                
                <div className={styles.userDetails}>
                  <div>
                    <strong>Reason:</strong> {bannedUser.reason || 'No reason specified'}
                  </div>
                  <div>
                    <strong>Banned on:</strong> {new Date(bannedUser.banned_at).toLocaleString()}
                  </div>
                </div>
                
                <div className={styles.userActions}>
                  <button
                    onClick={() => unbanUser(bannedUser)}
                    className={`${styles.actionButton} ${styles.unbanButton}`}
                  >
                    Unban User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>All Users</h2>
        
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search users by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {users.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No users found. Users will appear here once they create posts or sign up.</p>
            <p>Try creating some posts with different user accounts to see them listed here.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p>No users match your search</p>
        ) : (
          <div className={styles.userList}>
            {filteredUsers.map(user => (
              <div key={user.user_id} className={styles.userItem}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.username}</span>
                  {bannedUsers.some(banned => banned.user_id === user.user_id) && (
                    <span className={styles.userBadge}>Banned</span>
                  )}
                </div>
                
                <div className={styles.userActions}>
                  {!bannedUsers.some(banned => banned.user_id === user.user_id) && (
                    <button
                      onClick={() => openBanDialog(user)}
                      className={`${styles.actionButton} ${styles.banButton}`}
                    >
                      Ban User
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteUserPosts(user)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Delete All Posts
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ban Confirmation Modal */}
      {showConfirmation && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Ban User: {selectedUser.username}</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="banReason">Reason for Ban</label>
              <textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for banning this user"
                rows={4}
                className={styles.textarea}
              />
            </div>
            
            <div className={styles.modalActions}>
              <button 
                onClick={banUser}
                className={styles.confirmButton}
              >
                Confirm Ban
              </button>
              
              <button 
                onClick={closeBanDialog}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;