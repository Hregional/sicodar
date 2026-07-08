import argparse
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Usuario
from utils import get_password_hash
import sys

def create_user(nombre, email, password, rol):
    db: Session = SessionLocal()
    try:
        # Verificar si el email ya existe
        existing_user = db.query(Usuario).filter(Usuario.email == email).first()
        if existing_user:
            print(f"Error: El usuario con email '{email}' ya existe.")
            return

        hashed_password = get_password_hash(password)
        new_user = Usuario(
            nombre=nombre,
            email=email,
            password_hash=hashed_password,
            rol=rol
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Usuario creado exitosamente: {new_user.nombre} ({new_user.email}) - Rol: {new_user.rol}")
    except Exception as e:
        print(f"Error al crear usuario: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crear un nuevo usuario de sistema.")
    parser.add_argument("nombre", help="Nombre completo del usuario")
    parser.add_argument("email", help="Correo electrónico")
    parser.add_argument("password", help="Contraseña")
    parser.add_argument("rol", choices=['admin', 'empleado', 'super_admin'], help="Rol del usuario")

    args = parser.parse_args()

    create_user(args.nombre, args.email, args.password, args.rol)
