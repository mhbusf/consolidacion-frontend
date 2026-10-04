# Contratos frontend de mentoría

El frontend asume que la identidad del mentor se obtiene exclusivamente desde el JWT. Ninguna consulta del portal envía `username` ni `mentorId`.

## Portal mentor

- `GET /api/encuentro-poder/mentor/participantes`: lista resumida de inscripciones asignadas al mentor autenticado.
- `GET /api/encuentro-poder/mentor/participantes/{inscripcionId}`: datos y progreso de una inscripción asignada.
- `GET /api/encuentro-poder/mentor/participantes/{inscripcionId}/feedback`: historial de feedback, ordenado del más reciente al más antiguo.
- `POST /api/encuentro-poder/mentor/participantes/{inscripcionId}/feedback`: crea feedback con body `{ "contenido": string }` y retorna el registro creado.

Los DTO usados por las pantallas están tipados en `src/app/core/models/encuentro-mentoria.model.ts`; el servicio adapta la respuesta anidada del backend. Las fechas son strings ISO 8601. `porcentajeProgreso` se interpreta en rango 0-100. El detalle muestra las clases obligatorias, incluyendo las ausencias con `asistio: false`.

## Administración

- `GET /api/encuentro-poder/mentores`: usuarios habilitados con `ROLE_MENTOR`.
- `GET /api/encuentro-poder/ciclos/{cicloId}/mentorias`: todas las inscripciones del ciclo y su mentor actual, si existe.
- `PUT /api/encuentro-poder/inscripciones/{inscripcionId}/mentor`: asigna, reasigna o desasigna; recibe `{ "mentorId": number | null }` y retorna la asignación actualizada.

Estas operaciones administrativas se muestran únicamente dentro del dashboard protegido para `ROLE_SUPER_ADMIN`. No se contempla toma de asistencia desde el portal mentor.

## Autorización esperada

- `ROLE_MENTOR` es independiente de `ROLE_USER` y `ROLE_ADMIN`.
- `ROLE_SUPER_ADMIN` puede usar endpoints mentor y administrativos.
- El backend debe verificar en cada detalle y operación de feedback que la inscripción esté asignada al mentor autenticado.
- Solo `ROLE_SUPER_ADMIN` puede asignar, degradar, cambiar la contraseña o eliminar cuentas con perfil `MENTOR` o `SUPER_ADMIN`; un administrador conserva la gestión de cuentas no protegidas.
