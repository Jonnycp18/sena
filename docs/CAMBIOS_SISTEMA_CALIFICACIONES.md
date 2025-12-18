# 📝 Cambios en el Sistema de Calificaciones

## 🎯 Resumen de Cambios

Se actualizó el sistema de carga de archivos Excel para manejar correctamente los valores según el sistema de calificaciones real usado por los docentes.

---

## 📊 Valores Actualizados

### Antes ❌

| Valor | Significado | Estado |
|-------|-------------|--------|
| Vacío o "A" | Pendiente | No calificado |
| "D" | No entregada | Notifica |
| 0-5 | Calificación | Calificado |

### Ahora ✅

**IMPORTANTE:** Sistema externo solo envía estos valores. NO se aceptan números.

| Valor | Significado | Estado | ¿Notifica? |
|-------|-------------|--------|------------|
| **Vacío** | Pendiente (aún no calificado) | Pendiente | ❌ No |
| **A** | Aprobó la tarea (calificación final) | Calificada | ❌ No |
| **D** | Desaprobó/Reprobó (calificación final) | Calificada | ❌ No |
| **-** | No entregó (no presentó nada) | No Entregada | ✅ Sí (si pasó fecha límite) |

---

## 🔍 Diferencias Clave

### ¿Cuándo se notifica?

**❌ NO se notifica cuando:**
- La celda está vacía (pendiente de calificar)
- Está marcada con "A" (aprobó, calificación final positiva)
- Está marcada con "D" (desaprobó, calificación final negativa pero sí entregó)

**✅ SÍ se notifica cuando:**
- Está marcada con "-" (guion) = No entregó
- Y ya pasó la fecha límite configurada

### Ejemplo Real

**Escenario:** Taller 1 tenía fecha límite 2024-10-20 (ya pasó)

```
Juan Pérez (archivo del sistema externo):
  - Taller 1: A     → No notifica (aprobó)
  - Taller 2: D     → No notifica (reprobó, pero entregó)
  - Taller 3: -     → ✅ NOTIFICA (no entregó y ya pasó fecha)
  - Taller 4: vacío → No notifica (aún pendiente)
  - Taller 5: vacío → No notifica (aún pendiente)

María García:
  - Taller 1: A     → No notifica (aprobó)
  - Taller 2: A     → No notifica (aprobó)
  - Taller 3: A     → No notifica (aprobó)
  - Taller 4: vacío → No notifica (pendiente)
  - Taller 5: vacío → No notifica (pendiente)
```

**Resultado:** Solo se notifica sobre Juan Pérez - Taller 3

---

## 🎨 Cambios en la Interfaz

### Nuevas Métricas

Se agregó una nueva métrica en el dashboard:

```
Antes:
[Archivos] [Validados] [Guardados] [Estudiantes] [Calificadas] [Pendientes]

Ahora:
[Archivos] [Validados] [Guardados] [Estudiantes] [Calificadas] [Pendientes] [No Entregadas]
                                                                                    ↑
                                                                                  NUEVO
```

### Tabla de Archivos

Ahora muestra "No Entregadas" en rojo cuando hay tareas marcadas con "-":

```
Evidencias:
  ✅ 15 calificadas
  🟡 8 pendientes
  🔴 2 no entregadas  ← NUEVO (solo aparece si hay > 0)
```

---

## 📋 Mensajes del Sistema

### Al cargar archivo con Actualización

**Antes:**
```
✅ Calificaciones actualizadas: 20 calificaciones registradas
```

**Ahora:**
```
✅ Calificaciones actualizadas: 20 calificadas, 2 no entregadas
⚠️ 2 tareas marcadas como no entregadas. Se notificará si pasaron las fechas límite.
```

---

## 🛠️ Cambios Técnicos

### Interfaces TypeScript

Se actualizó la interface `UploadedFile`:

```typescript
interface UploadedFile {
  // ... campos existentes
  evidenciasNoEntregadas: number; // ← NUEVO
}
```

### Procesamiento de Valores

```typescript
// Lógica actualizada
if (valor === '') {
  estado = 'pendiente';
} else if (valor === 'A') {
  estado = 'calificada';  // Antes: 'pendiente'
  calificacion = 'A';
} else if (valor === 'D') {
  estado = 'calificada';  // Antes: 'no_entregada'
  calificacion = 'D';
} else if (valor === '-') {  // ← NUEVO
  estado = 'no_entregada';
  calificacion = '-';
  totalEvidenciasNoEntregadas++;
}
```

---

## 📖 Documentación Actualizada

Se actualizaron los siguientes archivos:

1. ✅ **GUIA_CARGA_CALIFICACIONES.md** - Ejemplos y valores permitidos
2. ✅ **FileUploadManagement.tsx** - Lógica de procesamiento
3. ✅ **Alert informativo** - Mensajes en la interfaz

---

## ✅ Checklist de Validación

Para verificar que todo funciona correctamente:

- [ ] Cargar Excel con celdas vacías → Muestra como "Pendiente"
- [ ] Cargar Excel con "A" → Muestra como "Calificada", no notifica
- [ ] Cargar Excel con "D" → Muestra como "Calificada", no notifica
- [ ] Cargar Excel con "-" → Muestra como "No Entregada", notifica si pasó fecha
- [ ] Cargar Excel con números → Muestra como "Calificada"
- [ ] Contador "No Entregadas" se actualiza correctamente
- [ ] Tabla muestra línea roja solo si hay no entregadas

---

## 💡 Recomendaciones de Uso

### Para Docentes

1. **Al inicio del periodo:**
   - Crea el Excel con todos los estudiantes
   - Deja todas las evidencias **vacías**
   - Tipo de carga: "Configuración Inicial"

2. **Cada semana al calificar:**
   - **A** = Estudiante aprobó la tarea
   - **D** = Estudiante reprobó pero entregó algo
   - **-** = Estudiante NO entregó nada
   - **Vacío** = Aún no has calificado esa tarea
   - **Número** = Calificación exacta

3. **Solo marca "-" cuando:**
   - El estudiante definitivamente NO entregó
   - Ya pasó la fecha límite
   - Quieres que se notifique al coordinador

### Para Administradores

- Las notificaciones se generan solo para "-" después de fecha límite
- "A" y "D" son calificaciones válidas (aprobó/reprobó)
- El sistema NO molesta con notificaciones de tareas pendientes

---

## 🎓 Resumen Ejecutivo

**¿Qué cambió?**
- "A" ahora significa "Aprobó" (calificación final ✅)
- "D" ahora significa "Desaprobó" (calificación final ❌, pero sí entregó)
- "-" (nuevo) significa "No Entregó" (notifica 🔔)
- **Eliminado:** Soporte para calificaciones numéricas (0-5)

**¿Por qué?**
- El sistema externo solo envía: vacío, A, D, o -
- No es posible modificar el formato del archivo externo
- "A" y "D" son las únicas calificaciones finales del sistema
- Solo "-" requiere notificación porque es no entrega

**¿Impacto?**
- Menos notificaciones innecesarias
- Sistema alineado con archivo externo
- Solo 4 valores posibles: vacío, A, D, -
- Mejor seguimiento de entregas vs no entregas
- Validación más estricta (rechaza números y otros valores)

---

## 📞 Soporte

Si tienes dudas sobre los cambios:

1. Revisa **GUIA_CARGA_CALIFICACIONES.md** para ejemplos
2. El mensaje de ayuda en la interfaz explica los valores
3. Los errores de validación son más descriptivos

**Fecha de actualización:** Octubre 2024