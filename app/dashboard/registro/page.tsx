import RegistroForm from '@/app/dashboard/registro/RegistroForm'

export default function RegistroPage() {
  return (
    <div className="max-w-2xl">

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Registro de Alumno</h1>
        <p className="text-gray-500 text-sm mt-1">Completa los datos para registrar un nuevo alumno.</p>
      </div>

      {/* Tarjeta del formulario */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
        <RegistroForm />
      </div>

    </div>
  )
}
