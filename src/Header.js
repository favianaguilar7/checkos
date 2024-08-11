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
      <nav>
        <ul>
          <li><Link to="/ordenar">Ordenar</Link></li>
          <li><Link to="/comandas">Comandas</Link></li>
          <li><Link to="/caja">Caja</Link></li>
        </ul>
      </nav>
      <div className="username">
        {username && <p>{username}</p>}
      </div>
    </header>
  );
};

export default Header;
