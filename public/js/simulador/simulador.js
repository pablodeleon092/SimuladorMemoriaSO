import { Proceso } from './Proceso.js';
import { Particion } from './Particion.js';
import { Memoria } from './Memoria.js';

export class Simulador {
    constructor(config, procesos) {
        this.config = config;
        this.procesos = procesos.map(p => new Proceso(
            p.nombre,
            p.tiempo_arribo,
            p.duracion,
            p.memoria_requerida
        ));
        
        this.memoria = new Memoria(
            config.memoriaTotal,
            config.memoriaOS,
            config.algoritmo
        );
        
        this.tiempoActual = 0;
        this.log = [];
        this.procesosCompletados = [];
        this.colaProcesos = [];
        this.ultimaPosicionNextFit = 0;
        this.asignacionesCompletadas = [];
        this.procesosEnCarga = [];
        this.proximoTiempoAsignadorLibre = 0;

        
        this.historialEstados = [];
    }

    
    guardarEstadoSiCambia() {
        const estadoActual = {
            tiempo: this.tiempoActual,
            particiones: this.memoria.particiones.map(p => ({
                tamano: p.tamano,
                libre: p.libre,
            }))
        };
        
        const ultimoEstado = this.historialEstados[this.historialEstados.length - 1];
        
        if (ultimoEstado) {
            if (ultimoEstado.particiones.length === estadoActual.particiones.length) {
                const sonIguales = ultimoEstado.particiones.every((p, i) => 
                    p.tamano === estadoActual.particiones[i].tamano &&
                    p.libre === estadoActual.particiones[i].libre
                );
                if (sonIguales) return;
            }
        }
        
        this.historialEstados.push(estadoActual);
    }

    ejecutar() {
        this.log.push('_'.repeat(50));
        this.log.push('INICIO DE SIMULACIÓN');
        this.log.push(`Algoritmo: ${this.config.algoritmo.toUpperCase()}`);
        this.log.push(`Memoria Total: ${this.config.memoriaTotal} KB`);
        this.log.push(`Memoria Disponible: ${this.config.memoriaTotal - this.config.memoriaOS} KB`);
        this.log.push('_'.repeat(50));
        this.log.push('');

        this.procesos.sort((a, b) => a.tiempoArribo - b.tiempoArribo);
        this.guardarEstadoSiCambia(); 

        const tiempoMaxArribo = Math.max(...this.procesos.map(p => p.tiempoArribo));
        const duracionTotal = this.procesos.reduce((sum, p) => sum + p.duracion, 0);
        const cargaTotal = this.procesos.length * (this.config.tiempoCarga + this.config.tiempoSeleccion + this.config.tiempoLiberacion);
        const tiempoFinal = tiempoMaxArribo + duracionTotal + cargaTotal + 50;

        for (this.tiempoActual = 0; this.tiempoActual <= tiempoFinal; this.tiempoActual++) {
            this.verificarNuevosProcesos();
            this.actualizarProcesosEnEjecucion();
            this.intentarAsignarProceso();
            this.finalizarCargaDeProcesos();
            

            if (this.procesosCompletados.length === this.procesos.length && this.procesosEnCarga.length === 0) {
                this.guardarEstadoSiCambia(); 
                break;
            }
        }

        this.log.push('');
        this.log.push('_'.repeat(50));
        this.log.push('FIN DE SIMULACIÓN');
        this.log.push('_'.repeat(50));
    }
    
    verificarNuevosProcesos() {
      
        for (const proceso of this.procesos) {
            if (proceso.tiempoArribo === this.tiempoActual && !proceso.enCola && !proceso.asignado) {
                this.colaProcesos.push(proceso);
                proceso.enCola = true;
                this.log.push(`[t=${this.tiempoActual}] Proceso ${proceso.nombre} llega al sistema.`);
            }
        }
    }

    intentarAsignarProceso() {
        
        this.colaProcesos.sort((a, b) => a.tiempoArribo - b.tiempoArribo || a.nombre.localeCompare(b.nombre));
        if (this.tiempoActual < this.proximoTiempoAsignadorLibre) return;
        if (this.colaProcesos.length === 0) return;

        const proceso = this.colaProcesos[0];
        const particionReservada = this.buscarParticion(proceso);

        if (particionReservada) {
            this.colaProcesos.shift();
            
            const tiempoDecision = this.tiempoActual;
            const tiempoSeleccion = this.config.tiempoSeleccion;
            const tiempoCarga = this.config.tiempoCarga;

            this.proximoTiempoAsignadorLibre = tiempoDecision + tiempoSeleccion + tiempoCarga;
            proceso.tiempoInicio = this.proximoTiempoAsignadorLibre;
            proceso.tiempoFinalizacion = proceso.tiempoInicio + proceso.duracion + this.config.tiempoLiberacion;
            
            particionReservada.asignarProceso(proceso, this.tiempoActual);
            this.procesosEnCarga.push(proceso);
            
            this.guardarEstadoSiCambia(); 

            this.log.push(`[t=${tiempoDecision}] Proceso ${proceso.nombre} seleccionado. Reservando espacio en ${particionReservada.direccionInicio} KB.`);
            this.log.push(`  - La carga finalizará y el proceso aparecerá en t=${proceso.tiempoInicio}.`);
        }
    }
    
    finalizarCargaDeProcesos() {
        
        const procesosListos = this.procesosEnCarga.filter(p => this.tiempoActual >= p.tiempoInicio);
        if (procesosListos.length === 0) return;

        for (const proceso of procesosListos) {
            proceso.asignado = true;
            const particionAsignada = this.memoria.particiones.find(p => p.procesoAsignado === proceso);
            this.asignacionesCompletadas.push({
                nombre: proceso.nombre,
                direccionInicio: particionAsignada.direccionInicio,
                tamano: proceso.memoriaRequerida, 
                tiempoInicio: proceso.tiempoInicio,
                tiempoFinalizacion: proceso.tiempoFinalizacion
            });
            this.log.push(`[t=${proceso.tiempoInicio}] Proceso ${proceso.nombre} cargado en memoria.`);
        }
        this.procesosEnCarga = this.procesosEnCarga.filter(p => !procesosListos.includes(p));
    }

    buscarParticion(proceso) {
        
        this.memoria.particiones.sort((a, b) => a.direccionInicio - b.direccionInicio);
        switch (this.config.algoritmo) {
            case 'first-fit': return this.firstFit(proceso);
            case 'next-fit': return this.nextFit(proceso);
            case 'best-fit': return this.bestFit(proceso);
            case 'worst-fit': return this.worstFit(proceso);
            default: return this.firstFit(proceso);
        }
    }

    firstFit(proceso) {
       
        const particionesLibres = this.memoria.particiones.filter(p => p.libre);
        for (const particion of particionesLibres) {
            if (particion.tamano >= proceso.memoriaRequerida) {
                return this.dividirParticion(particion, proceso.memoriaRequerida);
            }
        }
        return null;
    }

    nextFit(proceso) {
       
        const n = this.memoria.particiones.length;
        for (let i = 0; i < n; i++) {
            const idx = (this.ultimaPosicionNextFit + i) % n;
            const particion = this.memoria.particiones[idx];
            if (particion.libre && particion.tamano >= proceso.memoriaRequerida) {
                const particionAsignada = this.dividirParticion(particion, proceso.memoriaRequerida);
                const newIdx = this.memoria.particiones.indexOf(particionAsignada);
                this.ultimaPosicionNextFit = (newIdx + 1) % this.memoria.particiones.length;
                return particionAsignada;
            }
        }
        return null;
    }

    bestFit(proceso) {
       
        const particionesLibres = this.memoria.particiones.filter(p => p.libre);
        const candidatas = particionesLibres.filter(p => p.tamano >= proceso.memoriaRequerida);
        if (candidatas.length === 0) return null;
        candidatas.sort((a, b) => a.tamano - b.tamano);
        return this.dividirParticion(candidatas[0], proceso.memoriaRequerida);
    }

    worstFit(proceso) {
     
        const particionesLibres = this.memoria.particiones.filter(p => p.libre);
        const candidatas = particionesLibres.filter(p => p.tamano >= proceso.memoriaRequerida);
        if (candidatas.length === 0) return null;
        candidatas.sort((a, b) => b.tamano - a.tamano);
        return this.dividirParticion(candidatas[0], proceso.memoriaRequerida);
    }
    
    dividirParticion(particionOriginal, tamanoNecesario) {
      
        const idx = this.memoria.particiones.indexOf(particionOriginal);
        if (idx === -1) return null;
        if (particionOriginal.tamano === tamanoNecesario) return particionOriginal;
        const particionParaProceso = new Particion(particionOriginal.direccionInicio, tamanoNecesario);
        const particionSobrante = new Particion(
            particionOriginal.direccionInicio + tamanoNecesario,
            particionOriginal.tamano - tamanoNecesario
        );
        this.memoria.particiones.splice(idx, 1, particionParaProceso, particionSobrante);
        return particionParaProceso;
    }

    actualizarProcesosEnEjecucion() {
       
        let liberados = 0;
        for (const particion of [...this.memoria.particiones]) {
            const proceso = particion.procesoAsignado;
            if (proceso && !this.procesosEnCarga.includes(proceso) && this.tiempoActual >= proceso.tiempoFinalizacion) {
                particion.liberarProceso();
                proceso.completado = true;
                this.procesosCompletados.push(proceso);
                this.log.push(`[t=${this.tiempoActual}] Proceso ${proceso.nombre} ha finalizado.`);
                liberados++;
            }
        }
        if (liberados > 0) {
            this.fusionarParticionesLibres();
            this.guardarEstadoSiCambia();
        }
    }

    fusionarParticionesLibres() {
     
        this.memoria.particiones.sort((a, b) => a.direccionInicio - b.direccionInicio);
        let i = 0;
        while (i < this.memoria.particiones.length - 1) {
            const p1 = this.memoria.particiones[i];
            const p2 = this.memoria.particiones[i+1];
            if (p1.libre && p2.libre) {
                p1.tamano += p2.tamano;
                this.memoria.particiones.splice(i + 1, 1);
            } else {
                i++;
            }
        }
    }

   
    calcularFragmentacionExterna(tiempoLimite) {
        let areaLibreTotal = 0;
        if (this.historialEstados.length < 1 || tiempoLimite === 0) {
            return 0;
        }

        for (let i = 0; i < this.historialEstados.length; i++) {
            const estadoActual = this.historialEstados[i];

            if (estadoActual.tiempo >= tiempoLimite) {
                break;
            }

            const estadoSiguiente = this.historialEstados[i + 1];
            const tiempoFinIntervalo = estadoSiguiente ? Math.min(estadoSiguiente.tiempo, tiempoLimite) : tiempoLimite;
            
            const duracion = tiempoFinIntervalo - estadoActual.tiempo;
            if (duracion <= 0) continue;

           
            const memoriaLibreEnEsteEstado = estadoActual.particiones
                .filter(p => p.libre)
                .reduce((sum, p) => sum + p.tamano, 0);
            
            areaLibreTotal += memoriaLibreEnEsteEstado * duracion;
        }
        return areaLibreTotal;
    }

    obtenerResultados() {
      
        const tiemposRetorno = this.procesosCompletados.map(p => p.tiempoFinalizacion - p.tiempoArribo);
        const tiempoMedioRetorno = tiemposRetorno.length > 0 ? tiemposRetorno.reduce((a, b) => a + b, 0) / tiemposRetorno.length : 0;
        
        let tiempoUltimaCarga = 0;
        if (this.asignacionesCompletadas.length > 0) {
            tiempoUltimaCarga = Math.max(...this.asignacionesCompletadas.map(a => a.tiempoInicio));
        }
        
        const fragmentacionExterna = this.calcularFragmentacionExterna(tiempoUltimaCarga);
        
        let tiempoTotalSimulacion = 0;
        if (this.procesosCompletados.length > 0) {
            tiempoTotalSimulacion = Math.max(...this.procesosCompletados.map(p => p.tiempoFinalizacion));
        }

        const tiemposPorProceso = this.procesosCompletados.map(p => ({
            nombre: p.nombre,
            tiempoArribo: p.tiempoArribo,
            tiempoFin: p.tiempoFinalizacion,
            tiempoRetorno: p.tiempoFinalizacion - p.tiempoArribo,
            memoria: p.memoriaRequerida
        }));

        return {
            tiempoMedioRetorno,
            indiceFragmentacion: fragmentacionExterna,
            procesosCompletados: this.procesosCompletados.length,
            tiempoTotalSimulacion: tiempoTotalSimulacion,
            tiemposPorProceso,
            log: this.log,
            asignaciones: this.asignacionesCompletadas
        };
    }
}