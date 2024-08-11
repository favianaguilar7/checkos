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
    <div>
      <h2>Inicio de Sesión</h2>
      <div>
        <label>Usuario: </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label>Contraseña: </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={handleLogin}>Entrar</button>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
};

export default Login;
