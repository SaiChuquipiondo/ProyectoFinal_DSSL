export interface Proyecto {
  id_proyecto: number;
  titulo: string;
  descripcion: string;
  id_estudiante: number;
  id_asesor?: number;
  estado_proyecto: string;
  estado_asesor?: string;
  ruta_archivo: string;
  fecha_subida: Date;
}

export interface Borrador {
  id_borrador: number;
  id_proyecto: number;
  numero_iteracion: number;
  estado: string;
  ruta_archivo: string;
  fecha_subida: Date;
}

export interface Tesis {
  id_tesis: number;
  id_proyecto: number;
  estado: string;
  ruta_archivo: string;
  fecha_subida: Date;
}

export interface Sustentacion {
  id_sustentacion: number;
  id_proyecto: number;
  fecha_hora: Date;
  modalidad: string;
  lugar?: string;
  estado: string;
  nota?: number;
  dictamen?: string;
  observaciones?: string;
}
