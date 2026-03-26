-- CreateTable
CREATE TABLE "videos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT,
    "descripcion" TEXT,
    "url" TEXT NOT NULL,
    "estatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);
