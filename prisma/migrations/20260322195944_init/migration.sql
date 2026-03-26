-- CreateEnum
CREATE TYPE "Nivel" AS ENUM ('PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO', 'COMPETIDOR');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MANANA', 'TARDE', 'NOCHE');

-- CreateEnum
CREATE TYPE "EstadoAlumno" AS ENUM ('ACTIVO', 'INACTIVO', 'BAJA');

-- CreateEnum
CREATE TYPE "CategoriaPeso" AS ENUM ('MINIMOSMO', 'MOSCA', 'SUPERMOSCA', 'GALLO', 'SUPERGALLO', 'PLUMA', 'SUPERPLUMA', 'LIGERO', 'SUPERLIGERO', 'WELTER', 'SUPERWELTER', 'MEDIANO', 'SUPERMEDIANO', 'SEMIPESADO', 'CRUCERO', 'PESADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PAGADO', 'ABONO', 'PENDIENTE', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoResena" AS ENUM ('VISIBLE', 'OCULTA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "ResultadoCombate" AS ENUM ('VICTORIA', 'DERROTA', 'EMPATE', 'NO_CONTEST');

-- CreateTable
CREATE TABLE "alumnos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "telefono" VARCHAR(20),
    "foto_url" VARCHAR(500),
    "nivel" "Nivel" NOT NULL DEFAULT 'PRINCIPIANTE',
    "pesoKg" INTEGER,
    "categoria_peso" "CategoriaPeso",
    "turno" "Turno" NOT NULL DEFAULT 'TARDE',
    "estado" "EstadoAlumno" NOT NULL DEFAULT 'ACTIVO',
    "fecha_inscripcion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mensualidad" DECIMAL(8,2) NOT NULL,
    "dia_limite_pago" INTEGER NOT NULL DEFAULT 5,
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "fecha_pago" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" INTEGER NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',
    "mes_correspondiente" VARCHAR(7) NOT NULL,
    "estado_pago" "EstadoPago" NOT NULL DEFAULT 'PAGADO',
    "notas" TEXT,
    "registrado_por" VARCHAR(100),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hora_entrada" TIME NOT NULL,
    "hora_salida" TIME,
    "observacion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progreso_fisico" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "fecha_medicion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peso_kg" DECIMAL(5,2),
    "talla_cm" DECIMAL(5,2),
    "porcentaje_grasa" DECIMAL(4,2),
    "imc" DECIMAL(4,2),
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progreso_fisico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combates" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "rival" VARCHAR(150) NOT NULL,
    "resultado" "ResultadoCombate" NOT NULL,
    "categoria" VARCHAR(50),
    "evento" VARCHAR(200),
    "lugar" VARCHAR(200),
    "rounds" INTEGER,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resenas" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "estado" "EstadoResena" NOT NULL DEFAULT 'PENDIENTE',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resenas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pagos_alumno_id_idx" ON "pagos"("alumno_id");

-- CreateIndex
CREATE INDEX "pagos_mes_correspondiente_idx" ON "pagos"("mes_correspondiente");

-- CreateIndex
CREATE INDEX "pagos_estado_pago_idx" ON "pagos"("estado_pago");

-- CreateIndex
CREATE INDEX "asistencias_alumno_id_idx" ON "asistencias"("alumno_id");

-- CreateIndex
CREATE INDEX "asistencias_fecha_idx" ON "asistencias"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_alumno_id_fecha_key" ON "asistencias"("alumno_id", "fecha");

-- CreateIndex
CREATE INDEX "progreso_fisico_alumno_id_idx" ON "progreso_fisico"("alumno_id");

-- CreateIndex
CREATE INDEX "progreso_fisico_fecha_medicion_idx" ON "progreso_fisico"("fecha_medicion");

-- CreateIndex
CREATE INDEX "combates_alumno_id_idx" ON "combates"("alumno_id");

-- CreateIndex
CREATE INDEX "combates_fecha_idx" ON "combates"("fecha");

-- CreateIndex
CREATE INDEX "resenas_estado_idx" ON "resenas"("estado");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progreso_fisico" ADD CONSTRAINT "progreso_fisico_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combates" ADD CONSTRAINT "combates_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
