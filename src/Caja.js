import React, { useState, useEffect } from 'react';

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
    <div>
      <h1>Caja</h1>
      <div>
        <p><strong>Número de Corte:</strong> {corteNumber}</p>
        <p><strong>Fecha de Apertura:</strong> {openingDate}</p>
        <p><strong>Hora de Cierre:</strong> {closingTime}</p>
        <p><strong>Usuario:</strong> {username}</p>
      </div>
      <div>
        <label>
          Dinero en Efectivo:
          <input
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Dinero en Tarjeta:
          <input
            type="number"
            value={card}
            onChange={(e) => setCard(e.target.value)}
          />
        </label>
      </div>
      <div>
        <button onClick={handleCalculateDifference}>Continuar</button>
      </div>
      {diffCash !== '' && (
        <div>
          <h3>Diferencia de Dinero en Efectivo: ${diffCash}</h3>
        </div>
      )}
      {diffCard !== '' && (
        <div>
          <h3>Diferencia de Dinero en Tarjeta: ${diffCard}</h3>
        </div>
      )}
      {transactions.length > 0 && (
        <div>
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
      <div>
        <label>
          Comentario:
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </label>
      </div>
      <div>
        <button onClick={handleFinalize}>Finalizar</button>
      </div>
    </div>
  );
};

export default Caja;