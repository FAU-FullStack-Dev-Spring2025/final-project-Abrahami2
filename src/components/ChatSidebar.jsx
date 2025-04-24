// src/components/ChatSidebar.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { UserContext } from '../contexts/UserContext';
import { IoMdSend, IoMdClose } from 'react-icons/io';
import styles from './ChatSidebar.module.css';

function ChatSidebar({ isOpen, onClose }) {
  const { userId, username } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch messages on component mount
  useEffect(() => {
    fetchInitialMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchNewMessages();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
        
      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchNewMessages = async () => {
    if (messages.length === 0) return;
    
    try {
      // Get messages newer than the most recent one we have
      const latestMessage = messages[messages.length - 1];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .gt('created_at', latestMessage.created_at)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data && data.length > 0) {
        setMessages(prev => [...prev, ...data]);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    // Create the message object
    const newMessageObj = { 
      text: newMessage, 
      user_id: userId,
      username: username,
      created_at: new Date().toISOString(), // Make sure the format matches Supabase
      // Add a temporary ID to avoid key warnings
      id: `temp-${Date.now()}`
    };
    
    // Optimistically add the message to the UI
    setMessages(prev => [...prev, newMessageObj]);
    setNewMessage('');
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{ 
          text: newMessage, 
          user_id: userId,
          username: username,
          created_at: new Date() 
        }])
        .select(); // This returns the inserted data with the actual ID
        
      if (error) {
        console.error('Error sending message:', error);
        // Remove the temporary message if there was an error
        setMessages(prev => prev.filter(msg => msg.id !== newMessageObj.id));
      } else if (data && data.length > 0) {
        // Replace the temporary message with the real one from the database
        setMessages(prev => 
          prev.map(msg => msg.id === newMessageObj.id ? data[0] : msg)
        );
      }
    } catch (err) {
      console.error('Error:', err);
      // Remove the temporary message if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== newMessageObj.id));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`${styles.chatSidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h3>Community Chat</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <IoMdClose />
          </button>
        </div>
        
        <div className={styles.messageList}>
          {messages.map((message, index) => (
            <div 
              key={message.id || index} 
              className={`${styles.message} ${message.user_id === userId ? styles.ownMessage : ''}`}
            >
              <div className={styles.messageUsername}>{message.username}</div>
              <div className={styles.messageContent}>{message.text}</div>
              <div className={styles.messageTime}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className={styles.messageForm}>
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className={styles.messageInput}
          />
          <button type="submit" className={styles.sendButton}>
            <IoMdSend />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatSidebar;