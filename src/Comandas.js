import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pedidos.css';

const Pedidos = () => {
  const [orders, setOrders] = useState([]);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [showCashOverlay, setShowCashOverlay] = useState(false);
  const [showCardOverlay, setShowCardOverlay] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState(0);
  const [change, setChange] = useState(0);
  const [selectedItems, setSelectedItems] = useState({});
  const [cardNumber, setCardNumber] = useState('1234567890123456');

  const navigate = useNavigate();

  useEffect(() => {
    const storedOrders = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('orden')) {
        const order = JSON.parse(localStorage.getItem(key));
        storedOrders.push(order);
      }
    }
    setOrders(storedOrders);
  }, []);

  const handleCompleteOrder = (order) => {
    setSelectedOrder(order);
    setShowPaymentOverlay(true);
  };

  const handlePaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method === 'tarjeta') {
      setShowPaymentOverlay(false);
      setShowCardOverlay(true);
    } else {
      setShowPaymentOverlay(false);
      setShowCashOverlay(true);
    }
  };

  const handleFinishOrder = async () => {
    if (selectedOrder) {
        const orderDetails = {
            orderNumber: selectedOrder.orderNumber,
            items: selectedOrder.items,
            totalPrice: selectedOrder.totalPrice,
            paymentMethod: paymentMethod
        };

        try {
            const response = await fetch('/save-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderDetails),
            });

            if (response.ok) {
                const result = await response.json();
                localStorage.removeItem(`orden${selectedOrder.orderNumber}`);
            } else {
            }
        } catch (error) {
            console.error('Error:', error);
        }

        setOrders(orders.filter(order => order.orderNumber !== selectedOrder.orderNumber));
        setSelectedOrder(null);
        setShowPaymentOverlay(false);
        setShowCashOverlay(false);
        setShowCardOverlay(false);
        setPaymentMethod('');
        setCashAmount(0);
        setChange(0);
    }
  };

  const handleCashPayment = (amount) => {
    const total = selectedOrder.totalPrice;
    setCashAmount(amount);
    setChange(amount - total);
  };

  const handleCheckboxChange = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isItemSelected = (itemId) => {
    return selectedItems[itemId] || false;
  };

  const handleAddProducts = (order) => {
    if (order) {
      const updatedItems = order.items.map((item, idx) => {
        const itemId = `${order.orderNumber}_${idx}`;
        return {
          ...item,
          selected: isItemSelected(itemId)
        };
      });
  
      localStorage.removeItem(`orden${order.orderNumber}`);
  
      const tempOrderNumber = `temp${order.orderNumber}`;
  
      const updatedOrderData = {
        ...order,
        orderNumber: tempOrderNumber,
        items: updatedItems
      };
  
      localStorage.setItem(tempOrderNumber, JSON.stringify(updatedOrderData));
      navigate('/ordenar');
    } else {
      alert('No hay una orden seleccionada.');
    }
  };

  return (
    <div className="pedidos-container">
      <h1 className="pedidos-title">Pedidos</h1>
      {orders.length === 0 ? (
        <p>No hay órdenes disponibles.</p>
      ) : (
        <div className="pedidos-grid">
          {orders.map((order) => (
            <div key={order.orderNumber} className="pedidos-order-card">
              <h2 className="pedidos-order-title">
                <span className="pedidos-order-label">Orden</span> <span className="pedidos-order-number">#{order.orderNumber}</span>
              </h2>
              <ul className="pedidos-item-list">
                {order.items.map((item, idx) => (
                  <li key={`${order.orderNumber}_${idx}`} className="pedidos-item">
                    <div className="nombre">{item.Nombre}</div>
                    <div className="cantidad">{item.quantity}</div>
                    <div className="precio"><span className='signo'>$</span>{item.Precio}</div>
                    {item.Personalizacion && <div className="personalizacion">{item.Personalizacion}</div>}
                  </li>
                ))}
              </ul>
              <h3 className="pedidos-total">Total: ${order.totalPrice.toFixed(2)}</h3>
              <div className="pedidos-comment">
                <strong></strong> {order.comment}
              </div>
              <button onClick={() => handleAddProducts(order)} className="agregar-button">Agregar</button>
              <button onClick={() => handleCompleteOrder(order)} className="completar-button">Completar</button>
            </div>
          ))}
        </div>
      )}

      {showPaymentOverlay && (
        <div className="pedidos-overlay">
          <div className="pedidos-overlay-content">
            <h2>Selecciona el método de pago</h2>
            <button onClick={() => handlePaymentMethod('efectivo')} className="pedidos-button">Efectivo</button>
            <button onClick={() => handlePaymentMethod('tarjeta')} className="pedidos-button">Tarjeta</button>
          </div>
        </div>
      )}

      {showCashOverlay && (
        <div className="pedidos-overlay">
          <div className="pedidos-overlay-content">
            <h2>Información del Pago</h2>
            <p>Total: ${selectedOrder.totalPrice.toFixed(2)}</p>
            <label>
              Cantidad con la que va a pagar:
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => handleCashPayment(Number(e.target.value))}
                className="pedidos-input"
              />
            </label>
            <p>Cambio: ${change.toFixed(2)}</p>
            <button onClick={handleFinishOrder} className="pedidos-button">Terminar</button>
          </div>
        </div>
      )}

      {showCardOverlay && (
        <div className="pedidos-overlay">
          <div className="pedidos-overlay-content">
            <h2>Información del Pago con Tarjeta</h2>
            <p>Total a pagar: ${selectedOrder.totalPrice.toFixed(2)}</p>
            <p><strong>Número de Tarjeta:</strong> {cardNumber}</p>
            <button onClick={handleFinishOrder} className="pedidos-button">Terminar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
