// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PostsFeed from './components/PostsFeed';
import CreatePostForm from './components/CreatePostForm';
import PostPage from './components/PostPage';
import EditPostForm from './components/EditPostForm';
import FAQ from './components/FAQ'; // Import the FAQ component
import { UserProvider } from './contexts/UserContext';
import './global.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <UserProvider>
      <Router>
        <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="container">
          <Routes>
            <Route path="/" element={<PostsFeed searchTerm={searchTerm} />} />
            <Route path="/create-post" element={<CreatePostForm />} />
            <Route path="/post/:postId" element={<PostPage />} />
            <Route path="/edit-post/:postId" element={<EditPostForm />} />
            <Route path="/faq" element={<FAQ />} /> {/* Add the FAQ route */}
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;