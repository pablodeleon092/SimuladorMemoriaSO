export class Proceso {
    constructor(nombre, tiempoArribo, duracion, memoriaRequerida) {
        this.nombre = nombre;
        this.tiempoArribo = tiempoArribo;
        this.duracion = duracion;
        this.memoriaRequerida = memoriaRequerida;

        this.tiempoInicio = null;
        this.tiempoAsignacion = null;
        this.tiempoFinalizacion = null;
        this.asignado = false;
        this.completado = false;
        this.enCola = false;
    }

    getTiempoRetorno() {
        if (this.tiempoFinalizacion !== null) {
            return this.tiempoFinalizacion - this.tiempoArribo;
        }
        return null;
    }

    getTiempoEspera() {
        if (this.tiempoInicio !== null) {
            return this.tiempoInicio - this.tiempoArribo;
        }
        return null;
    }

    toString() {
        return `Proceso ${this.nombre}: Arribo=${this.tiempoArribo}, Duración=${this.duracion}, Memoria=${this.memoriaRequerida}KB`;
    }
}