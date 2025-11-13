export class Particion {
    constructor(direccionInicio, tamano) {
        this.direccionInicio = direccionInicio;
        this.tamano = tamano;
        this.libre = true;
        this.procesoAsignado = null;
        this.tiempoAsignacion = null;
    }

    asignarProceso(proceso, tiempoInicioReal) {
        if (proceso) {
            this.libre = false;
            this.procesoAsignado = proceso;
            this.tiempoAsignacion = tiempoInicioReal;
        }
    }

    liberarProceso() {
        this.libre = true;
        this.procesoAsignado = null;
        this.tiempoAsignacion = null;
    }

    get direccionFin() {
        return this.direccionInicio + this.tamano;
    }

    puedeAlmacenar(memoriaRequerida) {
        return this.libre && this.tamano >= memoriaRequerida;
    }

    toString() {
        const estado = this.libre ? 'Libre' : `Ocupada por ${this.procesoAsignado.nombre}`;
        return `Partición [${this.direccionInicio}-${this.direccionFin}KB]: ${estado}`;
    }
}