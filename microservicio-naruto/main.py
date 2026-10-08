from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
from bson import ObjectId
import os

# Crear el microservicio y su documentación Swagger
app = FastAPI(
    title="API de Naruto",
    description="Microservicio Python conectado a MongoDB",
    version="1.0.0"
)

# Conexión con MongoDB mediante variable de Railway
MONGO_URL = os.getenv("MONGO_URL")

cliente = MongoClient(MONGO_URL) if MONGO_URL else None

# Base de datos y colección creadas en Railway
coleccion = cliente["test"]["personajes"] if cliente is not None else None


# Convertir el identificador MongoDB a texto
def preparar_personaje(personaje):
    personaje["_id"] = str(personaje["_id"])
    return personaje


# Comprobar que el microservicio funciona
@app.get("/")
def inicio():
    return {"mensaje": "Microservicio Naruto funcionando correctamente"}


# Consultar todos los personajes
@app.get("/personajes")
def obtener_personajes():
    if coleccion is None:
        raise HTTPException(status_code=503, detail="MongoDB no configurado")

    try:
        personajes = list(coleccion.find({}))
        return [preparar_personaje(p) for p in personajes]
    except Exception:
        raise HTTPException(status_code=500, detail="Error al consultar MongoDB")


# Buscar personajes por nombre
@app.get("/personajes/buscar")
def buscar_personaje(nombre: str):
    if coleccion is None:
        raise HTTPException(status_code=503, detail="MongoDB no configurado")

    try:
        personajes = list(
            coleccion.find({"nombre": {"$regex": nombre, "$options": "i"}})
        )
        return [preparar_personaje(p) for p in personajes]
    except Exception:
        raise HTTPException(status_code=500, detail="Error al buscar personajes")


# Consultar un personaje por su identificador
@app.get("/personajes/{id}")
def obtener_personaje(id: str):
    if coleccion is None:
        raise HTTPException(status_code=503, detail="MongoDB no configurado")

    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="ID inválido")

    try:
        personaje = coleccion.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=500, detail="Error al consultar MongoDB")

    if personaje is None:
        raise HTTPException(status_code=404, detail="Personaje no encontrado")

    return preparar_personaje(personaje)