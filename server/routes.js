// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const push = require('./push');


const mensajes = [

    {
        _id: 'XXX',
        user: 'spiderman',
        mensaje: 'Hola Mundo'
    }

];


// Get mensajes
router.get('/', function(req, res) {
    // res.json('Obteniendo mensajes');
    res.json(mensajes);
});


// Post mensaje
router.post('/', function(req, res) {

    const mensaje = {
        mensaje: req.body.mensaje,
        user: req.body.user
    };

    mensajes.push(mensaje);

    console.log(mensajes);


    res.json({
        ok: true,
        mensaje
    });
});


// Almacenar la subscipcion
router.post('/subscribe', (req, res) => {

    const suscripcion = req.body;

    // console.log(suscripcion);

    push.addSubscription(suscripcion);

    res.json('subscripto');

});

// Almacenar la subscipcion
router.get('/key', (req, res) => {

    const key = push.getKey();

    // res.json(key);
    res.send(key);
});

// Almacenar la subscipcion
router.get('/test', (req, res) => {
    res.json('ok');
});

// Enviar una notificacion PUSH a
// las personas que nosotros queramos
// Es algo que se controla del lado del server 
router.post('/push', (req, res) => {

    // const post = {
    //     titulo: req.body.titulo,
    //     cuerpo: req.body.cuerpo,
    //     usuario: req.body.usuario
    // };

    // push.sendPush(post);

    push.sendPush(req.body);

    res.json(req.body);

});

module.exports = router;