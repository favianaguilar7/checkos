import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <header className="header">
      <p className='impact-text nav-brand header-comp'>Checko's Burger</p>
      <nav className='header-comp'>
        <ul>
          <li><Link className='white-text' to="/ordenar">Ordenar</Link></li>
          <li><Link className='white-text' to="/comandas">Comandas</Link></li>
          <li><Link className='white-text' to="/caja">Caja</Link></li>
        </ul>
      </nav>
      <div className="username header-comp">
        {username && <p>{username}</p>}
      </div>
    </header>
  );
};

export default Header;
