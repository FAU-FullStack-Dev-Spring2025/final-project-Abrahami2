// src/components/Navbar.jsx
import React, { useState, useContext, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaQuestion, FaComments, FaBars, FaTimes } from "react-icons/fa";
import memeLogo from "../memehub.svg";
import styles from "./Navbar.module.css";
import { UserContext } from "../contexts/UserContext";

function NavBar({ searchTerm, setSearchTerm, openChat }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { username } = useContext(UserContext);
  
  // Close the mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);
  
  // Close the mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && menuOpen) {
        setMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <NavLink to="/" className={styles.navLogo}>
          <img src={memeLogo} alt="Meme Hub Logo" className={styles.icon} />
          Meme Hub
        </NavLink>

        {/* Mobile menu toggle button */}
        <button 
          className={styles.menuToggle} 
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {location.pathname === "/" && (
          <div className={styles.searchContainer}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search memes by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <ul className={`${styles.navMenu} ${menuOpen ? styles.active : ''}`}>
          <li className={styles.navItem}>
            <NavLink
              to="/"
              className={({ isActive }) => 
                isActive ? `${styles.navLinks} ${styles.active}` : styles.navLinks
              }
            >
              Home
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/create-post"
              className={({ isActive }) => 
                isActive ? `${styles.navLinks} ${styles.active}` : styles.navLinks
              }
            >
              Create Meme
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <NavLink
              to="/faq"
              className={({ isActive }) => 
                isActive ? `${styles.navLinks} ${styles.active}` : styles.navLinks
              }
            >
              <FaQuestion className={styles.navIcon} /> FAQ
            </NavLink>
          </li>
          <li className={styles.navItem}>
            <button className={styles.chatButton} onClick={openChat}>
              <FaComments className={styles.navIcon} /> Chat
            </button>
          </li>
          {username && (
            <li className={styles.userProfile}>
              <span className={styles.username}>{username}</span>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;