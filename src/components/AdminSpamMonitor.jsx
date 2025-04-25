// src/components/AdminSpamMonitor.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserContext } from '../contexts/UserContext';
import styles from './AdminPanel.module.css';

function AdminSpamMonitor() {
  const { userId, username } = useContext(UserContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [spamWords, setSpamWords] = useState('');
  const [spamPatterns, setSpamPatterns] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AdminSpamMonitor component mounted, checking admin status...");
    console.log("Current userId:", userId);
    console.log("Current username:", username);
    
    // Check if user is admin - updated with your user ID
    const checkAdmin = async () => {
      if (username && (
        username.toLowerCase().includes('admin') || 
        userId === '0fd9def3-c295-4c91-9522-3b340c89924d'
      )) {
        console.log("User is admin, initializing...");
        setIsAdmin(true);
        try {
          await fetchSpamSettings();
          await fetchFlaggedPosts();
        } catch (error) {
          console.error("Error during initialization:", error);
          setMessage({
            text: 'Error initializing spam monitor: ' + error.message,
            type: 'error'
          });
        }
      } else {
        console.log("User is not admin, redirecting...");
        navigate('/'); // Redirect non-admins to home page
      }
      setIsLoading(false);
    };

    checkAdmin();
  }, [userId, username, navigate]);

  const fetchFlaggedPosts = async () => {
    console.log("Fetching posts for spam analysis...");
    try {
      // Get posts flagged by the system or user reports
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          username,
          created_at,
          category,
          post_type,
          image_url,
          upvotes
        `)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      console.log("Posts data received:", data ? data.length : 0, "posts");
      
      if (!data || data.length === 0) {
        setFlaggedPosts([]);
        return;
      }

      // Analyze posts for potential spam patterns
      const potentialSpam = data.filter(post => {
        // Check for repeated characters - fixed regex pattern
        const repeatedCharPattern = /(.)\1{5,}/;
        
        // Check for all caps
        const allCapsPattern = /^[A-Z0-9\s!?.]{10,}$/;
        
        // Check for excessive exclamation marks
        const excessivePunctuation = /(!{3,}|\?{3,})/;
        
        // Get current spam words list
        let spamWordsList = [];
        if (spamWords && spamWords.trim() !== '') {
          spamWordsList = spamWords.split(',').map(word => word.trim().toLowerCase());
        }

        const containsSpamWords = spamWordsList.length > 0 && spamWordsList.some(word => 
          (post.title?.toLowerCase().includes(word) || post.content?.toLowerCase().includes(word))
        );
        
        const isSpam = (
          (post.title && repeatedCharPattern.test(post.title)) ||
          (post.content && repeatedCharPattern.test(post.content)) ||
          (post.title && allCapsPattern.test(post.title)) ||
          (post.title && excessivePunctuation.test(post.title)) ||
          containsSpamWords
        );
        
        if (isSpam) {
          console.log("Flagged spam post:", post.id, post.title);
        }
        
        return isSpam;
      });
      
      console.log("Found", potentialSpam.length, "potential spam posts");
      setFlaggedPosts(potentialSpam);
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
      setMessage({
        text: 'Error fetching posts: ' + error.message,
        type: 'error'
      });
    }
  };

  const fetchSpamSettings = async () => {
    console.log("Fetching spam settings...");
    try {
      // Get spam settings from a settings table
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('type', 'spam_filter')
        .single();
        
      if (error) {
        // Settings might not exist yet
        if (error.code === 'PGRST116') {
          console.log("Settings not found, creating defaults...");
          await createDefaultSpamSettings();
        } else {
          throw error;
        }
      } else if (data) {
        console.log("Spam settings found:", data);
        setSpamWords(data.spam_words || '');
        setSpamPatterns(data.spam_patterns || '');
      }
    } catch (error) {
      console.error('Error fetching spam settings:', error);
      setMessage({
        text: 'Failed to load spam settings. Please ensure the settings table exists in your database.',
        type: 'error'
      });
      
      // Set default values anyway so the component doesn't break
      console.log("Setting default spam values after error");
      setSpamWords('free money,casino,bitcoin investment,forex trading,earn fast,aaaaaa');
      setSpamPatterns('(.)\\\\1{5,},^[A-Z0-9\\\\s!?.]{10,}$,(!{3,}|\\\\?{3,})');
    }
  };

  const createDefaultSpamSettings = async () => {
    console.log("Creating default spam settings...");
    try {
      // Default spam words and patterns
      const defaultSpamWords = 'free money,casino,bitcoin investment,forex trading,earn fast,aaaaaa';
      // Fixed regex pattern with proper escaping
      const defaultSpamPatterns = '(.)\\\\1{5,},^[A-Z0-9\\\\s!?.]{10,}$,(!{3,}|\\\\?{3,})';
      
      const { data, error } = await supabase
        .from('settings')
        .insert([{
          type: 'spam_filter',
          spam_words: defaultSpamWords,
          spam_patterns: defaultSpamPatterns,
          created_at: new Date()
        }])
        .select();
        
      if (error) throw error;
      
      console.log("Default settings created successfully:", data);
      
      setSpamWords(defaultSpamWords);
      setSpamPatterns(defaultSpamPatterns);
      
      setMessage({
        text: 'Created default spam settings',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating default spam settings:', error);
      throw error; // Propagate the error
    }
  };

  const updateSpamSettings = async () => {
    console.log("Updating spam settings...");
    try {
      // Check if settings exist first
      const { data: existingSettings, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('type', 'spam_filter')
        .single();
      
      let error;
      
      if (checkError || !existingSettings) {
        console.log("Settings not found, creating new...");
        // Create settings if they don't exist
        const { error: insertError } = await supabase
          .from('settings')
          .insert([{
            type: 'spam_filter',
            spam_words: spamWords,
            spam_patterns: spamPatterns,
            created_at: new Date()
          }]);
          
        error = insertError;
      } else {
        console.log("Settings found, updating existing...");
        // Update existing settings
        const { error: updateError } = await supabase
          .from('settings')
          .update({
            spam_words: spamWords,
            spam_patterns: spamPatterns,
            updated_at: new Date()
          })
          .eq('type', 'spam_filter');
          
        error = updateError;
      }
      
      if (error) throw error;
      
      console.log("Spam settings updated successfully");
      setMessage({
        text: 'Spam filter settings updated successfully',
        type: 'success'
      });
      
      // Refresh the flagged posts with new settings
      fetchFlaggedPosts();
    } catch (error) {
      console.error("Error updating spam settings:", error);
      setMessage({
        text: `Error updating settings: ${error.message}`,
        type: 'error'
      });
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    console.log("Deleting post:", postId);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
        
      if (error) throw error;
      
      console.log("Post deleted successfully");
      // Update the UI by removing the deleted post
      setFlaggedPosts(flaggedPosts.filter(post => post.id !== postId));
      
      setMessage({
        text: 'Post deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      setMessage({
        text: `Error deleting post: ${error.message}`,
        type: 'error'
      });
    }
  };

  const banUser = async (username) => {
    if (!window.confirm(`Are you sure you want to ban user ${username}?`)) {
      return;
    }
    
    console.log("Banning user:", username);
    try {
      // Get the user ID from posts
      const { data: userData, error: userError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('username', username)
        .limit(1);
        
      if (userError) throw userError;
      
      if (!userData || userData.length === 0) {
        throw new Error('User not found');
      }
      
      const userIdToBan = userData[0].user_id;
      console.log("Found user ID:", userIdToBan);
      
      // Add user to banned_users table
      const { error: banError } = await supabase
        .from('banned_users')
        .insert([{
          user_id: userIdToBan,
          username: username,
          reason: 'Spam content',
          is_permanent: true
        }]);
        
      if (banError) throw banError;
      
      console.log("User banned successfully");
      setMessage({
        text: `User ${username} has been banned`,
        type: 'success'
      });
      
      // Remove all posts by this user from the UI
      setFlaggedPosts(flaggedPosts.filter(post => post.username !== username));
    } catch (error) {
      console.error("Error banning user:", error);
      setMessage({
        text: `Error banning user: ${error.message}`,
        type: 'error'
      });
    }
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
      <h1 className={styles.title}>Spam Monitor</h1>
      
      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}
      
      <div className={styles.section}>
        <h2>Spam Filter Settings</h2>
        <div className={styles.formGroup}>
          <label>Spam Words (comma-separated)</label>
          <textarea
            value={spamWords}
            onChange={(e) => setSpamWords(e.target.value)}
            placeholder="Enter spam words separated by commas"
            rows={3}
            className={styles.textarea}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Spam Patterns (regex patterns, comma-separated)</label>
          <textarea
            value={spamPatterns}
            onChange={(e) => setSpamPatterns(e.target.value)}
            placeholder="Enter regex patterns separated by commas"
            rows={3}
            className={styles.textarea}
          />
          <p className={styles.formHint}>
            Example: (.)\\1{"{5,}"} will detect repeated characters
          </p>
        </div>
        
        <button 
          onClick={updateSpamSettings}
          className={styles.button}
        >
          Update Spam Settings
        </button>
      </div>
      
      <div className={styles.section}>
        <h2>Potential Spam Posts</h2>
        
        {isLoading ? (
          <p>Loading...</p>
        ) : flaggedPosts.length === 0 ? (
          <p>No potential spam posts found</p>
        ) : (
          <div className={styles.postsList}>
            {flaggedPosts.map(post => (
              <div key={post.id} className={styles.postItem}>
                <div className={styles.postHeader}>
                  <span className={styles.postTitle}>{post.title}</span>
                  <span className={styles.postDate}>
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div className={styles.postMeta}>
                  <span className={styles.postAuthor}>
                    By: <strong>{post.username}</strong>
                  </span>
                  <span className={styles.postCategory}>
                    {post.category} | {post.post_type}
                  </span>
                </div>
                
                {post.content && (
                  <div className={styles.postContent}>
                    {post.content.length > 100 
                      ? `${post.content.substring(0, 100)}...` 
                      : post.content
                    }
                  </div>
                )}
                
                <div className={styles.postActions}>
                  <button 
                    onClick={() => deletePost(post.id)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Delete Post
                  </button>
                  
                  <button 
                    onClick={() => banUser(post.username)}
                    className={`${styles.actionButton} ${styles.banButton}`}
                  >
                    Ban User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSpamMonitor;