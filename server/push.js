// const fs = require('fs');
const fetch = require("node-fetch");


// ///////////////////////////////
// //Token
// //////////////////////////////
// const jwt = require('jsonwebtoken');
// //console.log(require('crypto').randomBytes(64).toString('hex'));

// const dotenv = require('dotenv');

// // get config vars
// dotenv.config();

// // access config var
// //const secret = process.env.TOKEN_SECRET;

// function generateAccessToken(username) {
//     return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
// }

///////////////////////////////////////

const urlsafeBase64 = require('urlsafe-base64');
const vapid = require('./vapid.json');

const webpush = require('web-push');

webpush.setVapidDetails(
    'mailto:php.1722@gmail.com',
    vapid.publicKey,
    vapid.privateKey
);

// Se podria grabar base se datos tambien
let suscripciones = require('./subs-db.json');
// const { restart } = require('nodemon');
// let suscripcionesDb = [];

module.exports.getKey = () => {
    return JSON.stringify(urlsafeBase64.decode(vapid.publicKey));
    // return JSON.stringify(vapid.publicKey);

};

module.exports.addSubscription = (post) => {

    console.log(post.subscripcion);

    // const token = generateAccessToken({ username: req.body.username });
    // const jwtToken = generateAccessToken({ username: 1 });
    // console.log(jwtToken);

    // const headers = {

    //     //'Content-Type': 'application/ multipart/form-data',
    //     //'Content-Type': 'application/x-www-form-urlencoded',
    //     //'Content-Type': 'application/json',
    //     'accion': 'crearSubscripcion'

    // };

    const body = {

        'subscripcion': JSON.stringify(post.subscripcion),
        'tipo': post.tipo

    };

    //fetch('https://reqres.in/api/users', {
    fetch('https://late-backend-php.azurewebsites.net/api/notificaciones/', {
            method: 'POST',
            headers: {
                'accion': 'crearSubscripcion',
                'x-token': post.token
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        //.then(response => response.text());
        .then(respObj => {
            console.log(respObj);
            //     console.log(respObj.page);
        });

    suscripciones.push(post.subscripcion);

    //console.log(suscripciones);
    //fs.writeFileSync(`${ __dirname}/subs-db.json`, JSON.stringify(suscripciones));

};

module.exports.sendPush = (post) => {
    console.log('Mandando PUSHES');
    //let enviadas = false;
    const body = {
        'nombre': post.nombre,
        'apellido': post.apellido,
        'unique_id': post.unique_id,
        'email': post.email,
        'tipo': post.tipo,
        'receptor': post.receptor
    };
    console.log(body);
    fetch('https://late-backend-php.azurewebsites.net/api/notificaciones/', {
            method: 'POST',
            headers: {
                'accion': 'getSubscripciones',
                'x-token': post.token
            },
            body: JSON.stringify(body)
        })
        .then(response => response.json())
        //.then(response => response.text())
        //Esto es para verificar qe deuelve el backend
        //.then(respObj => {
        //  console.log(respObj);
        //   console.log(respObj.msg);
        //     //     console.log(respObj.page);
        //})
        .then(resp => {
            // console.log(resp.subscripciones.toString().replace(/[']+/g, ''));
            console.log(resp);
            // console.log(JSON.parse(resp.subscripciones));
            // console.log(resp.ok);
            //console.log(resp.subscripciones.replace('\'', ''));
            if (resp.ok) {
                const notificacionesEnviadas = [];
                //const resultado = [];
                ///resultado.push(resp.subscripciones);
                // resultado.push(resp.subscripciones.toString().replace(/[']+/g, ''));
                //console.log(resp.subscripciones);
                const subscripcionesFallidas = [];
                resp.subscripciones.forEach((suscripcion, i) => {
                    const payload = JSON.stringify({
                        notification: {
                            title: post.titulo,
                            body: post.cuerpo,
                            icon: 'https://late-backend-php.azurewebsites.net/api/assets/72x72.png',
                            vibrate: [100, 50, 100],
                            // url: 'https://loteriadecordoba.com.ar/',
                            data: {
                                // url: 'https://loteriadecordoba.com.ar/'
                                // url: '/',
                                //         id: data.usuario
                            }
                            // data: {
                            // url: 'https://medium.com/@arjenbrandenburgh/angulars-pwa-swpush-and-swupdate-15a7e5c154ac'
                            //}
                        }
                    });
                    const pushProm = webpush.sendNotification(JSON.parse(suscripcion.descripcion), payload)
                        // const pushProm = webpush.sendNotification(suscripcion, JSON.stringify(post))
                        .then(() => {
                            // enviadas = true;
                            console.log('Notificacion Enviada');
                        })
                        .catch(err => {
                            console.log('Notificacion fallo');
                            subscripcionesFallidas.push(suscripcion.id);
                            if (err.statusCode === 410) { // GONE, ya no existe
                                suscripciones[i].borrar = true;
                            }
                        });
                    notificacionesEnviadas.push(pushProm);
                });
                Promise.all(notificacionesEnviadas)
                    .then(() => {
                        // suscripciones = suscripciones.filter(subs => !subs.borrar);
                        // fs.writeFileSync(`${ __dirname}/subs-db.json`, JSON.stringify(suscripciones));
                        // console.log(subscripcionesFallidas);
                        if (subscripcionesFallidas.length > 0) {
                            const body = {
                                'subscripciones': subscripcionesFallidas
                            };
                            fetch('https://late-backend-php.azurewebsites.net/api/notificaciones/', {
                                    method: 'POST',
                                    headers: {
                                        'accion': 'eliminarSubscripciones'
                                    },
                                    body: JSON.stringify(body)
                                })
                                //.then(response => response.json())
                                //.then(response => console.log(response));
                                //.then(response => response.json())
                                .then(response => response.text())
                                //Esto es para verificar qe deuelve el backend
                                .then(respObj => {
                                    console.log(respObj);
                                    //   console.log(respObj.msg);
                                    //     //     console.log(respObj.page);
                                });
                        }
                    });
            } else {
                console.log(resp.msg);
                console.log('No se pudieron recuperar las subscripciones!!!.');
            }
        }).catch(err => console.log(err));

    // return enviadas;

    //const notificacionesEnviadas = [];

    // suscripciones.forEach((suscripcion, i) => {

    // const options = {
    //     body: data.cuerpo,
    //     // icon: 'img/icons/icon-72x72.png',
    //     icon: `img/avatars/${ data.usuario }.jpg`,
    //     badge: 'img/favicon.ico',
    //     image: 'https://www.google.com/imgres?imgurl=https%3A%2F%2Fcde.laprensa.e3.pe%2Fima%2F0%2F0%2F1%2F7%2F5%2F175423.jpg&imgrefurl=https%3A%2F%2Flaprensa.peru.com%2Fespectaculos%2Fnoticia-spider-man-homecoming-avengers-tower-quien-compro-torre-vengadores-73004&tbnid=EGl7vnfwxEjZbM&vet=12ahUKEwjwr_reseDxAhV6BbkGHV-nAukQMygDegUIARDJAQ..i&docid=yD6YqnNuQkhgsM&w=924&h=530&q=torre%20de%20los%20vengadores&ved=2ahUKEwjwr_reseDxAhV6BbkGHV-nAukQMygDegUIARDJAQ',
    //     vibrate: [125, 75, 125, 275, 200, 275, 125, 75, 125, 275, 200, 600, 200, 600],
    //     openUrl: '/',
    //     data: {
    //         // url: 'https://google.com',
    //         url: '/',
    //         id: data.usuario
    //     },
    //     actions: [{
    //             action: 'thor-action',
    //             title: 'Thor',
    //             icon: 'img/avatars/thor.jpg'
    //         },
    //         {
    //             action: 'ironman-action',
    //             title: 'Ironman',
    //             icon: 'img/avatars/ironman.jpg'
    //         },
    //         {
    //             action: 'spiderman-action',
    //             title: 'Spiderman',
    //             icon: 'img/avatars/spiderman.jpg'
    //         }
    //     ]
    // };

    // const payload = JSON.stringify({
    //     notification: {
    //         title: 'Notifications are cool',
    //         body: 'Know how to send notifications through Angular with this article!',
    //         icon: 'https://www.shareicon.net/data/256x256/2015/10/02/110808_blog_512x512.png',
    //         vibrate: [100, 50, 100],
    //         data: {
    //             url: 'https://medium.com/@arjenbrandenburgh/angulars-pwa-swpush-and-swupdate-15a7e5c154ac'
    //         }
    //     }
    // });

    // const pushProm = webpush.sendNotification(suscripcion, payload)
    //     // const pushProm = webpush.sendNotification(suscripcion, JSON.stringify(post))
    //     .then(console.log('Notificacion Enviada'))
    //     .catch(err => {
    //         console.log('Notificacion fallo');
    //         if (err.statusCode === 410) { // GONE, ya no existe
    //             suscripciones[i].borrar = true;
    //         }
    //     });
    //   notificacionesEnviadas.push(pushProm);
    //     });

    // Promise.all(notificacionesEnviadas)
    //     .then(() => {
    //         suscripciones = suscripciones.filter(subs => !subs.borrar);
    //         fs.writeFileSync(`${ __dirname}/subs-db.json`, JSON.stringify(suscripciones));
    //     });

    // return enviadas;
}