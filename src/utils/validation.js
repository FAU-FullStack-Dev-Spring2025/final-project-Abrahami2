// Add this validation function to your project
// For example, in src/utils/validation.js

/**
 * Validates text input to prevent spam content
 * @param {string} text - The text to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid flag and error message
 */
export function validateInput(text, options = {}) {
    // Default options
    const defaults = {
      maxLength: 500,
      minLength: 1,
      required: true,
      maxRepeatedChars: 5,
      fieldName: 'Text'
    };
    
    // Merge defaults with provided options
    const config = { ...defaults, ...options };
    
    // Check if input is empty or undefined
    if (!text || text.trim() === '') {
      if (config.required) {
        return { 
          isValid: false, 
          message: `${config.fieldName} cannot be empty` 
        };
      } else {
        return { isValid: true }; // Empty is allowed for optional fields
      }
    }
    
    // Check if input is too short
    if (text.trim().length < config.minLength) {
      return { 
        isValid: false, 
        message: `${config.fieldName} must be at least ${config.minLength} characters` 
      };
    }
    
    // Check if input is too long
    if (text.length > config.maxLength) {
      return { 
        isValid: false, 
        message: `${config.fieldName} must be less than ${config.maxLength} characters` 
      };
    }
    
    // Check for repeated characters (e.g., "aaaaa")
    const repeatedCharRegex = new RegExp(`(.)\\1{${config.maxRepeatedChars - 1},}`, 'g');
    if (repeatedCharRegex.test(text)) {
      return { 
        isValid: false, 
        message: `${config.fieldName} contains too many repeated characters` 
      };
    }
    
    // Check for suspicious all-caps content
    if (text === text.toUpperCase() && text.length > 10) {
      return {
        isValid: false,
        message: 'Please avoid using all capital letters'
      };
    }
    
    // Additional checks could be added here
    // For example, checking for suspicious URLs, known spam words, etc.
    
    return { isValid: true };
  }
  
  // Example usage in your CreatePostForm component
  // src/components/CreatePostForm.jsx
  
  import React, { useState, useContext } from 'react';
  import { supabase } from '../supabaseClient';
  import { useNavigate } from 'react-router-dom';
  import { UserContext } from '../contexts/UserContext';
  import { validateInput } from '../utils/validation';
  import styles from './CreatePostForm.module.css';
  
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
  
    const validateForm = () => {
      const newErrors = {};
      
      // Validate title
      const titleValidation = validateInput(title, {
        maxLength: 100,
        minLength: 3,
        required: true,
        maxRepeatedChars: 4,
        fieldName: 'Title'
      });
      
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.message;
      }
      
      // Validate content (optional)
      if (content && content.trim() !== '') {
        const contentValidation = validateInput(content, {
          maxLength: 2000,
          required: false,
          maxRepeatedChars: 5,
          fieldName: 'Description'
        });
        
        if (!contentValidation.isValid) {
          newErrors.content = contentValidation.message;
        }
      }
      
      // Validate image URL (optional)
      if (imageUrl && imageUrl.trim() !== '') {
        try {
          new URL(imageUrl); // Check if valid URL
        } catch (e) {
          newErrors.imageUrl = 'Please enter a valid URL';
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) {
        return; // Stop if validation fails
      }
      
      setIsSubmitting(true);
      
      try {
        // Create the post data object with required fields
        const postData = { 
          title, 
          user_id: userId,
          username: username,
          category: memeCategory,
          post_type: postType,
          upvotes: 0,
          created_at: new Date(),
        };
        
        // Only add optional fields if they have values
        if (content && content.trim() !== '') {
          postData.content = content;
        }
        
        if (imageUrl && imageUrl.trim() !== '') {
          postData.image_url = imageUrl;
        }
        
        if (repostId && repostId.trim() !== '') {
          postData.repost_id = repostId;
        }
        
        const { data, error } = await supabase
          .from('posts')
          .insert([postData]);
          
        if (error) {
          throw error;
        }
        
        alert('Post created successfully!');
        navigate('/');
      } catch (err) {
        if (err.message.includes('repeated characters')) {
          setErrors({ form: 'Your post contains spam patterns. Please revise and try again.' });
        } else if (err.message.includes('Rate limit')) {
          setErrors({ form: 'You are posting too frequently. Please try again later.' });
        } else {
          setErrors({ form: `Error: ${err.message}` });
        }
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
                // Clear error when typing
                if (errors.title) {
                  setErrors({...errors, title: null});
                }
              }}
              required
            />
            {errors.title && <div className={styles.fieldError}>{errors.title}</div>}
          </div>
  
          {/* Rest of your form fields */}
          
          <div className={styles.formGroup}>
            <label htmlFor="content">Description (Optional)</label>
            <textarea
              id="content"
              className={`${styles.textarea} ${errors.content ? styles.inputError : ''}`}
              placeholder="Add some context or description for your post"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) {
                  setErrors({...errors, content: null});
                }
              }}
              rows={4}
            />
            {errors.content && <div className={styles.fieldError}>{errors.content}</div>}
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