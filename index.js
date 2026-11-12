import mysql from "mysql2/promise"
import { stdin, stdout } from "node:process"
import readline from "node:readline/promises"

// un pool genera un permiso de conexión a la db
const pool = mysql.createPool({
  host: "localhost",
  user: "gabriel",
  password: "pepe123",
  database: "db_film_utn",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const rl = readline.createInterface({
  input: stdin,
  output: stdout
})

const crearTabla = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS peliculas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      anio INT NOT NULL,
      genero VARCHAR(50) NOT NULL
    )
  `)
  console.log("Tabla peliculas lista")
}

const registrarPelicula = async () => {
  console.log("\n===== AGREGAR PELICULA =====");
  const titulo = await rl.question("Titulo: ")
  const anioTexto = await rl.question("Año: ")
  const genero = await rl.question("Género: ")

  if (
    titulo.trim() === "" ||
    genero.trim() === "" ||
    !Number.isInteger(+anioTexto)
  ) {
    console.log("Error: los datos ingresados no son validos.")
    return
  }

  const [result] = await pool.execute(`
    INSERT INTO peliculas (titulo, anio, genero) VALUES (?,?,?)
  `, [titulo, +anioTexto, genero])

  console.log(`Pelicula agregada correctamente. ID: ${result.insertId}`)
}

const mostrarPeliculas = async () => {
  console.log("\n===== LISTA DE PELICULAS =====");

  const [rows] = await pool.execute(
    "SELECT * FROM peliculas ORDER BY titulo")

  if (rows.length === 0) {
    console.log("No hay peliculas cargadas.")
    return
  }

  console.table(rows)
}

const actualizarPelicula = async () => {
  console.log("===== MODIFICAR PELICULA =====")
  const id = await rl.question("ID de la pelicula a actualizar: ")

  const [rows] = await pool.execute("SELECT * FROM peliculas WHERE id = ?", [id]
  )

  const peliculaAModificar = rows[0]

  if (!peliculaAModificar) {
    console.log("No se encontró la pelicula")
    return
  }

  console.log("Datos actuales:")
  console.table([peliculaAModificar])

  const titulo = await rl.question("Titulo nuevo: ")
  const anioTexto = await rl.question("Año nuevo: ")
  const genero = await rl.question("Género nuevo: ")

  const [result] = await pool.execute(
    `
    UPDATE peliculas
    SET titulo = ?, anio = ?, genero = ?
    WHERE id = ?
    `, [titulo, +anioTexto, genero, id]
  )

  if (result.affectedRows > 0) {
    console.log("Pelicula modificada correctamente")
  } else {
    console.log("No se realizaron cambios")
  }
}

const borrarPelicula = async () => {
  console.log("===== ELIMINAR PELICULA =====")

  const id = await rl.question("ID de la pelicula a borrar: ")

  const [rows] = await pool.execute("SELECT * FROM peliculas WHERE id = ?", [id]
  )

  const peliculaABorrar = rows[0]

  if (!peliculaABorrar) {
    console.log("No se encuentra la pelicula a borrar")
    return
  }

  const [result] = await pool.execute(
    `DELETE FROM peliculas WHERE id = ?`, [id]
  )

  if (result.affectedRows) {
    console.log("Pelicula borrada con éxito")
  } else {
    console.log("No se pudo eliminar la pelicula")
  }
}

const iniciarMenu = async () => {
  let opcion = ""

  while (opcion !== "5") {
    console.log("\n==============================")
    console.log("      SERVICIO DE PELICULAS")
    console.log("==============================")
    console.log("1. Listar peliculas")
    console.log("2. Agregar pelicula")
    console.log("3. Actualizar pelicula")
    console.log("4. Borrar pelicula")
    console.log("5. Salir")
    console.log("==============================")

    opcion = await rl.question("Selecciona una opción: ")

    switch (opcion) {
      case "1":
        await mostrarPeliculas()
        break
      case "2":
        await registrarPelicula()
        break
      case "3":
        await actualizarPelicula()
        break
      case "4":
        await borrarPelicula()
        break
      case "5":
        console.log("Cerrando el servicio")
        break
      default:
        console.log("Opción incorrecta. Intente nuevamente")
    }
  }

  rl.close()
  await pool.end()
}

const main = async () => {
  try {
    await crearTabla()
    await iniciarMenu()
  } catch (error) {
    console.error("Error:", error.message)
    rl.close()
    await pool.end()
  }
}

main()




