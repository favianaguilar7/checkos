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
          
          let paymentMethod = '';
          let total = 0;
          let time = '';

          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].includes('Hora:')) {
              time = lines[j].replace('Hora: ', '').trim();
            }

            if (lines[j].includes('Metodo de Pago:')) {
              paymentMethod = lines[j].replace('Metodo de Pago: ', '').trim();
            }
            
            if (lines[j].includes('Total Pagado:')) {
              total = parseFloat(lines[j].replace('Total Pagado: ', '').replace(/[^\d.-]/g, ''));
              break; // Detenemos la búsqueda una vez que encontramos el "Total Pagado"
            }

            // Si encontramos otro "Numero de Orden", salimos del bucle para procesar la siguiente orden
            if (lines[j].includes('Numero de Orden:')) {
              break;
            }
          }

          if (!isNaN(total)) { // Verifica si el total es un número
            if (paymentMethod.toLowerCase() === 'efectivo') {
              totalCash += total;
            } else if (paymentMethod.toLowerCase() === 'tarjeta') {
              totalCard += total;
            }
          } else {
            console.warn(`Total inválido encontrado en la orden ${orderNumber}`);
          }
  
          transactionDetails.push({
            orderNumber,
            paymentMethod,
            total: !isNaN(total) ? total : 0,
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
      <div className="caja-header">
        <div>
        <p><span className="usuario">Usuario:</span> {username}</p>
        <p><span className="corte-num">Número de Corte:</span> {corteNumber}</p>
        </div>
        <div>
        <p><span className="fecha-hora">Fecha de Apertura:</span> {openingDate}</p>
        <p><span className="fecha-hora">Hora de Cierre:</span> {closingTime}</p>
        </div>
      </div>
      <div className="caja-ingresos">
        <label>
          <span className="caja-label">Dinero en Efectivo:</span>
          <input
            className="ingreso-monto"
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </label>
        <label>
          <span className="caja-label">Dinero en Tarjeta:</span>
          <input
            className="ingreso-monto"
            type="number"
            value={card}
            onChange={(e) => setCard(e.target.value)}
          />
        </label>
      </div>
      <div className="caja-button-group">
        <button className="caja-button caja-continuar" onClick={handleCalculateDifference}>Continuar</button>
      </div>
      {diffCash !== '' && (
        <div className="caja-difference">
          <h3>Diferencia en Efectivo: <a>${diffCash}</a></h3>
          <h3>Diferencia en Tarjeta: <a>${diffCard}</a></h3>
        </div>
      )}
      {transactions.length > 0 && (
        <div className="caja-transactions caja-detalles-transacciones">
          <h3>Detalles de Transacciones:</h3>
          <ul className="caja-transactions-list">
            {transactions.map((transaction, index) => (
              <li key={index} className="caja-transaction-item transaccion">
                <strong>Número de Orden:</strong> {transaction.orderNumber} <br />
                <strong>Método de Pago:</strong> {transaction.paymentMethod} <br />
                <strong>Total Pagado:</strong> ${transaction.total.toFixed(2)} <br />
                <strong>Hora:</strong> {transaction.time}
              </li>
            ))}
          </ul>
        </div>
      )}
      {transactions.length > 0 && (
      <div className="caja-comment caja-comentarios">
        <label>
          <textarea
            className="caja-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </label>
      </div>
      )}
      {transactions.length > 0 && (
      <div className="caja-button-group">
        <button className="caja-button caja-finalizar" onClick={handleFinalize}>Finalizar</button>
      </div>
      )}
    </div>
  );
};

export default Caja;
