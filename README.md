# Compartir gastos · Frontend (Angular)

Interfaz web del proyecto final del **Máster en Programación y Desarrollo Web Full Stack**.
Permite registrarse, crear grupos de gastos para una boda o despedida, invitar a otras
personas con un porcentaje, ver lo que debe y ha pagado cada una y chatear dentro del grupo.

- Backend (FastAPI + MySQL): https://github.com/Soraya-cmd/gastos-compartidos-back
- Autora: Soraya Arbona Martínez

> El frontend necesita el backend funcionando para mostrar datos.
> Sigue primero las instrucciones del README del backend.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Framework | Angular 22 (componentes standalone) y TypeScript |
| Estado | Signals |
| Formularios | Formularios reactivos (`FormBuilder`, `FormArray`) |
| Comunicación con la API | `HttpClient` + interceptor funcional |
| Diseño | Bootstrap 5 + CSS propio (paleta burdeos/rosa) |

## Pantallas

| Ruta | Pantalla |
|---|---|
| `/login` | Inicio de sesión |
| `/registro` | Registro de usuario |
| `/grupos` | Mis grupos (con etiqueta Creador / Invitado) |
| `/grupos/nuevo` | Crear grupo con título, descripción y gastos por categoría |
| `/grupos/:id` | Detalle: resumen, deudas, pagos, invitaciones y chat |

Las rutas de grupos están protegidas por un guard: sin sesión iniciada se redirige a `/login`.

## Estructura del proyecto

```
front/src/app/
├── core/
│   ├── config.ts            # Dirección de la API (API_URL)
│   ├── auth.service.ts      # Registro, login, logout y token
│   ├── auth.interceptor.ts  # Añade el token a las peticiones a la API
│   ├── auth.guard.ts        # Protege las rutas privadas
│   └── grupos.service.ts    # Llamadas a la API de grupos
├── pages/                   # login, register, grupos, nuevo-grupo, detalle-grupo
├── app.ts / app.html        # Barra superior y router-outlet
├── app.routes.ts            # Rutas
└── app.config.ts            # Configuración (HttpClient, idioma español)
```

## Requisitos previos

- Node.js y npm
- Angular CLI (`npm install -g @angular/cli`)
- Git
- Backend en marcha en `http://127.0.0.1:8000`

## Instalación (Windows)

```
git clone https://github.com/Soraya-cmd/gastos-compartidos-front.git
cd gastos-compartidos-front
npm install
ng serve
```

La aplicación queda en http://localhost:4200.

> Debe usarse el puerto **4200**: es el único origen que el backend permite por CORS
> (se puede cambiar con la variable `CORS_ORIGINS` del backend).

Si el backend está en otra dirección, cambia `API_URL` en `src/app/core/config.ts`.

## Cómo funciona la sesión

1. Al iniciar sesión, la API devuelve un token que se guarda en `localStorage`.
2. El interceptor añade `Authorization: Bearer <token>` a cada petición a la API.
3. Si la API responde 401 (token caducado o inválido), se cierra la sesión y se vuelve al login.
4. Solo el creador del grupo ve los controles de edición; los invitados solo consultan.
   Los permisos también se comprueban en el servidor.

## Compilar para producción

```
ng build
```

El resultado queda en la carpeta `dist/`.

## Ramas (GitFlow)

`main` (estable, etiqueta `v1.0`), `develop` (integración) y `feature/*` (una por funcionalidad).
