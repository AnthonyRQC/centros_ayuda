import os

# Nombre del archivo de salida. No se incluirá a sí mismo en el compilado.
output_filename = "compilado.txt"

# Extensiones de archivo que se incluirán. Puedes modificar esta lista.
# Si quieres incluir todos los archivos, deja la lista vacía: included_extensions = []
included_extensions = ['.js', '.css', '.html', '.py', '.txt']

def compile_files_in_directory(directory, output_file):
    """
    Recorre un directorio y sus subdirectorios, leyendo los archivos
    y escribiendo su contenido en un archivo de salida.
    """
    print(f"Escaneando el directorio: {directory}")
    
    # os.walk() recorre el árbol de directorios de forma recursiva [[5]] [[7]]
    for root, dirs, files in os.walk(directory):
        for filename in files:
            # Ignorar el propio script de salida
            if filename == output_filename:
                continue

            file_path = os.path.join(root, filename)
            
            # Obtener la ruta relativa para un encabezado más limpio
            relative_path = os.path.relpath(file_path, start=directory)

            # Comprobar si el archivo tiene una de las extensiones deseadas
            # Si la lista de extensiones está vacía, se incluyen todos los archivos.
            if not included_extensions or any(filename.endswith(ext) for ext in included_extensions):
                try:
                    # Escribir el encabezado con la ruta del archivo [[2]]
                    header = f"#### {relative_path.replace(os.sep, '/')} ####\n\n"
                    output_file.write(header)
                    
                    # Abrir y leer el contenido del archivo [[1]]
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as input_file:
                        content = input_file.read()
                        output_file.write(content)
                    
                    # Añadir un par de saltos de línea para separar los archivos
                    output_file.write("\n\n")
                    print(f" - Archivo añadido: {relative_path}")

                except Exception as e:
                    # Manejar posibles errores, como no poder leer un archivo
                    error_message = f"**** No se pudo leer el archivo: {relative_path} | Error: {e} ****\n\n"
                    output_file.write(error_message)
                    print(f" ! Error al leer {relative_path}: {e}")


# Obtener el directorio donde se está ejecutando el script
current_directory = os.path.dirname(os.path.abspath(__file__))

# Ruta completa del archivo de salida
output_filepath = os.path.join(current_directory, output_filename)

# Abrir el archivo de salida en modo escritura ('w') [[3]]
# El modo 'w' crea el archivo si no existe o lo sobrescribe si ya existe.
try:
    with open(output_filepath, 'w', encoding='utf-8') as f:
        print(f"Creando archivo de salida en: {output_filepath}")
        compile_files_in_directory(current_directory, f)
    print("\n¡Proceso completado!")
    print(f"Todos los archivos han sido compilados en '{output_filename}'")
except IOError as e:
    print(f"Error al abrir o escribir en el archivo de salida: {e}") [[10]]

