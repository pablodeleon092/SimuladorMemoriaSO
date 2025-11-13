# Simulador de Gestión de Memoria Dinámica 

El presente proyecto web interactivo que simula y visualiza algoritmos clásicos de asignación de memoria dinámica (Particiones Variables). Permite a los usuarios cargar una lista de procesos, configurar los parámetros de la simulación y ver en tiempo real cómo se gestiona la memoria.

El desarrollo se encuentra enmarcado en trabajo práctico integrador para la cátedra sistemas operativos.



## Características Principales

* **Algoritmos de Asignación:** Soporta los cuatro algoritmos principales:
    * First-Fit (Primer Ajuste)
    * Next-Fit (Siguiente Ajuste)
    * Best-Fit (Mejor Ajuste)
    * Worst-Fit (Peor Ajuste)
* **Configuración Flexible:** Permite definir el tamaño total de la memoria, el espacio reservado para el Sistema Operativo y los tiempos de simulación (carga, selección, liberación).
* **Carga de Procesos:** Admite la carga de una lista de procesos desde un archivo `.json`.
* **Visualización en Tiempo Real:** Utiliza **Plotly.js** para generar un gráfico interactivo que muestra el estado de la memoria a lo largo del tiempo.
* **Métricas Clave:** Calcula y muestra resultados importantes de la simulación:
    * Tiempo Medio de Retorno
    * Índice de Fragmentación Externa
    * Tiempo Total de Simulación
* **Log de Eventos:** Proporciona un registro detallado (paso a paso) de cada evento de la simulación, con la opción de descargar el log como `.txt`.

---

## Demo en Vivo

EL proyecto Web se puede probar desde la siguiente dirección:

[https://sensational-manatee-74720e.netlify.app/]

## Uso Local

Se puede ejecutar el proyecto localmente.
Requisitos: 
-Tener instalado nodejs en el equipo: https://nodejs.org/es

1.  Clonar este repositorio:
    ```bash
    git clone [https://github.com/pablodeleon092/SimuladorMemoriaSO.git]
    ```
2.  Navega a la carpeta del proyecto:
    ```bash
    cd SimuladorMemoriaSO
    ```
3.  Instalar los modulos necesarios
   
   ```bash
     npm install
    ```
4. iniciar servidor
  ```bash
    node index.js
  ```

---

## Tecnologías Utilizadas

* **HTML5:** Estructura de la página.
* **Tailwind CSS:** (vía CDN) Para el diseño de la interfaz de usuario.
* **JavaScript (ES6 Modules):** Lógica principal de la simulación, separada en módulos (`simulador.js`, `memoria.js`, `particion.js`, `proceso.js`).
* **Node.js:** Se encarga de generar el servidor intérprete.
* **Plotly.js:** (vía CDN) Para la generación de los gráficos.

---

## Formato del JSON de Procesos

Para cargar los procesos, el simulador espera un archivo `.json` con un array de objetos. Cada objeto debe tener la siguiente estructura:

```json
[
  {
    "nombre": "P1",
    "tiempo_arribo": 0,
    "duracion": 8,
    "memoria_requerida": 200
  },
  {
    "nombre": "P2",
    "tiempo_arribo": 1,
    "duracion": 4,
    "memoria_requerida": 95
  },
  {
    "nombre": "P3",
    "tiempo_arribo": 2,
    "duracion": 5,
    "memoria_requerida": 150
  }
]

