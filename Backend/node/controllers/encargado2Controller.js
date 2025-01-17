import encargadoModel from "../models/encargadoModel.js"
import carreraModel from "../models/carreraModel.js"
import estudianteModel from "../models/estudianteModel.js"
import facultadModel from "../models/facultadModel.js"
import postulacionModel from "../models/postulacionModel.js"
import resultadoModel from "../models/resultadoModel.js"
import ramoModel from "../models/ramoModel.js"


encargadoModel.belongsTo(facultadModel, { foreignKey: 'id_facultad' });
estudianteModel.belongsTo(carreraModel, { foreignKey: 'id_carrera' });
carreraModel.hasMany(estudianteModel, { foreignKey: 'id_carrera' });
facultadModel.hasMany(carreraModel, { foreignKey: 'id_facultad' });
carreraModel.belongsTo(facultadModel, { foreignKey: 'id_facultad' });
estudianteModel.hasMany(postulacionModel, { foreignKey: 'rut_estudiante' });
postulacionModel.belongsTo(estudianteModel, { foreignKey: 'rut_estudiante' });
ramoModel.hasMany(postulacionModel, { foreignKey: "id_ramo" });
// CRUD
//MOSTRAR SUS ESTUDIANTES AL ENCARGADO 

export const obtenerEstudiantesPostulaciones = async (req, res) => {
  try {
    const rutEvaluador = req.params.rut_evaluador;
    const evaluador = await encargadoModel.findByPk(rutEvaluador);
    const numfacultad = evaluador.id_facultad;

    const estudiantesConFacultad = await ramoModel.findAll({
      attributes: ['id_ramo', 'nombre_ramo'],
      include: [{
        model: postulacionModel,
        attributes: ['id_postulacion', 'estado_postulacion'],
        where: {
          estado_postulacion: 'pendiente',
        },
        include: [{
          model: estudianteModel,
          attributes: ['rut_estudiante', 'nombres_estudiante', 'apellido1_estudiante', 'horas_ayudantia_estudiante'],
          include: [{
            model: carreraModel,
            attributes: ['id_carrera', 'nombre_carrera'],
            include: [{
              model: facultadModel,
              attributes: ['id_facultad', 'nombre_facultad'],
              where: {
                id_facultad: numfacultad,
              },
            }],
          }],
        }],
      }],
    });

    // Filtrar las postulaciones
    const estudiantesFiltrados = estudiantesConFacultad.map(ramo => ({
      id_ramo: ramo.id_ramo,
      nombre_ramo: ramo.nombre_ramo,
      postulaciones: ramo.postulacions.filter(postulacion => postulacion.estudiante.carrera !== null),
    }));
    const estudiantesConPostulaciones = estudiantesFiltrados.filter(ramo => ramo.postulaciones.length > 0);

    // Agrupar por carrera
    const estudiantesAgrupadosPorCarrera = estudiantesConPostulaciones.reduce((acumulador, ramo) => {
      ramo.postulaciones.forEach(postulacion => {
        const carrera = postulacion.estudiante.carrera;

        if (!acumulador[carrera.nombre_carrera]) {
          acumulador[carrera.nombre_carrera] = [];
        }

        acumulador[carrera.nombre_carrera].push({
          id_carrera: carrera.id_carrera,
          nombre_carrera: carrera.nombre_carrera,
          id_ramo: ramo.id_ramo,
          nombre_ramo: ramo.nombre_ramo,
          id_postulacion: postulacion.id_postulacion,
          estado_postulacion: postulacion.estado_postulacion,
          rut_estudiante: postulacion.estudiante.rut_estudiante,
          nombres_estudiante: postulacion.estudiante.nombres_estudiante,
          apellido1_estudiante: postulacion.estudiante.apellido1_estudiante,
          horas_ayudantia_estudiante: postulacion.estudiante.horas_ayudantia_estudiante,
        });
      });

      return acumulador;
    }, {});

    res.json(estudiantesAgrupadosPorCarrera);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//CREAR RESULTADOS
export const crearResultadosEncargado = async (req, res) =>{
    try {
        await resultadoModel.create(req.body)
        req.body.fecha_postulacion = new Date()
        res.json({ message: '¡Registro creado con éxito!' });

    } catch (error) {
        res.json( {message: error.message} )

    }
}
//actualiza postulacion
export const updatePostulacion = async (req, res) => {
  try {
    let datos = req.body
    console.log(datos)
    if ('id_postulacion' in datos) {
      await postulacionModel.update(req.body, {
        where: { id_postulacion: req.body.id_postulacion },
      });
      if ('rut_estudiante' in datos) {
        await estudianteModel.update(req.body, {
          where: { rut_estudiante: req.body.rut_estudiante },
        });
        res.json({
          message: "¡Registro actualizado con éxito!",
        });
      } else {
        res.json({
          message: "No se encontró el campo 'rut_estudiante' en los datos",
        });
      }
    } else {
      if ('rut_estudiante' in datos) {
        await estudianteModel.update(req.body, {
          where: { rut_estudiante: req.body.rut_estudiante },
        });
        res.json({
          message: "¡Registro actualizado con éxito!",
        });
      } else {
        res.json({
          message: "No se encontró el campo 'id_postulacion' o 'rut_estudiante' en los datos",
        });
      }
    }
  } catch (error) {
    res.json({ message: error.message });
  }
};