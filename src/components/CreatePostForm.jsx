// src/components/CreatePostForm.jsx
import React, { useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import styles from './CreatePostForm.module.css';

// Text validation function
const validateText = (text, options = {}) => {
  const { 
    maxLength = 500, 
    repeatThreshold = 5, 
    required = false 
  } = options;
  
  // Skip validation if empty and not required
  if ((!text || text.trim() === '') && !required) {
    return { isValid: true };
  }
  
  // Check if input is empty but required
  if ((!text || text.trim() === '') && required) {
    return { isValid: false, message: 'This field cannot be empty' };
  }
  
  // Check if input is too long
  if (text && text.length > maxLength) {
    return { isValid: false, message: `Must be less than ${maxLength} characters` };
  }
  
  // Check for repeated characters (e.g., "aaaaa")
  const repeatedCharRegex = new RegExp(`(.)\\1{${repeatThreshold - 1},}`, 'g');
  if (text && repeatedCharRegex.test(text)) {
    return { isValid: false, message: 'Contains too many repeated characters' };
  }
  
  return { isValid: true };
};

function CreatePostForm() {
  const { userId, username } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [memeCategory, setMemeCategory] = useState('funny');
  const [postType, setPostType] = useState('meme');
  const [repostId, setRepostId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    // Validate title (required)
    const titleValidation = validateText(title, { 
      maxLength: 100, 
      repeatThreshold: 4, 
      required: true 
    });
    
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.message;
    }
    
    // Validate content (optional)
    if (content) {
      const contentValidation = validateText(content, { 
        maxLength: 2000, 
        repeatThreshold: 5, 
        required: false 
      });
      
      if (!contentValidation.isValid) {
        newErrors.content = contentValidation.message;
      }
    }
    
    // Add other validations as needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create post data object with all required fields
      const postData = { 
        title, 
        user_id: userId,
        username: username,
        category: memeCategory,
        post_type: postType,
        upvotes: 0,
        created_at: new Date(),
      };
      
      // Only add content if it's not empty
      if (content && content.trim() !== '') {
        postData.content = content;
      }
      
      // Only add image_url if it's not empty
      if (imageUrl && imageUrl.trim() !== '') {
        postData.image_url = imageUrl;
      }
      
      // Only add repost_id if it's not empty
      if (repostId && repostId.trim() !== '') {
        postData.repost_id = repostId;
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert([postData]);
        
      if (error) {
        if (error.message.includes('content')) {
          // If the error is related to the content field, show a specific error
          setErrors({ 
            form: 'There was an issue with the description field. Please try again with different text.' 
          });
        } else {
          setErrors({ form: `Error: ${error.message}` });
        }
      } else {
        alert('Post created successfully!');
        navigate('/');
      }
    } catch (err) {
      setErrors({ form: `Something went wrong: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Create a New Post</h2>
      <p className={styles.userInfo}>Posting as: <strong>{username}</strong></p>
      
      {errors.form && (
        <div className={styles.errorMessage}>{errors.form}</div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Post Title *</label>
          <input
            id="title"
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            type="text"
            placeholder="Give your post a catchy title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              // Clear error when user starts typing
              if (errors.title) {
                setErrors({...errors, title: null});
              }
            }}
            required
          />
          {errors.title && <div className={styles.fieldError}>{errors.title}</div>}
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
            className={`${styles.textarea} ${errors.content ? styles.inputError : ''}`}
            placeholder="Add some context or description for your post"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              // Clear error when user starts typing
              if (errors.content) {
                setErrors({...errors, content: null});
              }
            }}
            rows={4}
          />
          {errors.content && <div className={styles.fieldError}>{errors.content}</div>}
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