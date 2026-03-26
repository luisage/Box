-- CreateTable
CREATE TABLE "Novedades" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "vigencia" TEXT,
    "estatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Novedades_pkey" PRIMARY KEY ("id")
);
