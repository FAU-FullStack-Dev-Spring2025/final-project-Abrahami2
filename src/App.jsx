// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PostsFeed from './components/PostsFeed';
import CreatePostForm from './components/CreatePostForm';
import PostPage from './components/PostPage';
import EditPostForm from './components/EditPostForm';
import FAQ from './components/FAQ';
import ChatSidebar from './components/ChatSidebar';
import AdminPanel from './components/AdminPanel';
import AdminSpamMonitor from './components/AdminSpamMonitor';
import UserManagement from './components/UserManagement';
import BannedPage from './components/BannedPage';
import { UserProvider } from './contexts/UserContext';
import './global.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    <UserProvider>
      <Router>
        <Navbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          openChat={() => setIsChatOpen(true)}
        />
        <div className="container">
          <Routes>
            <Route path="/" element={<PostsFeed searchTerm={searchTerm} />} />
            <Route path="/create-post" element={<CreatePostForm />} />
            <Route path="/post/:postId" element={<PostPage />} />
            <Route path="/edit-post/:postId" element={<EditPostForm />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/banned" element={<BannedPage />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/spam" element={<AdminSpamMonitor />} />
            <Route path="/admin/users" element={<UserManagement />} />
          </Routes>
        </div>
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </Router>
    </UserProvider>
  );
}

export default App;