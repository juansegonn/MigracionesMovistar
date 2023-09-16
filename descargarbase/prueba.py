import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import pandas as pd
from pandas import json_normalize
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import schedule
import time
from datetime import datetime

def enviar_correo():
    # Acceder a la base de datos Firestore
    db = firestore.client()

    # Nombre de la colección que deseas descargar
    nombre_coleccion = "ventas"

    # Obtener la fecha actual
    fecha_actual = datetime.now().date()

    # Crear una referencia a la colección de ventas filtrando por la fecha actual
    coleccion_ref = db.collection(nombre_coleccion).where("fecha", "==", fecha_actual)

    # Descargar documentos en la colección filtrada
    documentos = coleccion_ref.stream()

    # Crear una lista para almacenar los datos
    datos_formato_personalizado = []

    # Iterar a través de los documentos y almacenar los datos en el formato deseado
    for doc in documentos:
        datos = doc.to_dict()
        # Crear una fila con el formato deseado
        fila = {
            "fecha": datos["fecha"],
            "hora": datos["hora"],
            "cliente.nombre": datos["cliente"]["nombre"],
            "cliente.dni": datos["cliente"]["dni"],
            "vendedor.nombre": datos["vendedor"]["nombre"],
            "vendedor.dni": datos["vendedor"]["dni"],
            "linea.numero": datos["linea"]["numero"],
            "linea.plan": datos["linea"]["plan"]
        }
        datos_formato_personalizado.append(fila)

    # Crear un DataFrame de pandas con los datos en el formato deseado
    df = pd.DataFrame(datos_formato_personalizado)

    # Nombre del archivo Excel de salida
    nombre_archivo_excel = "ventas_formato_personalizado.xlsx"

    # Guardar el DataFrame en un archivo Excel
    df.to_excel(nombre_archivo_excel, index=False, engine='openpyxl')

    # Configuración de correo electrónico
    correo_remitente = "juansegonn@gmail.com"
    contraseña_remitente = "kerjwujxdvuwlooe"
    correo_destinatario = "juanse2001racing@gmail.com"

    # Configurar el correo electrónico
    msg = MIMEMultipart()
    msg['From'] = correo_remitente
    msg['To'] = correo_destinatario
    msg['Subject'] = "Archivo de Ventas del día"

    # Cuerpo del correo electrónico (puede personalizarlo)
    mensaje = "Adjunto encontrarás el archivo de ventas del día en formato plano."
    msg.attach(MIMEText(mensaje, 'plain'))

    # Adjuntar el archivo Excel al correo electrónico
    attachment = open(nombre_archivo_excel, 'rb')
    part = MIMEBase('application', 'octet-stream')
    part.set_payload((attachment).read())
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', "attachment; filename= %s" % nombre_archivo_excel)
    msg.attach(part)

    # Iniciar la conexión SMTP y enviar el correo electrónico
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(correo_remitente, contraseña_remitente)
    text = msg.as_string()
    server.sendmail(correo_remitente, correo_destinatario, text)
    server.quit()

    print(f"Correo electrónico enviado a {correo_destinatario} con el archivo adjunto.")

if __name__ == "__main__":
    # Inicializar Firebase Admin SDK con el archivo de credenciales
    cred = credentials.Certificate("key.json")
    firebase_admin.initialize_app(cred)

    # Llamar a enviar_correo() una vez al inicio
    enviar_correo()

    # Programar la tarea para que se ejecute cada hora
    schedule.every().hour.do(enviar_correo)

    while True:
        schedule.run_pending()
        time.sleep(1)
