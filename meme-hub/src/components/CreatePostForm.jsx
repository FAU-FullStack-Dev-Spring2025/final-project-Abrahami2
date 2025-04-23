// src/components/CreatePostForm.jsx
import React, { useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import styles from './CreatePostForm.module.css';

function CreatePostForm() {
  const { userId, username } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [memeCategory, setMemeCategory] = useState('funny');
  const [postType, setPostType] = useState('meme'); // New field for post type (meme, question, opinion)
  const [repostId, setRepostId] = useState(''); // New field for reposting
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const postData = { 
        title, 
        content, 
        image_url: imageUrl, 
        category: memeCategory,
        post_type: postType,
        user_id: userId,
        username: username,
        upvotes: 0,
        created_at: new Date(),
      };
      
      // If this is a repost, add the repost_id field
      if (repostId) {
        postData.repost_id = repostId;
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert([postData]);
        
      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Post created successfully!');
        navigate('/');
      }
    } catch (err) {
      alert(`Something went wrong: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Create a New Post</h2>
      <p className={styles.userInfo}>Posting as: <strong>{username}</strong></p>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Post Title *</label>
          <input
            id="title"
            className={styles.input}
            type="text"
            placeholder="Give your post a catchy title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="postType">Post Type</label>
          <select
            id="postType"
            className={styles.select}
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
          >
            <option value="meme">Meme</option>
            <option value="question">Question</option>
            <option value="opinion">Opinion</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className={styles.select}
            value={memeCategory}
            onChange={(e) => setMemeCategory(e.target.value)}
          >
            <option value="funny">Funny</option>
            <option value="dank">Dank</option>
            <option value="wholesome">Wholesome</option>
            <option value="gaming">Gaming</option>
            <option value="anime">Anime</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="imageUrl">Image URL</label>
          <input
            id="imageUrl"
            className={styles.input}
            type="text"
            placeholder="Paste your image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && (
            <div className={styles.imagePreview}>
              <p>Preview:</p>
              <img src={imageUrl} alt="Preview" />
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content">Description (Optional)</label>
          <textarea
            id="content"
            className={styles.textarea}
            placeholder="Add some context or description for your post"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="repostId">Repost ID (Optional)</label>
          <input
            id="repostId"
            className={styles.input}
            type="text"
            placeholder="Enter post ID to repost"
            value={repostId}
            onChange={(e) => setRepostId(e.target.value)}
          />
          <p className={styles.formHint}>Leave empty if this is an original post</p>
        </div>

        <button 
          className={styles.button} 
          type="submit"
          disabled={isSubmitting || !title}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}

export default CreatePostForm;