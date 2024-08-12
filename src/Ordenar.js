import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';

const Ordenar = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [comment, setComment] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() + 1); // Día actual (1 = lunes, 7 = domingo)
  const [orderType, setOrderType] = useState(''); // Tipo de orden (mesa, recoger, domicilio)
  const [customOptions, setCustomOptions] = useState({}); // Para almacenar opciones seleccionadas
  const [selectedCategory, setSelectedCategory] = useState(''); // Categoría seleccionada
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/menu.csv');
      const reader = response.body.getReader();
      const result = await reader.read();
      const decoder = new TextDecoder('utf-8');
      const csv = decoder.decode(result.value);

      Papa.parse(csv, {
        header: true,
        complete: function (results) {
          const items = results.data;
          setMenuItems(items);
          setFilteredMenuItems(items); // Inicialmente mostrar todo el menú
        },
      });
    };

    fetchData();

    // Verificar si existe una orden temporal en el localStorage
    const tempOrderKey = Object.keys(localStorage).find(key => key.startsWith('temp'));
    if (tempOrderKey) {
      const tempOrder = JSON.parse(localStorage.getItem(tempOrderKey));
      if (tempOrder) {
        setOrderItems(tempOrder.items);
        setComment(tempOrder.comment || '');
        setOrderType(tempOrder.orderType || '');
        // Eliminar la orden temporal del localStorage después de cargarla
        localStorage.removeItem(tempOrderKey);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredMenuItems(menuItems.filter(item => item.Categoria === selectedCategory));
    } else {
      setFilteredMenuItems(menuItems);
    }
  }, [selectedCategory, menuItems]);

  const handleAddToOrder = (item) => {
    const customOption = customOptions[item.Nombre] || '';
    const itemWithCustomOption = {
      ...item,
      Personalizacion: customOption
    };

    const existingItem = orderItems.find(orderItem => 
      orderItem.Nombre === itemWithCustomOption.Nombre &&
      orderItem.Personalizacion === itemWithCustomOption.Personalizacion
    );

    if (existingItem) {
      setOrderItems(orderItems.map(orderItem =>
        orderItem.Nombre === itemWithCustomOption.Nombre &&
        orderItem.Personalizacion === itemWithCustomOption.Personalizacion
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setOrderItems([...orderItems, { ...itemWithCustomOption, quantity: 1 }]);
    }
  };

  const handleCustomOptionChange = (item, option) => {
    setCustomOptions(prevOptions => ({
      ...prevOptions,
      [item.Nombre]: option
    }));
  };

  const handleIncreaseQuantity = (item) => {
    setOrderItems(orderItems.map(orderItem =>
      orderItem.Nombre === item.Nombre &&
      orderItem.Personalizacion === item.Personalizacion
        ? { ...orderItem, quantity: orderItem.quantity + 1 }
        : orderItem
    ));
  };

  const handleDecreaseQuantity = (item) => {
    const updatedOrderItems = orderItems.map(orderItem =>
      orderItem.Nombre === item.Nombre &&
      orderItem.Personalizacion === item.Personalizacion
        ? { ...orderItem, quantity: orderItem.quantity - 1 }
        : orderItem
    ).filter(orderItem => orderItem.quantity > 0);
    
    setOrderItems(updatedOrderItems);
  };

  const getTotalPrice = () => {
    return orderItems.reduce((total, item) => total + item.quantity * item.Precio, 0);
  };

  const handleSaveOrder = () => {
    if (orderItems.length === 0 || !orderType) {
      alert('Por favor, agrega productos y selecciona el tipo de orden.');
      return;
    }

    const orderNumber = localStorage.length + 1; // Generar número de orden único
    const orderData = {
      orderNumber,
      orderType,
      comment,
      items: orderItems.map(item => ({
        ...item,
        Personalizacion: item.Personalizacion || item.Personalizacion
      })),
      totalPrice: getTotalPrice()
    };
    localStorage.setItem(`orden${orderNumber}`, JSON.stringify(orderData));
    // Limpiar el carrito después de guardar
    setOrderItems([]);
    setComment('');
    setOrderType('');
    setCustomOptions({});
    navigate('/comandas'); // Redirigir a la página de Comandas
  };

  // Obtener las categorías únicas del menú
  const categories = Array.from(new Set(menuItems.map(item => item.Categoria)));

  return (
    <div className="ordenar-container">
      <div className="menu-container">
        <div className='menu-header'>
          <h1 className='impact-text menu-title'>Nuestro Menú</h1>
          <div className="filter-container">
            <button onClick={() => setSelectedCategory('')} className='filter-btn'>Todos</button>
            {categories.map((category, index) => (
              <button key={index} onClick={() => setSelectedCategory(category)} 
              className={selectedCategory === category ? 'selected-filter' : 'filter-btn'}>
                {category}
              </button>
            ))}
          </div>
        </div>
        <ul>
          {filteredMenuItems.map((item, index) => (
            <li key={index}>
              {item.Nombre} - ${item.Precio} 
              {item.Dia && item.Dia === selectedDay && <span> - Promoción: {item.Promocion}</span>}
              {item.Personalizacion && (
                <div>
                  <label>Personalización:</label>
                  <select onChange={(e) => handleCustomOptionChange(item, e.target.value)}>
                    <option value="">Seleccionar opción</option>
                    {item.Personalizacion.split('.').map((option, i) => (
                      <option key={i} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
              <button onClick={() => handleAddToOrder(item)}>Agregar</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="order-container">
        <h1>Orden</h1>
        <ul>
          {orderItems.map((item, index) => (
            <li key={index}>
              {item.Nombre} - ${item.Precio} x {item.quantity}
              {item.Personalizacion && <div>Personalización: {item.Personalizacion}</div>}
              <button onClick={() => handleIncreaseQuantity(item)}>+</button>
              <button onClick={() => handleDecreaseQuantity(item)}>-</button>
            </li>
          ))}
        </ul>
        <div className="order-total">
          <h2>Total: ${getTotalPrice().toFixed(2)}</h2>
        </div>
        <div className="order-comment">
          <label>Comentario:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
        <div className="order-type">
          <button onClick={() => setOrderType('mesa')}>Para Mesa</button>
          <button onClick={() => setOrderType('recoger')}>Para Recoger</button>
          <button onClick={() => setOrderType('domicilio')}>A Domicilio</button>
        </div>
        <button onClick={handleSaveOrder} disabled={!orderType}>Guardar Orden</button>
      </div>
    </div>
  );
};

export default Ordenar;