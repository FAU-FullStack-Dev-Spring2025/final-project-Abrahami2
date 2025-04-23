// src/contexts/UserContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // Check for existing user ID in localStorage
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    
    if (storedUserId && storedUsername) {
      setUserId(storedUserId);
      setUsername(storedUsername);
    } else {
      // Generate a new random user ID and username
      const newUserId = crypto.randomUUID(); // Using built-in crypto.randomUUID() instead of uuid library
      const newUsername = `MemeLord_${Math.floor(Math.random() * 10000)}`;
      
      // Store in localStorage
      localStorage.setItem('userId', newUserId);
      localStorage.setItem('username', newUsername);
      
      // Update state
      setUserId(newUserId);
      setUsername(newUsername);
    }
  }, []);

  return (
    <UserContext.Provider value={{ userId, username }}>
      {children}
    </UserContext.Provider>
  );
};