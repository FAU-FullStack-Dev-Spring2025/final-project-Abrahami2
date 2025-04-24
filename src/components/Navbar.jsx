// src/components/Navbar.jsx
import React, { useState, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaQuestion, FaComments } from "react-icons/fa";
import memeLogo from "../memehub.svg";
import styles from "./Navbar.module.css";
import { UserContext } from "../contexts/UserContext";

function NavBar({ userstate, setSearchTerm, searchTerm, openChat }) {
  const [click, setClick] = useState(false);
  const location = useLocation();
  const { username } = useContext(UserContext);

  const handleClick = () => setClick(!click);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <NavLink to="/" className={styles.navLogo}>
          <img src={memeLogo} alt="Meme Hub Logo" className={styles.icon} />
          Meme Hub
        </NavLink>

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

        <ul className={click ? `${styles.navMenu} ${styles.active}` : styles.navMenu}>
          <li className={styles.navItem}>
            <NavLink
              to="/"
              className={({ isActive }) => 
                isActive ? `${styles.navLinks} ${styles.active}` : styles.navLinks
              }
              onClick={handleClick}
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
              onClick={handleClick}
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
              onClick={handleClick}
            >
              <FaQuestion className={styles.navIcon} /> FAQ
            </NavLink>
          </li>
          {/* Add Chat Button */}
          <li className={styles.navItem}>
            <button className={styles.chatButton} onClick={openChat}>
              <FaComments className={styles.navIcon} /> Chat
            </button>
          </li>
          <li className={styles.userProfile}>
            <span className={styles.username}>{username}</span>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;