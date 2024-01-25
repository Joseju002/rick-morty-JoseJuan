const express = require('express');
const app = express();
const axios = require('axios');
//Para lectura de datos de JSON
const bodyParser = require('body-parser');

//Lectura de JSON
app.use(express.json());

//Lectura de ficheros
var fs = require('fs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

//Puerto
const port = process.env.PORT || 3000;

//Pagina principal, en la que se muestra la información
app.get('/', (req, res) => {
    var contenido = fs.readFileSync('./public/index.html');
    response.setHeader('Content-Type', 'text/html');
    res.send(contenido);
});

//Aquí es donde obtenemos la información de la API
app.post('/JSON', async (req, res) => {
    //Llamamos a la API de GraphQL de Rick y Morty
    var graphQL = 'https://rickandmortyapi.com/graphql';
    console.log("Respuesta: " + req.body.page);
    //Hacemos la query en este lenguaje
    var query = `query {
                    characters(page: ${parseInt(req.body.page)}) {
                        results {
                            name, image, gender, species, status
                        }
                    }
                }`;

    //Comprobaciones
    try { //Se envía
        const response = await axios.post(graphQL, { query }, { headers: { 'Content-Type': 'application/json' } });
        const responseData = response.data.data.characters.results;
        res.json(responseData);
    } catch (error) { //En caso de error
        console.error('Error making GraphQL request:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//Main
app.listen(port, () => {
    console.log('Aplicación ejecutando en el puerto ' + port);
});