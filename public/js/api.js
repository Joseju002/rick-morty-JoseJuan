$(document).ready(function () {
    var selectElement = $('#pages');
    var personajes; //Aquí almacenaremos los personajes obtenidos

    // Rellena el select con números del 1 al 42 (páginas totales que tiene la API)
    for (var i = 1; i <= 42; i++) {
        var option = $('<option>', {
            text: i
        });

        selectElement.append(option);
    }

    //Para mostrar el icono de carga
    function mostrarSpinner() {
        var gif = `<img src="images/cargando.gif" alt="loading" width="200px">`;
        $('#cargando').append(gif);
    }

    //Para ocultar el icono de carga
    function ocultarSpinner() {
        $('#cargando').empty();
    }

    //Aquí hacemos la función que aplicará los filtros que he otorgados
    function aplicarFiltros() {
        var generoMasculino = $('#masculino').is(':checked');
        var generoFemenino = $('#femenino').is(':checked');
        var generoDesconocido = $('#desconocido').is(':checked');

        var estadoVivo = $('#vivo').is(':checked');
        var estadoMuerto = $('#muerto').is(':checked');
        var estadoDesconocido = $('#unknown').is(':checked');

        //En esta variable devolvemos que filtros se han dado o no
        var personajesFiltrados = personajes.filter(function (personaje) {
            return (!generoMasculino || personaje.gender === "Male") &&
                (!generoFemenino || personaje.gender === "Female") &&
                (!generoDesconocido || personaje.gender === "unknown") &&
                (!estadoVivo || personaje.status === "Alive") &&
                (!estadoMuerto || personaje.status === "Dead") &&
                (!estadoDesconocido || personaje.status === "unknown");
        });

        //Aquí hacemos las correspondientes respuestas
        if (personajesFiltrados.length === 0) { //Si no se devuelven resultados
            $('#personajes').empty();
            $('#mensajeError').empty();
            var error = `<h2>No se arrojaron resultados</h2>`;
            $('#mensajeError').append(error);
        } else { //Si se devuelven, se mostrarán los resultados
            $('#mensajeError').empty();
            mostrarPersonajes(personajesFiltrados);
        }
    };

    //Esta es la función que se mostrará los personajes
    function mostrarPersonajes(data) {
        $('#personajes').empty();
        ocultarSpinner(); //Ocultamos el logo de cargando cuando se muestran los personajes

        // Iterar sobre los datos y crear una card para cada personaje
        data.forEach(function (character) {
            var genero;
            var estado;

            if (character.gender == "Male") {
                genero = "Masculino";
            } else if (character.gender == "Female") {
                genero = "Femenino";
            } else {
                genero = "?";
            }

            if (character.status == "Alive") {
                estado = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-success bi bi-circle-fill" viewBox="0 0 16 16"> <circle cx="8" cy="8" r="8"/></svg>';
            } else if (character.status == "Dead") {
                estado = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-danger bi bi-circle-fill" viewBox="0 0 16 16"> <circle cx="8" cy="8" r="8"/></svg>';
            } else {
                estado = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-secondary bi bi-circle-fill" viewBox="0 0 16 16"> <circle cx="8" cy="8" r="8"/></svg>';
            }

            var cardHtml = `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <img src="${character.image}" class="card-img-top" alt="${character.name}">
                        <div class="card-body text-center">
                            <h2 class="card-title">${character.name}</h2>
                            <h5 class="card-text"><strong>Género: </strong>${genero}</h5>
                            <h5 class="card-text"><strong>Especie: </strong>${character.species}</h5>
                            <h5 class="card-text"><strong>Estado: </strong>${estado}</h5>
                        </div>
                    </div>
                </div>
            `;

            // Agregar la card al contenedor
            $('#personajes').append(cardHtml);
        });
    }

    //Si hacemos clic en el botón de busqueda
    $('#busqueda').click(function () {
        ocultarSpinner();
        $('#personajes').empty();
        mostrarSpinner(); //Mostramos el icono de cargando
        var pagina = $('#pages').val();

        //HAGO LA PETICION AL SERVIDOR Y GUARDO LA RESPUESTA EN LA VARIABLE PROMISE
        var promise = $.ajax({
            type: 'POST',
            url: '/JSON',

            //Lo que envío (en forma de JSON)
            data: JSON.stringify({ page: pagina }),
            contentType: 'application/json;charset=UTF-8',
            dataType: 'json',
        });

        //TRATAR LA RESPUESTA QUE ME DA EL SERVIDOR
        promise.always(function (data) {
            personajes = data; //Aquí almacenaremos los personajes obtenidos
            guardarBaseDatos("personajes", data);
            mostrarPersonajes(data);
        });
    });

    //Si hacemos clic en aplicar los filtros
    $('#aplicarFiltros').click(function () {
        //Si aún no se ha devuelto la página de los personajes
        if (personajes == null) {
            $('#mensajeError').empty();
            var error = `<h2>Busca una página para aplicar los filtros</h2>`;
            $('#mensajeError').append(error);
        } else {
            //Se mostrarán los personajes filtrados
            aplicarFiltros();
        }
    });

    function guardarBaseDatos(nombreDB, data) {
        //Aquí creamos nuestra base de datos local
        var storeName = nombreDB;
        var request = indexedDB.open("BDPersonajes", 1);

        request.onupgradeneeded = function (event) {
            var db = event.target.result;

            //A este if solo entra si BDPersonajes no existe
            if (!db.objectStoreNames.contains(storeName)) {
                //Creamos el objeto en el que se almacena la información
                var objectStore = db.createObjectStore(storeName, { autoIncrement: true });
            }
        }

        //Si todo va bien
        request.onsuccess = function (event) {
            var db = event.target.result;

            var transaction = db.transaction([storeName], "readwrite");
            var objectStore = transaction.objectStore(storeName);

            // En este bucle es donde almacenamos cada personaje
            data.forEach(function (personaje, index) {
                var request = objectStore.add(personaje);

                request.onsuccess = function (event) {
                    console.log("Personaje guardado exitosamente");
                }

                request.onerror = function (event) {
                    console.error("Error al guardar el personaje", event.target.error);
                }
            });

            //Aquí tratamos los errores. Hacemos la transacción y, si falla, el onsuccess peta. Es decir, o lo hace o no lo hace
            transaction.oncomplete = function () {
                console.log("Todos los personajes fueron guardados exitosamente.")
            }

            transaction.onerror = function () {
                console.log("Se ha producido un error en la transacción", event.target.error)
            }
        };

        //Si sale mal
        request.onerror = function (event) {
            console.error("Error al abrir la base de datos", event.target.error)
        }
    }
});
