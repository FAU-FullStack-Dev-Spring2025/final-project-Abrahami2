// src/components/FAQ.jsx
import React from 'react';
import styles from './FAQ.module.css';
import { Link } from 'react-router-dom';

function FAQ() {
  return (
    <div className={styles.faqContainer}>
      <h1 className={styles.faqTitle}>Frequently Asked Questions</h1>
      
      <div className={styles.faqItem}>
        <h3>What is Meme Hub?</h3>
        <p>Meme Hub is a platform for sharing and discovering memes, questions, and opinions. Users can post content, upvote what they like, and engage with others through comments.</p>
      </div>
      
      <div className={styles.faqItem}>
        <h3>How does the user system work?</h3>
        <p>When you first visit Meme Hub, you're automatically assigned a random username (like "MemeLord_1234") and a unique user ID. This information is stored locally in your browser. You don't need to create an account or remember a password!</p>
      </div>
      
      <div className={styles.faqItem}>
        <h3>Will I lose my posts if I clear my browser data?</h3>
        <p>If you clear your browser's local storage, you'll be assigned a new user ID and username. Your posts will still exist on Meme Hub, but you won't be able to edit or delete them anymore since they're linked to your previous user ID.</p>
      </div>
      
      <div className={styles.faqItem}>
        <h3>What are post types?</h3>
        <p>When creating a post, you can choose from three types:</p>
        <ul>
          <li><strong>Meme</strong>: For sharing funny images and content</li>
          <li><strong>Question</strong>: For asking the community questions</li>
          <li><strong>Opinion</strong>: For sharing your thoughts on a topic</li>
        </ul>
        <p>You can filter posts by type on the home page.</p>
      </div>
      
      <div className={styles.faqItem}>
        <h3>How do I repost someone else's content?</h3>
        <p>When viewing a post you want to share, click the "Repost" button. This will create a new post that links back to the original. Alternatively, when creating a new post, you can enter a post ID in the "Repost ID" field.</p>
      </div>
      
      <div className={styles.faqItem}>
        <h3>Can I edit or delete my posts?</h3>
        <p>Yes! You can edit or delete any post you've created. However, you can only modify your own posts - those associated with your current user ID.</p>
      </div>
      
      <div className={styles.faqItem}>
        <h3>How do upvotes work?</h3>
        <p>You can upvote any post by clicking the upvote button. There's no limit to how many times you can upvote a post, and posts can be sorted by upvote count on the home page.</p>
      </div>
      
      <div className={styles.faqItem}>
        <h3>Can I upload images directly?</h3>
        <p>Currently, Meme Hub only supports image URLs. You'll need to upload your image to an image hosting service and paste the URL when creating a post.</p>
      </div>
      
      <div className={styles.backLink}>
        <Link to="/">Back to Home</Link>
      </div>
    </div>
  );
}

export default FAQ;