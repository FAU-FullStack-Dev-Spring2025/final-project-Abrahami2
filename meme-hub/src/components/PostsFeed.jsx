// src/components/PostsFeed.jsx
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import styles from './PostsFeed.module.css';
import { Link } from 'react-router-dom';
import { FaTrash, FaEdit, FaThumbsUp, FaComment, FaQuestion, FaLightbulb, FaRetweet } from 'react-icons/fa';
import { BiSortAlt2, BiTime, BiUpvote, BiFilterAlt } from 'react-icons/bi';
import { UserContext } from '../contexts/UserContext';
import MemeLoader from './MemeLoader';

function PostsFeed({ searchTerm }) {
  const { userId } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePostType, setActivePostType] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, [sortField, sortOrder, activeCategory, activePostType]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });
        
      // Filter by category if not "all"
      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }
      
      // Filter by post type if not "all"
      if (activePostType !== 'all') {
        query = query.eq('post_type', activePostType);
      }
        
      let { data: fetchedPosts, error } = await query;
      
      if (error) {
        console.error('Error fetching posts:', error);
        alert('Failed to load posts. Please try again.');
      } else {
        // Fetch comments count for each post
        const postsWithComments = await Promise.all(
          fetchedPosts.map(async (post) => {
            const { data: comments, error: commentError } = await supabase
              .from('comments')
              .select('*')
              .eq('post_id', post.id);
              
            if (commentError) {
              console.error('Error fetching comments:', commentError);
              return { ...post, commentCount: 0 };
            } else {
              return { ...post, commentCount: comments.length };
            }
          }),
        );
        setPosts(postsWithComments);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Something went wrong while loading posts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId, postUserId, event) => {
    event.preventDefault(); // Prevent navigation
    event.stopPropagation(); // Prevent event bubbling
    
    // Check if current user is the creator of this post
    if (userId !== postUserId) {
      alert('You can only delete your own posts!');
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    
    if (confirmDelete) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .match({ id: postId });
          
        if (error) {
          console.error('Error deleting post:', error);
          alert(`Failed to delete: ${error.message}`);
        } else {
          // Remove the deleted post from the state
          setPosts(posts.filter(post => post.id !== postId));
          alert('Post deleted successfully!');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Something went wrong while deleting.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter posts by search term
  const filteredPosts = searchTerm
    ? posts.filter((post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : posts;

  if (loading && posts.length === 0) {
    return <MemeLoader />;
  }

  // All categories and post types
  const categories = ['all', 'funny', 'dank', 'wholesome', 'gaming', 'anime', 'other'];
  const postTypes = ['all', 'meme', 'question', 'opinion'];

  const getPostTypeIcon = (type) => {
    switch(type) {
      case 'question':
        return <FaQuestion />;
      case 'opinion':
        return <FaLightbulb />;
      case 'meme':
        return null;
      default:
        return null;
    }
  };

  return (
    <div className={styles.feedContainer}>
      {/* Filter controls */}
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <h4 className={styles.filterLabel}>Categories:</h4>
          <div className={styles.filterButtons}>
            {categories.map((category) => (
              <button
                key={category}
                className={`${styles.filterButton} ${activeCategory === category ? styles.activeFilter : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className={styles.filterGroup}>
          <h4 className={styles.filterLabel}>Post Types:</h4>
          <div className={styles.filterButtons}>
            {postTypes.map((type) => (
              <button
                key={type}
                className={`${styles.filterButton} ${activePostType === type ? styles.activeFilter : ''}`}
                onClick={() => setActivePostType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Sort controls */}
      <div className={styles.sortControls}>
        <span className={styles.sortLabel}>
          <BiSortAlt2 /> Sort by:
        </span>
        <button
          onClick={() => {
            setSortField('created_at');
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
          }}
          className={`${styles.sortButton} ${sortField === 'created_at' ? styles.activeSort : ''}`}
        >
          <BiTime /> Date {sortField === 'created_at' && (sortOrder === 'desc' ? '↓' : '↑')}
        </button>
        <button
          onClick={() => {
            setSortField('upvotes');
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
          }}
          className={`${styles.sortButton} ${sortField === 'upvotes' ? styles.activeSort : ''}`}
        >
          <BiUpvote /> Upvotes {sortField === 'upvotes' && (sortOrder === 'desc' ? '↓' : '↑')}
        </button>
      </div>
      
      {/* No results message */}
      {filteredPosts.length === 0 && !loading && (
        <div className={styles.noResults}>
          <h3>No posts found</h3>
          <p>Be the first to post in this category!</p>
          <Link to="/create-post" className={styles.createButton}>Create Post</Link>
        </div>
      )}
      
      {/* Posts list */}
      <div className={styles.memesGrid}>
        {filteredPosts.map((post) => (
          <div key={post.id} className={styles.memeCard}>
            <Link to={`/post/${post.id}`} className={styles.memeLink}>
              <div className={styles.memeImageContainer}>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className={styles.memeImage}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found'; }}
                  />
                )}
                <div className={styles.badgeContainer}>
                  {post.category && (
                    <span className={styles.categoryBadge}>{post.category}</span>
                  )}
                  {post.post_type !== 'meme' && (
                    <span className={`${styles.typeBadge} ${styles[post.post_type]}`}>
                      {getPostTypeIcon(post.post_type)} {post.post_type}
                    </span>
                  )}
                  {post.repost_id && (
                    <span className={styles.repostBadge}>
                      <FaRetweet /> Repost
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.postInfo}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postAuthor}>Posted by {post.username || 'Anonymous'}</p>
                <div className={styles.postStats}>
                  <span className={styles.upvotes}>
                    <FaThumbsUp /> {post.upvotes || 0}
                  </span>
                  <span className={styles.commentCount}>
                    <FaComment /> {post.commentCount || 0}
                  </span>
                  <span className={styles.timestamp}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
            <div className={styles.postActions}>
              {userId === post.user_id && (
                <>
                  <button 
                    onClick={(event) => handleDelete(post.id, post.user_id, event)}
                    className={styles.actionButton}
                    title="Delete post"
                  >
                    <FaTrash />
                  </button>
                  <Link 
                    to={`/edit-post/${post.id}`}
                    className={styles.actionButton}
                    title="Edit post"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaEdit />
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostsFeed;