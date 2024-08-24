import React, { useState, useEffect } from 'react';
import './caja.css'; // Importar el archivo de estilos

const Caja = () => {
  const [corteNumber, setCorteNumber] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [username, setUsername] = useState('');
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [diffCash, setDiffCash] = useState('');
  const [diffCard, setDiffCard] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const today = new Date().toLocaleDateString().replace(/\//g, '');
    setCorteNumber(today);

    const currentTime = new Date().toLocaleTimeString();
    setClosingTime(currentTime);

    const openingDateFromStorage = localStorage.getItem('openingDate');
    setOpeningDate(openingDateFromStorage || today);

    const usernameFromStorage = localStorage.getItem('username');
    setUsername(usernameFromStorage || 'Usuario');
  }, []);

  const handleCalculateDifference = async () => {
    try {
      const response = await fetch('http://localhost:3000/transactions-today');
      const transactionsToday = await response.text();

      const lines = transactionsToday.split('\n');
      let totalCash = 0;
      let totalCard = 0;
      const transactionDetails = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Numero de Orden:')) {
          const orderNumber = lines[i].replace('Numero de Orden: ', '').trim();
          const timeLine = lines[i + 2];
          const time = timeLine.replace('Hora: ', '').trim();
          const paymentMethodLine = lines[i + 3];
          const paymentMethod = paymentMethodLine.replace('Metodo de Pago: ', '').trim();
          const totalLine = lines[i + 6];
          const total = parseFloat(totalLine.replace('Total Pagado: ', '').trim());

          if (paymentMethod.toLowerCase() === 'efectivo') {
            totalCash += total;
          } else if (paymentMethod.toLowerCase() === 'tarjeta') {
            totalCard += total;
          }

          transactionDetails.push({
            orderNumber,
            paymentMethod,
            total,
            time,
          });
        }
      }

      const cashAmount = parseFloat(cash) || 0;
      const cardAmount = parseFloat(card) || 0;
      const diffCash = cashAmount - totalCash;
      const diffCard = cardAmount - totalCard;

      setDiffCash(diffCash.toFixed(2));
      setDiffCard(diffCard.toFixed(2));

      setTransactions(transactionDetails);
    } catch (error) {
      console.error('Error al calcular la diferencia:', error);
    }
  };

  const handleFinalize = async () => {
    try {
      await fetch('http://localhost:3000/save-corte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          corteNumber,
          openingDate,
          closingTime,
          username,
          cash,
          card,
          diffCash,
          diffCard,
          comment,
          transactions: [] // No se guardan detalles de transacciones en el archivo
        }),
      });

      // Resetear campos
      setCash('');
      setCard('');
      setDiffCash('');
      setDiffCard('');
      setComment('');
      setTransactions([]);
      localStorage.removeItem('openingDate');
    } catch (error) {
      console.error('Error al finalizar el corte:', error);
    }
  };

  return (
    <div className="caja-container">
      <h1 className="caja-title">Caja</h1>
      <div className="caja-info">
        <p><span className="caja-label">Número de Corte:</span> {corteNumber}</p>
        <p><span className="caja-label">Fecha de Apertura:</span> {openingDate}</p>
        <p><span className="caja-label">Hora de Cierre:</span> {closingTime}</p>
        <p><span className="caja-label">Usuario:</span> {username}</p>
      </div>
      <div>
        <label>
          <span className="caja-label">Dinero en Efectivo:</span>
          <input
            className="caja-input"
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          <span className="caja-label">Dinero en Tarjeta:</span>
          <input
            className="caja-input"
            type="number"
            value={card}
            onChange={(e) => setCard(e.target.value)}
          />
        </label>
      </div>
      <div>
        <button className="caja-button" onClick={handleCalculateDifference}>Continuar</button>
      </div>
      {diffCash !== '' && (
        <div className="caja-difference">
          <h3>Diferencia de Dinero en Efectivo: ${diffCash}</h3>
        </div>
      )}
      {diffCard !== '' && (
        <div className="caja-difference">
          <h3>Diferencia de Dinero en Tarjeta: ${diffCard}</h3>
        </div>
      )}
      {transactions.length > 0 && (
        <div className="caja-transactions">
          <h3>Detalles de Transacciones:</h3>
          <ul>
            {transactions.map((transaction, index) => (
              <li key={index}>
                <strong>Número de Orden:</strong> {transaction.orderNumber} <br />
                <strong>Método de Pago:</strong> {transaction.paymentMethod} <br />
                <strong>Total Pagado:</strong> ${transaction.total.toFixed(2)} <br />
                <strong>Hora:</strong> {transaction.time}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="caja-comment">
        <label>
          <span className="caja-label">Comentario:</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </label>
      </div>
      <div>
        <button className="caja-button" onClick={handleFinalize}>Finalizar</button>
      </div>
    </div>
  );
};

export default Caja;