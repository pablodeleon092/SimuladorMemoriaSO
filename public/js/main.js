import { Simulador } from './simulador/simulador.js';

let simulador = null;


const archivoJSON = document.getElementById('archivoJSON');
const btnSimular = document.getElementById('btnSimular');
const btnDescargarLog = document.getElementById('btnDescargarLog');
const resultadosContainer = document.getElementById('resultadosContainer');
const algoritmoSelect = document.getElementById('algoritmo');


btnSimular.addEventListener('click', ejecutarSimulacion);
btnDescargarLog.addEventListener('click', descargarLog);
algoritmoSelect.addEventListener('change', limpiarResultados);

async function ejecutarSimulacion() {
    try {
        if (!archivoJSON.files || archivoJSON.files.length === 0) {
            alert('Por favor, selecciona un archivo JSON con los procesos.');
            return;
        }

        const archivo = archivoJSON.files[0];
        const contenido = await leerArchivoJSON(archivo);
        
        if (!validarJSON(contenido)) {
            alert('El archivo JSON no tiene el formato correcto.');
            return;
        }

        const config = {
            memoriaTotal: parseInt(document.getElementById('memoriaTotal').value),
            memoriaOS: parseInt(document.getElementById('memoriaOS').value),
            algoritmo: document.getElementById('algoritmo').value,
            tiempoCarga: parseInt(document.getElementById('tiempoCarga').value),
            tiempoSeleccion: parseInt(document.getElementById('tiempoSeleccion').value),
            tiempoLiberacion: parseInt(document.getElementById('tiempoLiberacion').value)
        };

        if (!validarConfiguracion(config)) {
            alert('Por favor, verifica que todos los parámetros sean válidos.');
            return;
        }

        btnSimular.disabled = true;
        btnSimular.textContent = 'Simulando...';

        simulador = new Simulador(config, contenido);
        simulador.ejecutar();

        mostrarResultados();
        resultadosContainer.classList.remove('hidden');

        btnSimular.disabled = false;
        btnSimular.textContent = 'Simular';

    } catch (error) {
        console.error('Error durante la simulación:', error);
        alert('Ocurrió un error durante la simulación: ' + error.message);
        btnSimular.disabled = false;
        btnSimular.textContent = 'Simular';
    }
}

function leerArchivoJSON(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try { resolve(JSON.parse(e.target.result)); }
            catch (error) { reject(new Error('El archivo no contiene JSON válido.')); }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsText(archivo);
    });
}

function validarJSON(datos) {
    if (!Array.isArray(datos) || datos.length === 0) return false;
    for (const proceso of datos) {
        if (!proceso.nombre || typeof proceso.tiempo_arribo !== 'number' ||
            typeof proceso.duracion !== 'number' || typeof proceso.memoria_requerida !== 'number') {
            return false;
        }
    }
    return true;
}

function validarConfiguracion(config) {
    return config.memoriaTotal > 0 && config.memoriaOS >= 0 &&
           config.memoriaOS < config.memoriaTotal && config.tiempoCarga >= 0 &&
           config.tiempoSeleccion >= 0 && config.tiempoLiberacion >= 0;
}

function mostrarResultados() {
    const resultados = simulador.obtenerResultados();
    
    document.getElementById('tiempoMedioRetorno').textContent = 
        resultados.tiempoMedioRetorno.toFixed(2);
    
    document.getElementById('indiceFragmentacion').textContent = 
        resultados.indiceFragmentacion.toFixed(0) ;

   
    document.getElementById('tiempoTotalSimulacion').textContent = 
        resultados.tiempoTotalSimulacion.toFixed(0);
   

    actualizarTablaTiempos(resultados.tiemposPorProceso);
    actualizarLog(resultados.log);
    crearGraficoMemoria(resultados.asignaciones);
}

function actualizarTablaTiempos(tiempos) {
    const tbody = document.getElementById('tablaTiempos');
    tbody.innerHTML = '';
    tiempos.forEach(tiempo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${tiempo.nombre}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tiempo.tiempoArribo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tiempo.tiempoFin}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${tiempo.tiempoRetorno}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tiempo.memoria}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarLog(log) {
    const logContainer = document.getElementById('logEventos');
    logContainer.innerHTML = '';
    log.forEach(entrada => {
        const div = document.createElement('div');
        div.className = 'mb-1';
        div.textContent = entrada;
        logContainer.appendChild(div);
    });
}

function descargarLog() {
    if (!simulador) {
        alert('No hay simulación para descargar.');
        return;
    }
    const resultados = simulador.obtenerResultados();
    const log = resultados.log.join('\n');
    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_simulacion_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function limpiarResultados() {
    if (!resultadosContainer.classList.contains('hidden')) {
        resultadosContainer.classList.add('hidden');
        document.getElementById('tiempoMedioRetorno').textContent = '-';
        document.getElementById('indiceFragmentacion').textContent = '-';
        
        document.getElementById('tiempoTotalSimulacion').textContent = '-';
        
        document.getElementById('tablaTiempos').innerHTML = '';
        document.getElementById('logEventos').innerHTML = '';
        Plotly.purge('graficoMemoria');
        simulador = null;
    }
}

function crearGraficoMemoria(asignaciones) {
    const divGrafico = document.getElementById('graficoMemoria');
    const memoriaTotal = parseInt(document.getElementById('memoriaTotal').value);
    const memoriaOS = parseInt(document.getElementById('memoriaOS').value);
    const procesosUnicos = [...new Set(asignaciones.map(a => a.nombre))];
    const colores = generarColoresProcesos(procesosUnicos);
    const traces = [];
    
    for (const asignacion of asignaciones) {
        const { nombre, direccionInicio, tamano, tiempoInicio, tiempoFinalizacion } = asignacion;
        const direccionFin = direccionInicio + tamano;
        const tiempos = [tiempoInicio, tiempoFinalizacion, tiempoFinalizacion, tiempoInicio, tiempoInicio];
        const memorias = [direccionInicio, direccionInicio, direccionFin, direccionFin, direccionInicio];
        traces.push({
            x: tiempos,
            y: memorias,
            fill: 'toself',
            fillcolor: colores[nombre],
            line: { color: 'black', width: 1 },
            mode: 'lines',
            name: nombre,
            hovertemplate: `<b>${nombre}</b><br>Tiempo: ${tiempoInicio} - ${tiempoFinalizacion}<br>Memoria: ${direccionInicio}K - ${direccionFin}K<br>Tamaño: ${tamano}K<extra></extra>`,
            showlegend: true,
            legendgroup: nombre
        });
    }

    if (memoriaOS > 0) {
        const maxTiempo = asignaciones.length > 0 ? Math.max(...asignaciones.map(a => a.tiempoFinalizacion)) : 20;
        traces.push({
            x: [0, maxTiempo, maxTiempo, 0, 0],
            y: [0, 0, memoriaOS, memoriaOS, 0],
            fill: 'toself',
            fillcolor: 'rgba(128, 128, 128, 0.3)',
            line: { color: 'black', width: 1 },
            mode: 'lines',
            name: 'S.O.',
            hovertemplate: `<b>Sistema Operativo</b><br>Memoria: ${memoriaOS}K<extra></extra>`,
            showlegend: true
        });
    }

    const layout = {
        title: { text: 'Visualización de la Memoria', font: { size: 20, weight: 'bold' } },
        autosize: true,
        xaxis: { title: 'Tiempo', gridcolor: '#e0e0e0', tickangle: 0, dtick: 1 },
        yaxis: { title: 'Memoria (K)', gridcolor: '#e0e0e0', range: [0, memoriaTotal] },
        hovermode: 'closest',
        showlegend: true,
        legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 },
        margin: { l: 70, r: 30, t: 100, b: 60 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
    };

    Plotly.newPlot(divGrafico, traces, layout, config);
}

function generarColoresProcesos(procesos) {
    const coloresBase = [
        'rgba(255, 179, 102, 0.7)', 'rgba(255, 179, 179, 0.7)', 'rgba(128, 179, 179, 0.7)',
        'rgba(255, 153, 153, 0.7)', 'rgba(255, 128, 153, 0.7)', 'rgba(153, 204, 255, 0.7)',
        'rgba(255, 204, 153, 0.7)', 'rgba(153, 221, 102, 0.7)', 'rgba(204, 153, 255, 0.7)',
        'rgba(255, 204, 102, 0.7)', 'rgba(153, 255, 204, 0.7)', 'rgba(255, 153, 204, 0.7)'
    ];
    const coloresMap = {};
    const procesosOrdenados = procesos.sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
    procesosOrdenados.forEach((proceso, index) => {
        coloresMap[proceso] = coloresBase[index % coloresBase.length];
    });
    return coloresMap;
}