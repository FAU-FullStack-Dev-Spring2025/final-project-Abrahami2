// src/components/EditPostForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserContext } from '../contexts/UserContext';
import styles from './CreatePostForm.module.css'; // Reuse the same styling

function EditPostForm() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { userId } = useContext(UserContext);
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('funny');
  const [postType, setPostType] = useState('meme');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
        
      if (error) {
        console.error('Error fetching post:', error.message);
        alert('Failed to load post. Please try again.');
      } else {
        setPost(post);
        
        // Check if current user is the post creator
        if (post.user_id !== userId) {
          setUnauthorized(true);
        } else {
          setTitle(post.title || '');
          setContent(post.content || '');
          setImageUrl(post.image_url || '');
          setCategory(post.category || 'funny');
          setPostType(post.post_type || 'meme');
        }
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong while loading the post.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (unauthorized) {
      alert("You don't have permission to edit this post!");
      navigate(`/post/${postId}`);
      return;
    }
    
    setIsSubmitting(true);
    
    const confirmation = window.confirm('Are you sure you want to update this post?');
    
    if (confirmation) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .update({ 
            title, 
            content, 
            image_url: imageUrl,
            category,
            post_type: postType
          })
          .eq('id', postId);
          
        if (error) {
          console.error('Error updating post:', error.message);
          alert(`Failed to update: ${error.message}`);
        } else {
          alert('Post updated successfully!');
          navigate(`/post/${postId}`);
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Something went wrong while updating.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (unauthorized) {
    return (
      <div className={styles.unauthorized}>
        <h2>Unauthorized</h2>
        <p>You don't have permission to edit this post. Only the original creator can edit it.</p>
        <button 
          onClick={() => navigate(`/post/${postId}`)}
          className={styles.button}
        >
          Back to Post
        </button>
      </div>
    );
  }

  if (!post) {
    return <div className={styles.error}>Post not found</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Edit Your Post</h2>
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
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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

        <button 
          className={styles.button} 
          type="submit"
          disabled={isSubmitting || !title}
        >
          {isSubmitting ? 'Updating...' : 'Update Post'}
        </button>
      </form>
    </div>
  );
}

export default EditPostForm;