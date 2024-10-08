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
  const [ingredients, setIngredients] = useState({});
const [showOverlay, setShowOverlay] = useState(false);
const [currentIngredients, setCurrentIngredients] = useState([]);
const [currentProduct, setCurrentProduct] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchIngredientData();
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
        // No eliminar la orden temporal aquí para que pueda ser usada al guardar la orden
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
    // Obtener datos de ingredientes (suponiendo que fetchIngredientData es una función asincrónica)
    fetchIngredientData().then(() => {
      // Verificar si el producto tiene opciones de ingredientes personalizados
      if (ingredients[item.Nombre]) {
        // Abrir el overlay de personalización
        setCurrentProduct(item);
        setCurrentIngredients(ingredients[item.Nombre].map(ingredient => ({
          name: ingredient,
          added: false, // Se inicializa cada ingrediente como no añadido
          removed: false // Se inicializa cada ingrediente como no removido
        })));
        setShowOverlay(true);
      } else {
        // Si no tiene personalización, seguir con la lógica normal
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
      }
    });
  };
  
  // Función para manejar el cambio de estado de un ingrediente
  const handleIngredientChange = (ingredientName, action) => {
    setCurrentIngredients(currentIngredients.map(ingredient => 
      ingredient.name === ingredientName
        ? { 
            ...ingredient, 
            added: action === 'add' ? true : ingredient.added,
            removed: action === 'remove' ? true : ingredient.removed
          }
        : ingredient
    ));
  };
  
  // Función para finalizar la personalización y agregar el producto a la orden
  const handleFinalizeCustomization = () => {
    // Crear una representación de los ingredientes personalizados
    const personalizationDetails = currentIngredients
      .map(ingredient => {
        if (ingredient.added) {
          return `+${ingredient.name}`;
        }
        if (ingredient.removed) {
          return `-${ingredient.name}`;
        }
        return null;
      })
      .filter(detail => detail !== null)
      .join(', ');
  
    const customizedItem = {
      ...currentProduct,
      Personalizacion: personalizationDetails // Asigna los detalles de personalización a la variable Personalizacion
    };
  
    const existingItem = orderItems.find(orderItem => 
      orderItem.Nombre === customizedItem.Nombre &&
      orderItem.Personalizacion === customizedItem.Personalizacion
    );
  
    if (existingItem) {
      setOrderItems(orderItems.map(orderItem =>
        orderItem.Nombre === customizedItem.Nombre &&
        orderItem.Personalizacion === customizedItem.Personalizacion
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setOrderItems([...orderItems, { ...customizedItem, quantity: 1 }]);
    }
  
    setShowOverlay(false);
  };  
  
  const handleIncreaseIngredient = (index) => {
    const updatedIngredients = [...currentIngredients];
    updatedIngredients[index].quantity += 1;
    setCurrentIngredients(updatedIngredients);
  };
  
  const handleDecreaseIngredient = (index) => {
    const updatedIngredients = [...currentIngredients];
    if (updatedIngredients[index].quantity > 1) {
      updatedIngredients[index].quantity -= 1;
      setCurrentIngredients(updatedIngredients);
    }
  };
  
  const handleFinalizeIngredients = () => {
    const personalizedProduct = {
      ...currentProduct,
      Personalizacion: currentIngredients.map(ing => `${ing.name} x${ing.quantity}`).join(', '),
    };
    handleAddToOrder(personalizedProduct);
    setShowOverlay(false);
    setCurrentIngredients([]);
    setCurrentProduct(null);
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

  const handleSaveOrder = async () => {
    if (orderItems.length === 0 || !orderType) {
        alert('Por favor, agrega productos y selecciona el tipo de orden.');
        return;
    }

    let newOrderNumber;
    let allOrderNumbers = [];
    // Verificar si hay una orden temporal
    const tempOrderKey = Object.keys(localStorage).find(key => key.startsWith('temp'));
    if (tempOrderKey) {
      // Usar el número de la orden temporal
      newOrderNumber = parseInt(tempOrderKey.replace('temp', ''), 10);

      // Eliminar la orden temporal del localStorage
      localStorage.removeItem(tempOrderKey);
    } else {
      // Verificar en localStorage
      const localStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('orden'));
      let localOrderNumbers = localStorageKeys.map(key => {
          const match = key.match(/orden(\d+)/);
          return match ? parseInt(match[1], 10) : null;
      }).filter(num => num !== null);

      // Si hay números en localStorage, agregarlos a la lista de todos los números de orden
      if (localOrderNumbers.length > 0) {
          allOrderNumbers = [...localOrderNumbers];
      }

      // Verificar en el archivo .txt
      const fileResponse = await fetch('/orders-file');
      const fileContent = await fileResponse.text();

      const orderNumbersInFile = Array.from(fileContent.matchAll(/Numero de Orden: (\d+)/g), m => parseInt(m[1], 10));

      // Si hay números en el archivo, agregarlos a la lista de todos los números de orden
      if (orderNumbersInFile.length > 0) {
          allOrderNumbers = [...allOrderNumbers, ...orderNumbersInFile];
      }

      // Asignar el nuevo número de orden
      if (allOrderNumbers.length > 0) {
          allOrderNumbers.sort((a, b) => a - b);
          newOrderNumber = Math.max(...allOrderNumbers) + 1;
      } else {
          newOrderNumber = 1;
      }
    }

    // Guardar la orden en localStorage
    const orderData = {
        orderNumber: newOrderNumber,
        orderType,
        comment,
        items: orderItems.map(item => ({
            ...item,
            Personalizacion: item.Personalizacion || ''
        })),
        totalPrice: getTotalPrice()
    };

    localStorage.setItem(`orden${newOrderNumber}`, JSON.stringify(orderData));

    // Limpiar el carrito después de guardar
    setOrderItems([]);
    setComment('');
    setOrderType('');
    setCustomOptions({});
    navigate('/comandas'); // Redirigir a la página de Comandas
  };
  
  // Obtener las categorías únicas del menú
  const categories = Array.from(new Set(menuItems.map(item => item.Categoria)));

  const fetchIngredientData = async () => {
    const response = await fetch('/ingredientes.csv');
    const reader = response.body.getReader();
    const result = await reader.read();
    const decoder = new TextDecoder('utf-8');
    const csv = decoder.decode(result.value);
  
    Papa.parse(csv, {
      header: false,
      complete: function (results) {
        const data = results.data;
        const ingredientMap = {};
        for (let i = 0; i < data.length; i += 2) {
          const productNames = data[i][0].split(',').map(name => name.trim());
          const productIngredients = data[i + 1];
          productNames.forEach(name => {
            ingredientMap[name] = productIngredients;
          });
        }
        setIngredients(ingredientMap);
      },
    });
  };

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
        <ul className='product-list'>
          {filteredMenuItems.map((item, index) => (
            <li className='product-container' key={index}>
              {/* Mostrar la imagen del producto */}
              <div className="product">
                <img 
                  src={`/img/${item.Nombre.toLowerCase().replace(/\s+/g, '')}.png`} 
                  alt={item.Nombre} 
                  style={{ width: '100px', height: 'auto', objectFit: 'cover', marginRight: '10px' }}
                />
                <p>{item.Nombre} - <b className='orange-text'>$</b>{item.Precio}</p>
                {item.Dia && item.Dia === selectedDay && <span> - Promoción: {item.Promocion}</span>}
                {item.Personalizacion && (
                  <div>
                    <select className='selec' onChange={(e) => handleCustomOptionChange(item, e.target.value)}>
                    <option value = "" > Selecciona </option>
                      {item.Personalizacion.split('.').map((option, idx) => (
                        <option key={idx} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button className='add-btn' onClick={() => handleAddToOrder(item)}>Agregar</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="order-summary">
        <h2 className='impact-text'><b className='impact-text orange-text'>Nueva</b> Orden</h2>
        <ul className='summary-list'>
          {orderItems.map((item, index) => (
            <li className='summary-item' key={index}>
              <div className='item-description'>
                <p>{item.Nombre}</p>
                {item.Personalizacion.split(', ').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
                <p className='orange-text'>${item.Precio}</p>
              </div>
              <div className='item-quantity'>
                <button onClick={() => handleDecreaseQuantity(item)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleIncreaseQuantity(item)}>+</button>
              </div>
            </li>
          ))}
        </ul>
        <textarea className='commentaries'
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentarios adicionales"
        />
        <div className="order-type">
          <button
            onClick={() => setOrderType('mesa')}
            className={orderType === 'mesa' ? 'selected-type' : 'order-type-btn'}
          >
            Mesa
          </button>
          <button
            onClick={() => setOrderType('recoger')}
            className={orderType === 'recoger' ? 'selected-type' : 'order-type-btn'}
          >
            Recoger
          </button>
          <button
            onClick={() => setOrderType('domicilio')}
            className={orderType === 'domicilio' ? 'selected-type' : 'order-type-btn'}
          >
            Domicilio
          </button>
        </div>
        <button className='save-order'
          onClick={handleSaveOrder}
          disabled={!orderType} // Deshabilitar el botón si no se ha seleccionado un tipo de orden
        >
          Guardar Orden
        </button>
        <div className='total-text'>
          <span className='impact-text'>Total:</span><span className='impact-text orange-text'>${getTotalPrice().toFixed(2)}</span>
        </div>
      </div>
      {showOverlay && (
        <div className="overlay-ingredientes">
          <div className="overlay-content-ingredientes">
            <h2>Personaliza tu {currentProduct.Nombre}</h2>
            {currentIngredients.map((ingredient, index) => (
              <div key={index}>
                <span>{ingredient.name}</span>
                <div>
                  <button className='bmas' onClick={() => handleIngredientChange(ingredient.name, 'add')} disabled={ingredient.added}>+</button>
                  <button className='bmenos' onClick={() => handleIngredientChange(ingredient.name, 'remove')} disabled={ingredient.removed}>-</button>
                </div>
              </div>
            ))}
            <button className='f-btn' onClick={handleFinalizeCustomization}>Finalizar</button>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default Ordenar;