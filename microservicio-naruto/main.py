
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import os


# Aqui creamos nuestro microservicio de Naruto con Python
# FastAPI tambien nos genera la documentacion de Swagger
app = FastAPI(
    title="API de Naruto",
    description="Microservicio Python conectado a MongoDB",
    version="1.0.0"
)


# Aqui configuramos CORS para que React pueda consultar la API
# Esto nos ayuda a usarla desde la web y desde Expo Go
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Aqui tomamos la conexion de MongoDB que tenemos en Railway
# La URL esta guardada como una variable de entorno
MONGO_URL = os.getenv("MONGO_URL")

# Creamos la conexion con nuestra base de datos
cliente = MongoClient(MONGO_URL) if MONGO_URL else None

# Aqui usamos la base de datos test y la coleccion personajes
# Es donde guardamos nuestros 10 personajes de Naruto
coleccion = cliente["test"]["personajes"] if cliente is not None else None


# Esta funcion convierte el ID de MongoDB en texto
# Esto es necesario para poder enviar los datos en JSON
def preparar_personaje(personaje):
    personaje["_id"] = str(personaje["_id"])
    return personaje


# Esta ruta nos sirve para comprobar que la API funciona
@app.get("/")
def inicio():
    return {
        "mensaje": "Microservicio Naruto funcionando correctamente"
    }


# Aqui consultamos todos los personajes guardados en MongoDB
@app.get("/personajes")
def obtener_personajes():

    # Primero revisamos que exista la conexion con MongoDB
    if coleccion is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB no configurado"
        )

    try:
        # Buscamos todos los personajes de la coleccion
        personajes = list(coleccion.find({}))

        # Convertimos los ID y devolvemos los personajes
        return [preparar_personaje(p) for p in personajes]

    except Exception:
        # Si falla la consulta, mostramos un error
        raise HTTPException(
            status_code=500,
            detail="Error al consultar MongoDB"
        )


# Esta ruta sirve para buscar personajes por su nombre
@app.get("/personajes/buscar")
def buscar_personaje(nombre: str):

    # Revisamos que MongoDB este configurado
    if coleccion is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB no configurado"
        )

    try:
        # Buscamos los personajes que coincidan con el nombre
        # Con regex podemos buscar escribiendo solo una parte
        # La opcion i permite buscar sin importar mayusculas
        personajes = list(
            coleccion.find({
                "nombre": {
                    "$regex": nombre,
                    "$options": "i"
                }
            })
        )

        # Devolvemos los personajes encontrados
        return [preparar_personaje(p) for p in personajes]

    except Exception:
        # Mostramos un error si la busqueda falla
        raise HTTPException(
            status_code=500,
            detail="Error al buscar personajes"
        )


# Esta ruta permite consultar un personaje usando su ID
@app.get("/personajes/{id}")
def obtener_personaje(id: str):

    # Comprobamos que tengamos conexion con MongoDB
    if coleccion is None:
        raise HTTPException(
            status_code=503,
            detail="MongoDB no configurado"
        )

    # Revisamos que el ID tenga el formato correcto
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=400,
            detail="ID inválido"
        )

    try:
        # Buscamos el personaje que tenga ese ID
        personaje = coleccion.find_one({
            "_id": ObjectId(id)
        })

    except Exception:
        # Si ocurre un problema con MongoDB mostramos un error
        raise HTTPException(
            status_code=500,
            detail="Error al consultar MongoDB"
        )

    # Si no encontramos el personaje, devolvemos un error 404
    if personaje is None:
        raise HTTPException(
            status_code=404,
            detail="Personaje no encontrado"
        )

    # Si lo encontramos, devolvemos sus datos
    return preparar_personaje(personaje)
