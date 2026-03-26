-- CreateTable
CREATE TABLE "imagenCarrusel" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT,
    "url" TEXT NOT NULL,
    "estatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "imagenCarrusel_pkey" PRIMARY KEY ("id")
);
