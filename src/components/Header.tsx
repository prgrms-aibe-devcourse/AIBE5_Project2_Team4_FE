import { useState, useEffect, useRef } from 'react';
import './header.css';
import { getUser, logout, type User } from '../store/appAuth';

interface HeaderProps {
  activePage?: string;
}

export default function Header({ activePage }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userAreaRef.current && !userAreaRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    window.location.href = '/';
  }

  return (
    <nav className="header">
      <div className="header-container">
        <a href="/"><img src="/logo.png" alt="logo" className="header-logo" /></a>
        <ul className="header-menu">
          <li><a href="/" className={activePage === 'home' ? 'active' : ''}>HOME</a></li>
          <li><a href="/#services" className={activePage === 'services' ? 'active' : ''}>SERVICES</a></li>
          <li><a href="/#about" className={activePage === 'about' ? 'active' : ''}>ABOUT</a></li>
          <li><a href="/#contact" className={activePage === 'contact' ? 'active' : ''}>CONTACT</a></li>
          <li><a href="/freelancers" className={activePage === 'freelancers' ? 'active' : ''}>HELPERS</a></li>
        </ul>

        {user ? (
          <div className="header-user-area" ref={userAreaRef}>
            <button className="header-profile" onClick={() => setDropdownOpen(o => !o)}>
              <span className="header-username">{user.name}</span>
              {user.avatar
                ? <img src={user.avatar} alt="profile" className="header-avatar-img" />
                : <div className="header-avatar">{user.name[0]}</div>
              }
            </button>
            {dropdownOpen && (
              <div className="header-dropdown">
                <a href="/mypage" className="header-dropdown-item">마이페이지</a>
                <a href="/project" className="header-dropdown-item">내 프로젝트</a>
                <button className="header-dropdown-item danger" onClick={handleLogout}>로그아웃</button>
              </div>
            )}
          </div>
        ) : (
          <a href="/login"><button className="header-login-btn">LOGIN</button></a>
        )}
      </div>
    </nav>
  );
}
