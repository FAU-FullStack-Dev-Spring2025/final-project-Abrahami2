// src/components/PostPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from './PostPage.module.css';
import { FaEdit, FaTrash, FaShare, FaRetweet } from 'react-icons/fa';
import { BsEmojiLaughing } from 'react-icons/bs';
import { IoMdSend } from 'react-icons/io';
import { UserContext } from '../contexts/UserContext';
import MemeLoader from './MemeLoader';

function PostPage() {
  const { postId } = useParams();
  const { userId, username } = useContext(UserContext);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [animate, setAnimate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [postId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
        
      if (postError) {
        setError('Failed to load post. It might have been deleted.');
        console.error('Error fetching post:', postError);
      } else {
        // If this post is a repost, fetch the original post
        if (postData.repost_id) {
          const { data: originalPost, error: originalPostError } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postData.repost_id)
            .single();
            
          if (!originalPostError) {
            setPost({
              ...postData,
              original_post: originalPost
            });
          } else {
            setPost(postData);
          }
        } else {
          setPost(postData);
        }
        
        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: false });
          
        if (commentsError) {
          console.error('Error fetching comments:', commentsError);
        } else {
          setComments(commentsData || []);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again later.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!post) return;

    setAnimate(true);
    setTimeout(() => setAnimate(false), 1000);
  
    // Optimistically update the UI
    const newUpvotes = (post.upvotes || 0) + 1;
    setPost(prevPost => ({ ...prevPost, upvotes: newUpvotes }));
  
    try {
      const { error } = await supabase
        .from('posts')
        .update({ upvotes: newUpvotes })
        .eq('id', postId);
    
      if (error) {
        console.error('Error updating upvotes:', error);
        // Rollback on error
        setPost(prevPost => ({ ...prevPost, upvotes: prevPost.upvotes - 1 }));
        alert('Failed to upvote. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      // Rollback on error
      setPost(prevPost => ({ ...prevPost, upvotes: prevPost.upvotes - 1 }));
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { 
            post_id: postId, 
            text: newComment, 
            user_id: userId,
            username: username,
            created_at: new Date() 
          }
        ]);
        
      if (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to add comment. Please try again.');
      } else {
        setNewComment('');
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong while adding your comment.');
    }
  };

  const handleEditComment = (commentId, commentUserId) => {
    // Check if current user is the comment creator
    if (userId !== commentUserId) {
      alert('You can only edit your own comments!');
      return;
    }
    
    const commentToEdit = comments.find(comment => comment.id === commentId);
    setEditingCommentId(commentId);
    setEditedCommentText(commentToEdit.text);
  };

  const handleSaveEditedComment = async () => {
    if (!editedCommentText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .update({ text: editedCommentText })
        .eq('id', editingCommentId);
        
      if (error) {
        console.error('Error saving edited comment:', error);
        alert('Failed to update comment. Please try again.');
      } else {
        setEditingCommentId(null);
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong while updating your comment.');
    }
  };

  const handleDeletePost = async () => {
    // Check if current user is the post creator
    if (userId !== post.user_id) {
      alert('You can only delete your own posts!');
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId);
          
        if (error) {
          console.error('Error deleting post:', error);
          alert('Failed to delete post. Please try again.');
        } else {
          alert('Post deleted successfully!');
          navigate('/');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Something went wrong while deleting.');
      }
    }
  };

  const handleDeleteComment = async (commentId, commentUserId) => {
    // Check if current user is the comment creator
    if (userId !== commentUserId) {
      alert('You can only delete your own comments!');
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
    if (confirmDelete) {
      try {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);
          
        if (error) {
          console.error('Error deleting comment:', error);
          alert('Failed to delete comment. Please try again.');
        } else {
          // Update local state without refetching
          setComments(comments.filter(comment => comment.id !== commentId));
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Something went wrong while deleting your comment.');
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: 'Check out this post on Meme Hub!',
        url: window.location.href,
      })
      .catch((error) => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link. Please copy it manually.'));
    }
  };

  const handleRepost = () => {
    navigate('/create-post', { state: { repostId: postId } });
  };

  if (isLoading) {
    return <MemeLoader />;
  }

  if (error || !post) {
    return (
      <div className={styles.errorContainer}>
        <h2>{error || 'Post not found'}</h2>
        <Link to="/" className={styles.backButton}>Back to Home</Link>
      </div>
    );
  }

  // Function to get post type icon or badge
  const getPostTypeBadge = () => {
    switch(post.post_type) {
      case 'question':
        return <span className={`${styles.typeBadge} ${styles.question}`}>Question</span>;
      case 'opinion':
        return <span className={`${styles.typeBadge} ${styles.opinion}`}>Opinion</span>;
      default:
        return null;
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={styles.postPageContainer}>
      <div className={styles.postContainer}>
        <div className={styles.postHeader}>
          <h1 className={styles.postTitle}>{post.title}</h1>
          
          <div className={styles.postMeta}>
            {post.category && (
              <span className={styles.categoryBadge}>{post.category}</span>
            )}
            {getPostTypeBadge()}
            {post.repost_id && (
              <span className={styles.repostBadge}>
                <FaRetweet /> Repost
              </span>
            )}
          </div>
          
          <p className={styles.postAuthor}>Posted by {post.username || 'Anonymous'} on {formattedDate}</p>
        </div>
        
        {post.repost_id && post.original_post && (
          <div className={styles.originalPostContainer}>
            <h3 className={styles.originalPostHeading}>Original Post:</h3>
            <div className={styles.originalPost}>
              <Link to={`/post/${post.original_post.id}`} className={styles.originalPostLink}>
                <h4>{post.original_post.title}</h4>
                <p>By {post.original_post.username || 'Anonymous'}</p>
                {post.original_post.image_url && (
                  <img 
                    src={post.original_post.image_url} 
                    alt={post.original_post.title} 
                    className={styles.originalPostImage}
                  />
                )}
              </Link>
            </div>
          </div>
        )}
        
        <div className={styles.postImageWrapper}>
          {post.image_url && (
            <img 
              src={post.image_url} 
              alt={post.title} 
              className={styles.postImage}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found'; }} 
            />
          )}
        </div>
        
        {post.content && (
          <div className={styles.postDescription}>
            <p>{post.content}</p>
          </div>
        )}
        
        <div className={styles.postActions}>
          <button 
            className={`${styles.upvoteButton} ${animate ? styles.rubberBand : ''}`} 
            onClick={handleUpvote}
          >
            <BsEmojiLaughing className={styles.upvoteIcon} /> 
            <span>{post.upvotes || 0} upvotes</span>
          </button>
          
          <div className={styles.actionButtons}>
            <button onClick={handleShare} className={styles.shareButton}>
              <FaShare /> Share
            </button>
            <button onClick={handleRepost} className={styles.repostButton}>
              <FaRetweet /> Repost
            </button>
            {userId === post.user_id && (
              <>
                <Link to={`/edit-post/${post.id}`} className={styles.editButton}>
                  <FaEdit /> Edit
                </Link>
                <button onClick={handleDeletePost} className={styles.deleteButton}>
                  <FaTrash /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className={styles.commentsSection}>
        <h2 className={styles.commentsTitle}>
          Comments ({comments.length})
        </h2>
        
        <form onSubmit={handleSubmitComment} className={styles.commentForm}>
          <input
            className={styles.commentInput}
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          <button type="submit" className={styles.submitButton}>
            <IoMdSend />
          </button>
        </form>
        
        <div className={styles.commentsList}>
          {comments.length === 0 ? (
            <div className={styles.noComments}>
              Be the first to comment on this post!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={styles.commentItem}>
                {editingCommentId === comment.id ? (
                  <div className={styles.editCommentForm}>
                    <input
                      type="text"
                      value={editedCommentText}
                      onChange={(e) => setEditedCommentText(e.target.value)}
                      className={styles.editCommentInput}
                      autoFocus
                    />
                    <div className={styles.editCommentActions}>
                      <button 
                        onClick={handleSaveEditedComment}
                        className={styles.saveButton}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingCommentId(null)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentAuthor}>{comment.username || 'Anonymous'}</span>
                        <span className={styles.commentDate}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p>{comment.text}</p>
                    </div>
                    <div className={styles.commentActions}>
                      {userId === comment.user_id && (
                        <>
                          <button 
                            onClick={() => handleEditComment(comment.id, comment.user_id)} 
                            className={styles.commentActionButton}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDeleteComment(comment.id, comment.user_id)} 
                            className={styles.commentActionButton}
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PostPage;