import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate para redirigir
import './Comandas.css';

const Comandas = () => {
  const [orders, setOrders] = useState([]);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);
  const [showCashOverlay, setShowCashOverlay] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashAmount, setCashAmount] = useState(0);
  const [change, setChange] = useState(0);
  const [selectedItems, setSelectedItems] = useState({}); // Para almacenar los productos seleccionados

  const navigate = useNavigate(); // Hook para redirigir

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
    if (method === 'transferencia') {
      alert('Continúa con el cajero');
      handleFinishOrder();
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
                alert(`Orden guardada correctamente en el archivo ${result.fileName}`);

                // Eliminar la orden del localStorage después de guardarla en el archivo
                localStorage.removeItem(`orden${selectedOrder.orderNumber}`);
            } else {
                alert('Error al guardar la orden');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }

        // Limpiar estado
        setOrders(orders.filter(order => order.orderNumber !== selectedOrder.orderNumber));
        setSelectedOrder(null);
        setShowPaymentOverlay(false);
        setShowCashOverlay(false);
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
      // Obtener los productos seleccionados
      const updatedItems = order.items.map((item, idx) => {
        const itemId = `${order.orderNumber}_${idx}`;
        return {
          ...item,
          selected: isItemSelected(itemId) // Añadimos el estado de selección al item
        };
      });
  
      // Eliminar la orden actual del localStorage
      localStorage.removeItem(`orden${order.orderNumber}`);
  
      // Crear una nueva orden con un nombre basado en `temp`
      const tempOrderNumber = `temp${order.orderNumber}`;
  
      // Actualizar el localStorage con la nueva orden
      const updatedOrderData = {
        ...order,
        orderNumber: tempOrderNumber,
        items: updatedItems
      };
  
      localStorage.setItem(tempOrderNumber, JSON.stringify(updatedOrderData));
  
      // Redirigir a la página de Ordenar
      navigate('/ordenar');
    } else {
      alert('No hay una orden seleccionada.');
    }
  };

  return (
    <div>
      <h1>Comandas</h1>
      {orders.length === 0 ? (
        <p>No hay órdenes disponibles.</p>
      ) : (
        orders.map((order) => (
          <div key={order.orderNumber} className="order">
            <h2>Orden {order.orderNumber}</h2>
            <p><strong>Tipo de Orden:</strong> {order.orderType}</p>
            <p><strong>Comentario:</strong> {order.comment}</p>
            <ul>
              {order.items.map((item, idx) => {
                // Generar un ID único para cada item en función de la orden y su índice
                const itemId = `${order.orderNumber}_${idx}`;
                return (
                  <li key={itemId}>
                    {item.Nombre} - ${item.Precio} x {item.quantity}
                    {item.Personalizacion && <div>{item.Personalizacion}</div>}
                  </li>
                );
              })}
            </ul>
            <h3>Total: ${order.totalPrice.toFixed(2)}</h3>
            <button onClick={() => handleAddProducts(order)}>Agregar</button> {/* Botón para agregar productos */}
            <button onClick={() => handleCompleteOrder(order)}>Completar</button>
          </div>
        ))
      )}

      {showPaymentOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Selecciona el método de pago</h2>
            <button onClick={() => handlePaymentMethod('efectivo')}>Efectivo</button>
            <button onClick={() => handlePaymentMethod('transferencia')}>Transferencia</button>
          </div>
        </div>
      )}

      {showCashOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Información del Pago</h2>
            <p>Total: ${selectedOrder.totalPrice.toFixed(2)}</p>
            <label>
              Cantidad con la que va a pagar:
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => handleCashPayment(Number(e.target.value))}
              />
            </label>
            <p>Cambio: ${change.toFixed(2)}</p>
            <button onClick={handleFinishOrder}>Terminar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comandas;