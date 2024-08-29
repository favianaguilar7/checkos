const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Asegurarse de que el directorio 'ordenes' exista
const dir = path.join(__dirname, 'ordenes');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Obtener el último número de orden del archivo si localStorage está vacío
app.get('/orders-file', (req, res) => {
    const today = new Date().toLocaleDateString().replace(/\//g, '');
    const fileName = `orden_${today}.txt`;
    const filePath = path.join(dir, fileName);

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        res.send(fileContent);
    } else {
        res.send(''); // Si el archivo no existe, devolver una cadena vacía
    }
});

// Verificar si un número de orden está disponible en el archivo
app.get('/check-order-number/:orderNumber', (req, res) => {
    const { orderNumber } = req.params;
    const today = new Date().toLocaleDateString().replace(/\//g, '');
    const fileName = `orden_${today}.txt`;
    const filePath = path.join(dir, fileName);
    let orderExists = false;

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const numberPattern = new RegExp(`Numero de Orden: ${orderNumber}`);
        if (numberPattern.test(fileContent)) {
            orderExists = true;
        }
    }

    res.json({ exists: orderExists });
});

// Guardar una orden
app.post('/save-order', (req, res) => {
    const { orderNumber, items, totalPrice, paymentMethod } = req.body;
    const today = new Date().toLocaleDateString().replace(/\//g, '');
    const fileName = `orden_${today}.txt`;
    const filePath = path.join(dir, fileName);

    const orderDetails = `
Numero de Orden: ${orderNumber}
Fecha: ${new Date().toLocaleDateString()}
Hora: ${new Date().toLocaleTimeString()}
Metodo de Pago: ${paymentMethod}
Productos:
${items.map(item => `${item.Nombre} - ${item.Precio} x ${item.quantity}`).join('\n')}
Total Pagado: ${totalPrice}
    `;

    fs.appendFile(filePath, orderDetails, (err) => {
        if (err) {
            console.error('Error al guardar la orden:', err);
            res.status(500).send('Error al guardar la orden');
        } else {
            res.json({ fileName });
        }
    });
});

app.get('/transactions-today', (req, res) => {
    const today = new Date().toLocaleDateString().replace(/\//g, '');
    const fileName = `orden_${today}.txt`;
    const filePath = path.join(dir, fileName);

    if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        res.send(fileContent);
    } else {
        res.send(''); // Si no hay transacciones, devolver una cadena vacía
    }
});

app.post('/save-corte', (req, res) => {
    const { corteNumber, openingDate, closingTime, username, cash, card, diffCash, diffCard, comment } = req.body;
    const fileName = `orden_${corteNumber}.txt`;
    const filePath = path.join(dir, fileName);

    const corteDetails = `
=== Corte de Caja ===
Fecha de Apertura: ${openingDate}
Hora de Cierre: ${closingTime}
Usuario: ${username}
Dinero en Efectivo: ${cash}
Dinero en Tarjeta: ${card}
Diferencia en Efectivo: ${diffCash}
Diferencia en Tarjeta: ${diffCard}
Comentario: ${comment}
==============================
`;

    fs.appendFile(filePath, corteDetails, (err) => {
        if (err) {
            console.error('Error al guardar el corte de caja:', err);
            res.status(500).send('Error al guardar el corte de caja');
        } else {
            res.json({ message: 'Corte de caja guardado exitosamente' });
        }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});