export const getConsultores = () => {
  const data = localStorage.getItem("consultores");
  if (data) return JSON.parse(data);
  const iniciales = [
  {
    id: "1012345678",
    nombre: "Julie Sáenz",
    cedula: "1012345678",
    email: "julie.saenz@example.com",
    celular: "3001112233",
    direccion: "Calle 1 # 2-3",
    especialidad: "Finanzas corporativas",
    consecutivoOAMP: "001-2025-0023",
    fechaFirmaOAMP: "09/04/2025",
    assignedEvents: [] // ✅ importante
  },
  {
    id: "1098765432",
    nombre: "Andreína Ustate",
    cedula: "1098765432",
    email: "andreina.ustate@example.com",
    celular: "3104445566",
    direccion: "Avenida 4 # 5-6",
    especialidad: "Innovación y emprendimiento",
    consecutivoOAMP: "001-2025-0051",
    fechaFirmaOAMP: "09/03/2025",
    assignedEvents: [] // ✅ importante
  },
  {
    id: "1122334455",
    nombre: "Carlos Rojas",
    cedula: "1122334455",
    email: "carlos.rojas@example.com",
    celular: "3207778899",
    direccion: "Carrera 7 # 8-9",
    especialidad: "Marketing y ventas",
    consecutivoOAMP: "001-2025-0025",
    fechaFirmaOAMP: "09/05/2025",
    assignedEvents: [] // ✅ importante
  }
];
  localStorage.setItem("consultores", JSON.stringify(iniciales));
  return iniciales;
};

export const saveConsultores = (consultores) => {
  localStorage.setItem("consultores", JSON.stringify(consultores));
};
