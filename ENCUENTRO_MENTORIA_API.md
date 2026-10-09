# Contratos frontend de mentoría

El frontend asume que la identidad del mentor se obtiene exclusivamente desde el JWT. Ninguna consulta del portal envía `username` ni `mentorId`.

## Portal mentor

- `GET /api/encuentro-poder/mentor/participantes`: lista resumida de inscripciones asignadas al mentor autenticado.
- `GET /api/encuentro-poder/mentor/resumen`: indicadores del último ciclo abierto ya iniciado para el mentor autenticado.
- `GET /api/encuentro-poder/mentor/participantes/{inscripcionId}`: datos y progreso de una inscripción asignada.
- `GET /api/encuentro-poder/mentor/participantes/{inscripcionId}/feedback`: historial de feedback, ordenado del más reciente al más antiguo.
- `POST /api/encuentro-poder/mentor/participantes/{inscripcionId}/feedback`: crea feedback con body `{ "contenido": string }` y retorna el registro creado.
- `GET /api/encuentro-poder/mentor/ciclos`: lista ciclos y clases obligatorias con su estado calculado en `America/Santiago`.
- `GET /api/encuentro-poder/mentor/ciclos/{cicloId}/asistencia?claseId={claseId}`: retorna clase y nómina global mínima (`nombreCompleto`, `telefono`, `presente`).
- `POST /api/encuentro-poder/mentor/asistencias`: registra asistencia manual con body `{ "personaId": number, "claseId": number }`.

Los DTO usados por las pantallas están tipados en `src/app/core/models/encuentro-mentoria.model.ts`; el servicio adapta la respuesta anidada del backend. Las fechas son strings ISO 8601. `porcentajeProgreso` se interpreta en rango 0-100. El detalle muestra las clases obligatorias, incluyendo las ausencias con `asistio: false`.

La etapa de una mentoría se deriva de la tercera clase obligatoria usando `America/Santiago`: permanece `ACTIVA` hasta ese día, pasa a `CIERRE` durante los siete días siguientes y luego queda `HISTORICA`. La asignación no se elimina y el mentor puede consultar y agregar feedback en las tres etapas. El porcentaje del resumen considera solo clases obligatorias con fecha igual o anterior a hoy, evitando que clases futuras reduzcan el indicador.

## Administración

- `GET /api/encuentro-poder/mentores`: usuarios habilitados con `ROLE_MENTOR`.
- `GET /api/encuentro-poder/ciclos/{cicloId}/mentorias`: todas las inscripciones del ciclo y su mentor actual, si existe.
- `PUT /api/encuentro-poder/inscripciones/{inscripcionId}/mentor`: asigna, reasigna o desasigna; recibe `{ "mentorId": number | null }` y retorna la asignación actualizada.

Las asignaciones de mentor se muestran únicamente dentro del dashboard protegido para `ROLE_SUPER_ADMIN`. La toma de asistencia usa una pantalla limitada del portal mentor y no expone feedback ni datos pastorales globales.

## Autorización esperada

- `ROLE_MENTOR` es independiente y puede combinarse con `ROLE_USER` o `ROLE_ADMIN`.
- `ROLE_SUPER_ADMIN` puede usar endpoints mentor y administrativos.
- El backend debe verificar en cada detalle y operación de feedback que la inscripción esté asignada al mentor autenticado.
- `ROLE_ADMIN` y `ROLE_SUPER_ADMIN` pueden reemplazar atómicamente el conjunto de roles de una cuenta. Cambiar la contraseña o eliminar una cuenta con `ROLE_MENTOR` o `ROLE_SUPER_ADMIN` sigue limitado a `ROLE_SUPER_ADMIN`.
