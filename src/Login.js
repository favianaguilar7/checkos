import React, { useState } from 'react';
import Papa from 'papaparse';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    const response = await fetch('/user.csv');  // Ruta relativa a la carpeta public
    const reader = response.body.getReader();
    const result = await reader.read();
    const decoder = new TextDecoder('utf-8');
    const csv = decoder.decode(result.value);

    Papa.parse(csv, {
      header: true,
      complete: function (results) {
        const user = results.data.find(
          (row) => row.username === username && row.password === password
        );
        if (user) {
          setErrorMessage('');
          // Guardar el usuario en el local storage
          localStorage.setItem('username', username);
          // Redirigir a la página de ordenar
          window.location.href = '/ordenar';
        } else {
          setErrorMessage('Usuario o contraseña incorrectos.');
        }
      },
    });
  };

  return (
    <div className='login'>
      <h1 className="impact-text login-title">Checko's Burger</h1>
      <div className='login-content'>
        <h2 className='white-text login-subtitle'>Iniciar Sesión</h2>
        <div className='bottom-content'>
          <div>
            {/* <label>Usuario: </label> */}
            <input
              className='login-input'
              type="text"
              placeholder='Usuario'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            {/* <label>Contraseña: </label> */}
            <input
              className='login-input'
              type="password"
              placeholder='Contraseña'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className='btn-div'>
            <button className='login-btn' onClick={handleLogin}>Entrar</button>
          </div>
          {errorMessage && <p>{errorMessage}</p>}
          </div>
      </div>
    </div>
  );
};

export default Login;
