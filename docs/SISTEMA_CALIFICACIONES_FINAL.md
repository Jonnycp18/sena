# 📊 Sistema de Calificaciones - Configuración Final

## 🎯 Resumen Ejecutivo

El sistema está configurado para trabajar exclusivamente con archivos Excel generados por un **sistema externo** que NO puede ser modificado.

---

## ✅ Valores Aceptados (ÚNICAMENTE)

El sistema externo **SOLO** envía estos 4 valores posibles:

| Valor | Significado | Acción del Sistema |
|-------|-------------|-------------------|
| **Vacío** | Tarea pendiente de calificar | No hace nada, espera |
| **A** | Estudiante **APROBÓ** (calificación final) | Registra como calificado ✅ |
| **D** | Estudiante **DESAPROBÓ** (calificación final) | Registra como calificado ❌ |
| **-** | Estudiante **NO ENTREGÓ** | Notifica al coordinador 🔔 |

---

## 🚫 Valores NO Permitidos

El sistema **rechazará** cualquier otro valor:

❌ Números (0, 1, 2, 3, 4, 5, 4.5, 3.8, etc.)  
❌ Otras letras (B, C, E, F, etc.)  
❌ Textos ("Aprobado", "Reprobado", etc.)  
❌ Otros símbolos (#, *, +, etc.)

**Razón:** El sistema externo no genera estos valores.

---

## 🔔 Lógica de Notificaciones

### SÍ se envía notificación ✅

```
Condición: Celda = "-" (guion) Y Fecha límite pasó
Acción: Notificar al coordinador
Razón: Estudiante no entregó la tarea después de la fecha límite
```

### NO se envía notificación ❌

```
Celda vacía → Normal, aún no calificado
Celda "A"   → Ya está calificado (aprobó)
Celda "D"   → Ya está calificado (desaprobó, pero SÍ entregó)
```

---

## 📋 Flujo de Trabajo

### 1️⃣ Configuración Inicial (Una vez)

```
Paso 1: Sistema externo genera archivo Excel inicial
Paso 2: Archivo tiene todas las celdas vacías
Paso 3: Docente carga en el sistema
Paso 4: Tipo: "Configuración Inicial"
Paso 5: Sistema registra estructura
Resultado: 0 notificaciones enviadas ✓
```

**Ejemplo Excel inicial:**
```
| Cédula   | Nombre | Taller 1 | Taller 2 | Quiz 1 | Proyecto |
|----------|--------|----------|----------|--------|----------|
| 12345678 | Juan   |          |          |        |          |
| 87654321 | María  |          |          |        |          |
```

---

### 2️⃣ Actualizaciones Semanales

```
Paso 1: Sistema externo actualiza el archivo
Paso 2: Sistema externo marca:
        - A = Estudiante aprobó
        - D = Estudiante desaprobó (pero entregó)
        - - = Estudiante no entregó
        - vacío = Aún no calificado
Paso 3: Docente descarga archivo del sistema externo
Paso 4: Docente carga archivo SIN MODIFICAR
Paso 5: Tipo: "Actualización de Calificaciones"
Resultado: Solo notifica si hay "-" después de fecha límite
```

**Ejemplo Excel semana 3:**
```
| Cédula   | Nombre | Taller 1 | Taller 2 | Quiz 1 | Proyecto |
|----------|--------|----------|----------|--------|----------|
| 12345678 | Juan   | A        | -        |        |          |
| 87654321 | María  | A        | D        |        |          |
```

**Notificaciones enviadas:**
- ✅ "Juan Pérez no entregó Taller 2" (si pasó fecha límite)
- ❌ María NO genera notificación (D = desaprobó pero sí entregó)

---

## 🎨 Interpretación de Valores

### "A" = APROBÓ ✅

```
Significado: Estudiante completó y aprobó la tarea
Estado: Calificada
Entregó: Sí
Pasó: Sí
Notifica: No
```

### "D" = DESAPROBÓ ❌

```
Significado: Estudiante completó pero no alcanzó nota mínima
Estado: Calificada
Entregó: Sí (pero no pasó)
Pasó: No
Notifica: No (porque sí entregó algo)
```

### "-" = NO ENTREGÓ 🚫

```
Significado: Estudiante no presentó nada
Estado: No Entregada
Entregó: No
Pasó: No aplica
Notifica: Sí (si pasó fecha límite)
```

### Vacío = PENDIENTE ⏳

```
Significado: Aún no calificado
Estado: Pendiente
Entregó: Desconocido
Pasó: Desconocido
Notifica: No
```

---

## 📊 Métricas del Sistema

El dashboard muestra:

| Métrica | Descripción |
|---------|-------------|
| **Calificadas** | Suma de "A" + "D" (ambas son calificaciones finales) |
| **Pendientes** | Celdas vacías (aún no calificadas) |
| **No Entregadas** | Celdas con "-" (generan notificación) |

---

## ⚠️ Errores Comunes

### Error: "Valor inválido"

**Causa:** El archivo tiene números u otros valores no permitidos

**Solución:** 
- Verificar que el archivo viene del sistema externo
- No modificar manualmente el archivo
- Solo valores permitidos: vacío, A, D, -

---

### Error: "No se notifican tareas pendientes"

**Esto NO es un error:**
- El sistema NO notifica celdas vacías
- Vacío = Normal, aún no calificado
- Solo "-" genera notificación

**Si necesitas notificar:**
- El sistema externo debe marcar con "-" (no con vacío)

---

### Pregunta: "¿Por qué D no notifica?"

**Respuesta:**
- "D" significa que el estudiante SÍ entregó la tarea
- Solo que no alcanzó la nota mínima para aprobar
- No es lo mismo que "no entregar"
- "-" es para "no entregó nada"

---

## 🔍 Ejemplos Reales

### Caso 1: Todo Normal

```excel
| Estudiante | Taller 1 | Taller 2 | Quiz 1 |
|------------|----------|----------|--------|
| Juan       | A        | A        |        |
| María      | A        | A        | A      |
| Carlos     | D        | A        |        |
```

**Análisis:**
- Juan: 2 aprobadas, 1 pendiente → Sin notificaciones
- María: 3 aprobadas → Sin notificaciones
- Carlos: 1 desaprobada (pero entregó), 1 aprobada, 1 pendiente → Sin notificaciones

**Total notificaciones:** 0 ✓

---

### Caso 2: Con No Entregas

```excel
| Estudiante | Taller 1 | Taller 2 | Quiz 1 |
|------------|----------|----------|--------|
| Juan       | A        | -        | A      |
| María      | A        | A        | -      |
| Carlos     | -        | -        |        |
```

**Suponiendo que todas las fechas límite pasaron:**

**Notificaciones enviadas:**
1. "Juan Pérez no entregó Taller 2"
2. "María García no entregó Quiz 1"
3. "Carlos López no entregó Taller 1"
4. "Carlos López no entregó Taller 2"

**Total notificaciones:** 4 🔔

---

### Caso 3: Mezcla Completa

```excel
| Estudiante | Evidencia 1 | Evidencia 2 | Evidencia 3 | Evidencia 4 |
|------------|-------------|-------------|-------------|-------------|
| Ana        | A           | A           | A           | A           |
| Bruno      | A           | D           | -           | A           |
| Clara      | D           | D           | D           |             |
| Diego      | -           | -           | -           | -           |
```

**Análisis:**
- Ana: 4 aprobadas → 0 notificaciones
- Bruno: 2 aprobadas, 1 desaprobada, 1 no entregada → 1 notificación (Evidencia 3)
- Clara: 3 desaprobadas, 1 pendiente → 0 notificaciones (todas entregó)
- Diego: 4 no entregadas → 4 notificaciones

**Total:** 5 notificaciones 🔔

---

## 📝 Checklist de Validación

Antes de cargar un archivo, verifica:

- [ ] El archivo viene del sistema externo (no modificado manualmente)
- [ ] Las celdas solo contienen: vacío, A, D, o -
- [ ] No hay números ni otros caracteres
- [ ] Seleccionaste el tipo correcto (Configuración vs Actualización)
- [ ] Configuraste las fechas límite (si aplica)

---

## 🎓 Reglas de Oro

1. **NO modificar archivos manualmente** → Usar solo los del sistema externo
2. **Solo 4 valores posibles** → vacío, A, D, -
3. **Solo "-" notifica** → A y D no generan notificaciones
4. **D no es lo mismo que -** → D = entregó pero reprobó, - = no entregó nada
5. **Vacío es normal** → Significa pendiente, no genera notificación

---

## 📞 Soporte

**Pregunta frecuente:** "¿Puedo usar números como 4.5 o 3.0?"

**Respuesta:** NO. El sistema externo solo envía A, D, o -. No se aceptan números porque el sistema externo no los genera.

---

**Fecha de configuración:** Octubre 2024  
**Estado:** ✅ Sistema configurado y validado  
**Valores permitidos:** vacío, A, D, - (únicamente)  
**Calificaciones numéricas:** ❌ NO soportadas (sistema externo no las genera)