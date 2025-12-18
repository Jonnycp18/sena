# 📤 Guía de Carga de Calificaciones

Esta guía explica cómo funciona el sistema de carga de archivos Excel para calificaciones y evidencias académicas.

---

## 🎯 Conceptos Clave

### Tipos de Carga

El sistema maneja dos tipos de carga diferenciados:

#### 1. **📋 Configuración Inicial**
- **Propósito:** Crear la estructura inicial de todas las tareas/evidencias del periodo académico
- **Cuándo usar:** Al inicio del periodo, cuando configuras todas las tareas que los estudiantes deberán entregar
- **Características:**
  - Define todas las evidencias/tareas del curso
  - Los valores vacíos o "A" se marcan como **Pendientes**
  - **NO genera notificaciones** (porque aún no hay entregas vencidas)
  - Puede incluir fechas límite opcionales

#### 2. **🔄 Actualización de Calificaciones**
- **Propósito:** Actualizar las calificaciones semana a semana conforme los estudiantes van entregando trabajos
- **Cuándo usar:** Semanalmente, para registrar nuevas calificaciones
- **Características:**
  - Actualiza solo las calificaciones que han cambiado
  - Las tareas pendientes siguen marcadas como pendientes
  - **Solo notifica** si hay tareas explícitamente marcadas como "D" (No Entregada) después de la fecha límite
  - Mantiene el historial de cambios

---

## 📊 Formato del Archivo Excel

### Estructura de Columnas

Tu archivo Excel debe tener esta estructura:

```
| Cédula    | Nombre | Apellido | Email              | Evidencia 1 | Evidencia 2 | Taller 1 | ... |
|-----------|--------|----------|-------------------|-------------|-------------|----------|-----|
| 12345678  | Juan   | Pérez    | juan@email.com    | 4.5         | A           | 3.8      | ... |
| 87654321  | María  | García   | maria@email.com   | 5.0         | 4.2         |          | ... |
```

### Columnas Requeridas

1. **Cédula** (obligatoria)
   - Identificador único del estudiante
   - Debe tener entre 7 y 10 dígitos
   - Ejemplo: `12345678`

2. **Nombre** (obligatoria)
   - Primer nombre del estudiante
   - Ejemplo: `Juan`

3. **Apellido** (obligatoria)
   - Apellido del estudiante
   - Ejemplo: `Pérez`

4. **Email** (opcional)
   - Correo electrónico del estudiante
   - Si no se proporciona, el sistema usa el email registrado
   - Ejemplo: `juan@estudiante.edu`

5. **Evidencias/Tareas** (al menos una obligatoria)
   - Columnas con nombres descriptivos: `Evidencia 1`, `Taller 2`, `Quiz 3`, etc.
   - Cada columna representa una tarea/evidencia a calificar

---

## 🏷️ Valores Permitidos en Evidencias

**IMPORTANTE:** El sistema externo solo envía estos 4 valores posibles. No se permiten calificaciones numéricas.

Cada celda de evidencia puede contener:

| Valor | Significado | Estado | ¿Notifica? |
|-------|-------------|--------|------------|
| **Vacío** | Sin calificar aún | Pendiente | No |
| **A** | Aprobó la tarea (calificación final) | Calificada | No |
| **D** | Desaprobó/Reprobó (calificación final) | Calificada | No |
| **-** (guion) | No entregó | No Entregada | Sí (si ya pasó fecha límite) |

### Ejemplos

```excel
       → Pendiente (vacío, aún no calificado)
A      → Aprobó (calificación final positiva)
D      → Desaprobó/Reprobó (calificación final negativa)
-      → No entregó (notifica si pasó fecha límite)
```

### ⚠️ Valores NO Permitidos

El sistema **NO acepta**:
- ❌ Números (0, 1, 2, 3, 4, 5, 4.5, etc.)
- ❌ Letras diferentes a A, D
- ❌ Símbolos diferentes a -
- ❌ Textos descriptivos

**Razón:** El sistema externo solo genera A, D, - o vacío.

---

## 🔄 Flujo de Trabajo Recomendado

### Semana 1: Configuración Inicial

1. **Crear el archivo Excel** con:
   - Todos los estudiantes
   - Todas las evidencias/tareas del periodo
   - Valores vacíos o "A" en todas las evidencias

2. **Subir el archivo:**
   - Seleccionar tipo: **"Configuración Inicial"**
   - Mapear columnas
   - (Opcional) Configurar fechas límite para cada evidencia
   - Guardar

3. **Resultado:**
   - ✅ Estructura completa cargada
   - ⚪ Todas las evidencias marcadas como "Pendientes"
   - 🔕 No se envían notificaciones

### Semanas Posteriores: Actualización de Calificaciones

1. **Actualizar el archivo Excel:**
   - Reemplazar valores vacíos/"A" con calificaciones reales
   - Dejar como "A" o vacío las que aún están pendientes
   - Marcar como "D" solo si ya pasó la fecha límite y no se entregó

2. **Subir el archivo:**
   - Seleccionar tipo: **"Actualización de Calificaciones"**
   - Mapear columnas (se auto-detecta)
   - Guardar

3. **Resultado:**
   - ✅ Calificaciones actualizadas
   - 🔕 No se notifica por tareas pendientes (A o vacío)
   - 🔔 Solo se notifica si hay "D" después de fecha límite

---

## 📅 Configuración de Fechas Límite

### ¿Para qué sirven?

Las fechas límite determinan cuándo el sistema debe considerar una tarea como "vencida" y generar notificaciones.

### Cómo configurar

1. Al mapear columnas, haz clic en **"Configurar Fechas Límite"**
2. Selecciona una fecha para cada evidencia
3. Las fechas son opcionales

### Lógica de notificaciones

```
SI evidencia = "-" Y fecha_limite ha pasado:
    → Enviar notificación al coordinador (estudiante no entregó)
SI evidencia = vacía o "A" o "D" Y fecha_limite ha pasado:
    → NO enviar notificación
    - Vacío = aún no se califica (normal)
    - "A" = ya aprobó (calificado)
    - "D" = ya desaprobó (calificado, pero entregó algo)
```

---

## 🎨 Estados de Evidencias

### Estados Visuales

Cada evidencia puede tener uno de estos estados:

#### ⚪ No Configurada
- La evidencia no existe en el sistema
- Aparece cuando se agrega una nueva columna

#### 🟡 Pendiente
- La tarea está configurada pero sin calificación
- Valores: vacío o "A"
- **No genera notificaciones**

#### 🟢 Calificada
- La tarea tiene una calificación válida
- Puede ser: número 0-5, "A" (aprobó), o "D" (desaprobó)
- El estudiante entregó algo y fue evaluado

#### 🔴 No Entregada
- Marcada explícitamente con "-" (guion)
- El docente confirma que no se entregó nada
- **Genera notificación** si pasó fecha límite

---

## 📊 Interpretación de Estadísticas

Después de cargar un archivo, verás estas métricas:

### En la Vista Principal

| Métrica | Descripción |
|---------|-------------|
| **Archivos** | Total de archivos cargados |
| **Validados** | Archivos procesados sin errores críticos |
| **Guardados** | Archivos guardados en el sistema |
| **Estudiantes** | Total de estudiantes procesados |
| **Calificadas** | Evidencias con calificación numérica |
| **Pendientes** | Evidencias vacías o con "A" |

### Por Archivo

- **Estudiantes válidos:** Registros sin errores críticos
- **Evidencias configuradas:** Total de tareas/evidencias detectadas
- **Calificadas:** Cuántas tienen nota numérica
- **Pendientes:** Cuántas están vacías o con "A"

---

## 🔍 Validaciones del Sistema

El sistema valida automáticamente:

### Validaciones de Estudiante

✅ **Cédula:**
- Debe tener entre 7 y 10 dígitos
- Solo números

✅ **Nombre y Apellido:**
- Son obligatorios
- No pueden estar vacíos

⚠️ **Email:**
- Si se proporciona, debe ser válido
- Si no se proporciona, usa el del sistema

⚠️ **Estudiante no encontrado:**
- Genera advertencia
- Se creará el registro automáticamente

### Validaciones de Calificaciones

✅ **Rango:**
- Números entre 0 y 5
- Acepta decimales con punto o coma (3.5 o 3,5)

✅ **Valores válidos:**
- Vacío (celda sin contenido)
- "A" (aprobó)
- "D" (desaprobó)
- "-" (no entregó)

❌ **Valores NO aceptados:**
- Números de cualquier tipo (0, 1, 2, 3, 4, 5, 4.5, etc.)
- Letras diferentes a A o D
- Textos descriptivos
- Otros símbolos

**Razón:** El sistema externo solo envía estos valores específicos

---

## 🛠️ Solución de Problemas

### Problema: "El archivo tiene errores"

**Causa común:**
- Calificaciones fuera del rango 0-5
- Cédulas con formato incorrecto
- Columnas requeridas vacías

**Solución:**
1. Haz clic en "Ver Detalles" del archivo
2. Revisa la sección "Errores y Advertencias"
3. Corrige los errores en el Excel
4. Vuelve a cargar

---

### Problema: "No se detectan las evidencias"

**Causa común:**
- Las columnas tienen nombres genéricos o vacíos

**Solución:**
1. Asegúrate de que cada evidencia tenga un nombre claro
2. Ejemplo: "Evidencia 1", "Taller 2", "Quiz Final"
3. El sistema auto-detecta todas las columnas que no sean datos básicos

---

### Problema: "Quiero que notifique tareas pendientes"

**Explicación:**
- El sistema NO notifica por tareas pendientes (vacías)
- Tampoco notifica por "A" (aprobó) o "D" (desaprobó) porque son calificaciones válidas
- Esto es intencional para evitar notificaciones prematuras

**Solución:**
- Si una tarea ya pasó su fecha límite y el estudiante NO entregó nada, márcala con "-" (guion)
- Solo "-" genera notificaciones de no entrega

---

## 📋 Plantilla Excel Recomendada

### Descarga

Usa el botón **"Descargar Plantilla"** en la interfaz para obtener un archivo Excel pre-configurado.

### Estructura de la Plantilla

```
| Cédula    | Nombre | Apellido | Email              | Evidencia 1 | Evidencia 2 | Evidencia 3 | Evidencia 4 | Evidencia 5 |
|-----------|--------|----------|-------------------|-------------|-------------|-------------|-------------|-------------|
| 12345678  | Juan   | Pérez    | juan@email.com    |             |             |             |             |             |
| 87654321  | María  | García   | maria@email.com   |             |             |             |             |             |
| 11223344  | Carlos | López    | carlos@email.com  |             |             |             |             |             |
```

**Nota:** Las celdas vacías indican que las tareas están pendientes de calificar.

**Nota:** Puedes agregar o quitar columnas de evidencias según necesites.

---

## 📖 Ejemplo Práctico Completo

### Escenario

Eres docente de "Fundamentos de Programación" y necesitas:
- 3 talleres
- 2 quizzes
- 1 proyecto final

### Paso 1: Configuración Inicial (Semana 1)

**Archivo Excel:**
```
| Cédula   | Nombre | Apellido | Taller 1 | Taller 2 | Taller 3 | Quiz 1 | Quiz 2 | Proyecto |
|----------|--------|----------|----------|----------|----------|--------|--------|----------|
| 12345678 | Juan   | Pérez    |          |          |          |        |        |          |
| 87654321 | María  | García   |          |          |          |        |        |          |
```

**Carga:**
1. Tipo: **Configuración Inicial**
2. Materia: Fundamentos de Programación
3. Fechas límite:
   - Taller 1: 2024-10-20
   - Taller 2: 2024-10-27
   - Quiz 1: 2024-11-03
   - ...

**Resultado:** ✅ 6 evidencias configuradas, 0 notificaciones enviadas

---

### Paso 2: Primera Actualización (Semana 3)

El sistema externo generó el archivo con las calificaciones. Juan y María aprobaron Taller 1 y 2.

**Archivo Excel (generado por sistema externo):**
```
| Cédula   | Nombre | Apellido | Taller 1 | Taller 2 | Taller 3 | Quiz 1 | Quiz 2 | Proyecto |
|----------|--------|----------|----------|----------|----------|--------|--------|----------|
| 12345678 | Juan   | Pérez    | A        | A        |          |        |        |          |
| 87654321 | María  | García   | A        | A        |          |        |        |          |
```

**Carga:**
1. Descargar archivo del sistema externo
2. Tipo: **Actualización de Calificaciones**
3. Materia: Fundamentos de Programación

**Resultado:** ✅ 4 calificaciones actualizadas (todas A), 0 notificaciones

---

### Paso 3: Actualización con Tarea No Entregada (Semana 5)

Juan no entregó el Taller 3 y ya pasó la fecha límite. María desaprobó el Quiz 1 pero sí entregó.

**Archivo Excel:**
```
| Cédula   | Nombre | Apellido | Taller 1 | Taller 2 | Taller 3 | Quiz 1 | Quiz 2 | Proyecto |
|----------|--------|----------|----------|----------|----------|--------|--------|----------|
| 12345678 | Juan   | Pérez    | A        | A        | -        | A      |        |          |
| 87654321 | María  | García   | A        | A        | A        | D      |        |          |
```

**Carga:**
1. Tipo: **Actualización de Calificaciones**

**Resultado:** 
- ✅ 6 calificaciones actualizadas (5 aprobadas, 1 desaprobada)
- 🔔 Notificación enviada: "Juan Pérez no entregó Taller 3"
- ℹ️ María desaprobó Quiz 1, pero NO se notifica (ella sí entregó, solo que reprobó)

---

## 📚 Historial de Cargas

El sistema mantiene un registro completo de todas las cargas:

### Información Registrada

- Fecha y hora exacta
- Tipo de carga (Configuración/Actualización)
- Archivo cargado
- Materia
- Evidencias actualizadas
- Número de estudiantes

### Uso del Historial

- **Auditoría:** Ver quién cargó qué y cuándo
- **Seguimiento:** Verificar frecuencia de actualizaciones
- **Análisis:** Detectar patrones de carga

---

## ✅ Buenas Prácticas

### ✓ Recomendado

1. **Nombra claramente las evidencias:** "Taller 1", "Quiz Final", no "Col1", "Col2"
2. **Mantén el formato consistente:** Usa siempre la misma plantilla
3. **Actualiza semanalmente:** No esperes al final del periodo
4. **Usa "D" solo cuando corresponda:** Después de fecha límite y confirmes que no se entregó
5. **Revisa las validaciones:** Antes de guardar, verifica que no haya errores

### ✗ Evita

1. ❌ Cambiar nombres de columnas entre cargas
2. ❌ Usar "D" para todo lo que no está entregado (usa "A" o vacío)
3. ❌ Subir archivos sin mapear correctamente las columnas
4. ❌ Ignorar advertencias del sistema
5. ❌ Mezclar calificaciones de diferentes materias en un archivo

---

## 🎓 Resumen Rápido

### Para Configuración Inicial:
```
1. Crea Excel con todos los estudiantes y evidencias
2. Deja vacías todas las evidencias
3. Selecciona "Configuración Inicial"
4. Carga y guarda
5. No se envían notificaciones ✓
```

### Para Actualizaciones Semanales:
```
1. El sistema externo actualiza el Excel con:
   - Vacío = Pendiente (aún no calificado)
   - A = Aprobó
   - D = Desaprobó/Reprobó
   - - (guion) = No entregó
2. Descarga el archivo del sistema externo
3. Selecciona "Actualización de Calificaciones"
4. Carga el archivo sin modificar
5. Solo notifica si hay "-" después de fecha límite
```

---

## 📞 ¿Necesitas Ayuda?

Si encuentras problemas:

1. Revisa esta guía completa
2. Verifica el archivo en "Ver Detalles"
3. Lee los mensajes de error específicos
4. Consulta la sección "Solución de Problemas"
5. Contacta al administrador del sistema

---

**¡Listo!** Ahora puedes usar el sistema de carga de calificaciones de manera eficiente y sin generar notificaciones innecesarias. 🎉