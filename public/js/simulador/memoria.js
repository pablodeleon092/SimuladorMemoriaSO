import { Particion } from './particion.js';

export class Memoria {
    constructor(memoriaTotal, memoriaOS, algoritmo) {
        this.memoriaTotal = memoriaTotal;
        this.memoriaOS = memoriaOS;
        this.algoritmo = algoritmo;
        this.memoriaDisponible = memoriaTotal - memoriaOS;
        
        // Inicializar con una partición libre que ocupa toda la memoria disponible
        this.particiones = [
            new Particion(memoriaOS, this.memoriaDisponible)
        ];
    }

    obtenerMemoriaLibreTotal() {
        return this.particiones
            .filter(p => p.libre)
            .reduce((sum, p) => sum + p.tamano, 0);
    }

    obtenerMemoriaOcupada() {
        return this.memoriaDisponible - this.obtenerMemoriaLibreTotal();
    }

    obtenerNumeroParticionesLibres() {
        return this.particiones.filter(p => p.libre).length;
    }

    obtenerNumeroParticionesOcupadas() {
        return this.particiones.filter(p => !p.libre).length;
    }

    obtenerMayorParticionLibre() {
        const libres = this.particiones.filter(p => p.libre);
        if (libres.length === 0) return 0;
        return Math.max(...libres.map(p => p.tamano));
    }

    obtenerEstadisticas() {
        return {
            memoriaTotal: this.memoriaTotal,
            memoriaOS: this.memoriaOS,
            memoriaDisponible: this.memoriaDisponible,
            memoriaLibre: this.obtenerMemoriaLibreTotal(),
            memoriaOcupada: this.obtenerMemoriaOcupada(),
            particionesLibres: this.obtenerNumeroParticionesLibres(),
            particionesOcupadas: this.obtenerNumeroParticionesOcupadas(),
            mayorParticionLibre: this.obtenerMayorParticionLibre()
        };
    }

    toString() {
        let resultado = `Memoria Total: ${this.memoriaTotal}KB\n`;
        resultado += `Memoria SO: ${this.memoriaOS}KB\n`;
        resultado += `Memoria Disponible: ${this.memoriaDisponible}KB\n`;
        resultado += `Algoritmo: ${this.algoritmo}\n\n`;
        resultado += 'Particiones:\n';
        
        this.particiones.forEach((particion, idx) => {
            resultado += `  ${idx + 1}. ${particion.toString()}\n`;
        });
        
        return resultado;
    }
}