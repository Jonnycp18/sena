# 🔧 Guía de Corrección de Errores - React + Radix UI

## 📋 Resumen de Errores Encontrados

Se encontraron **3 tipos de errores** críticos que impedían el correcto funcionamiento:

1. ❌ **Error de Refs en componentes funcionales**
2. ❌ **Falta de descripción en diálogos (Accesibilidad)**
3. ❌ **SelectItem con value vacío (Radix UI)**

---

## 🔴 ERROR #1: Function components cannot be given refs

### 📌 El Error Completo:
```
Warning: Function components cannot be given refs. 
Attempts to access this ref will fail. 
Did you mean to use React.forwardRef()?

Check the render method of `SlotClone`. 
    at DialogOverlay (components/ui/dialog.tsx:38:2)
```

### ❓ ¿Por qué fallaba?

Los componentes `DialogOverlay` y `DialogContent` en `/components/ui/dialog.tsx` eran **funciones normales** que recibían props, pero **NO podían recibir refs**.

#### Código INCORRECTO (así estaba antes):
```tsx
// ❌ ESTO NO FUNCIONA
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out...",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />  {/* ❌ Aquí intenta pasar una ref implícitamente */}
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn("...", className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="...">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
```

### ✅ ¿Por qué NO funcionaba?

1. **Radix UI internamente intenta pasar refs** a los componentes Overlay y Content
2. Las funciones normales **NO pueden recibir refs** en React
3. Cuando `<DialogOverlay />` se renderiza, Radix intenta pasarle una ref pero falla
4. Esto causa el warning y puede romper funcionalidades como animaciones y focus trap

### 🛠️ SOLUCIÓN:

Usar `React.forwardRef` para que los componentes puedan recibir refs:

#### Código CORRECTO:

```tsx
// ✅ CORRECTO - Con React.forwardRef
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}  // ← Ahora recibimos y pasamos el ref
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}  // ← Ahora recibimos y pasamos el ref
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;
```

### 📝 Cambios Necesarios en tu Proyecto:

**Archivo: `/components/ui/dialog.tsx`**

1. **Cambiar la función `DialogOverlay`:**
   - De: `function DialogOverlay({ ... })` 
   - A: `const DialogOverlay = React.forwardRef<...>(({ ... }, ref) => { ... })`
   - Agregar el segundo parámetro `ref`
   - Pasar `ref={ref}` al componente interno
   - Agregar `DialogOverlay.displayName = ...`

2. **Cambiar la función `DialogContent`:**
   - Mismo proceso que DialogOverlay
   - Asegurarse de pasar `ref={ref}` a `DialogPrimitive.Content`

### 🎯 Resultado:
✅ No más warnings de refs  
✅ Animaciones funcionan correctamente  
✅ Focus trap funciona bien  
✅ Accesibilidad mejorada  

---

## 🔴 ERROR #2: Missing Description for DialogContent

### 📌 El Error Completo:
```
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
```

### ❓ ¿Por qué fallaba?

Según las **reglas de accesibilidad ARIA**, todo diálogo debe tener:
1. Un **título** (`<DialogTitle>`)
2. Una **descripción** (`<DialogDescription>`)

Esto es para que los lectores de pantalla puedan informar correctamente a usuarios con discapacidades visuales sobre el propósito del diálogo.

#### Código INCORRECTO (así estaba antes):

```tsx
// ❌ FALTA DialogDescription
<Dialog open={isFichaFormOpen} onOpenChange={setIsFichaFormOpen}>
  <DialogTrigger asChild>
    <Button>Nueva Ficha</Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>
        {editingFicha ? 'Editar Ficha' : 'Crear Ficha'}
      </DialogTitle>
      {/* ❌ FALTA ESTO: <DialogDescription>...</DialogDescription> */}
    </DialogHeader>
    <FichaForm
      ficha={editingFicha}
      onSubmit={editingFicha ? handleEditFicha : handleCreateFicha}
      onCancel={() => setIsFichaFormOpen(false)}
    />
  </DialogContent>
</Dialog>
```

### ✅ ¿Por qué NO funcionaba?

1. **Radix UI verifica automáticamente** si existe un `DialogDescription`
2. Si no existe, lanza un warning de accesibilidad
3. Los lectores de pantalla no pueden describir el propósito del diálogo
4. Incumple con las normas **WCAG 2.1** de accesibilidad web

### 🛠️ SOLUCIÓN:

Agregar `DialogDescription` dentro del `DialogHeader`:

#### Código CORRECTO:

```tsx
// ✅ CORRECTO - Con DialogDescription
<Dialog open={isFichaFormOpen} onOpenChange={setIsFichaFormOpen}>
  <DialogTrigger asChild>
    <Button>Nueva Ficha</Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>
        {editingFicha ? 'Editar Ficha' : 'Crear Ficha'}
      </DialogTitle>
      {/* ✅ AGREGADO */}
      <DialogDescription>
        {editingFicha 
          ? 'Actualiza la información del programa académico' 
          : 'Completa los datos para crear un nuevo programa académico'}
      </DialogDescription>
    </DialogHeader>
    <FichaForm
      ficha={editingFicha}
      onSubmit={editingFicha ? handleEditFicha : handleCreateFicha}
      onCancel={() => setIsFichaFormOpen(false)}
    />
  </DialogContent>
</Dialog>
```

### 📝 Cambios Necesarios en tu Proyecto:

**Archivos afectados:**
- `/components/FichasMateriasManagement.tsx`
- Cualquier otro archivo que use `<Dialog>` sin `<DialogDescription>`

**Pasos:**

1. **Importar DialogDescription:**
```tsx
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,  // ← Agregar esta importación
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
```

2. **Agregar DialogDescription en cada Dialog:**

Busca todos los `<DialogHeader>` y agrega `<DialogDescription>`:

```tsx
<DialogHeader>
  <DialogTitle>Tu Título Aquí</DialogTitle>
  {/* ✅ AGREGAR ESTO */}
  <DialogDescription>
    Una breve descripción del propósito de este diálogo
  </DialogDescription>
</DialogHeader>
```

**Ejemplos según el contexto:**

| Contexto | DialogDescription sugerido |
|----------|---------------------------|
| Crear usuario | "Completa los datos para crear un nuevo usuario en el sistema" |
| Editar usuario | "Actualiza la información del usuario" |
| Eliminar (AlertDialog) | Ya incluye AlertDialogDescription - no necesita cambios |
| Crear ficha | "Completa los datos para crear un nuevo programa académico" |
| Editar ficha | "Actualiza la información del programa académico" |
| Crear materia | "Completa los datos para crear una nueva materia" |
| Ver detalles | "Información completa y detallada del elemento" |

### 🎯 Resultado:
✅ No más warnings de accesibilidad  
✅ Lectores de pantalla funcionan correctamente  
✅ Cumplimiento con WCAG 2.1  
✅ Mejor UX para usuarios con discapacidades  

---

## 🔴 ERROR #3: SelectItem cannot have empty value

### 📌 El Error Completo:
```
Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear 
the selection and show the placeholder.
```

### ❓ ¿Por qué fallaba?

**Radix UI Select** usa el valor vacío (`""`) internamente para representar "sin selección" y mostrar el placeholder.

Si creas un `<SelectItem value="">`, estás **reservando el valor vacío**, lo que rompe el mecanismo interno de Radix.

#### Código INCORRECTO (así estaba antes):

```tsx
// ❌ ESTO CAUSA ERROR
<Select 
  value={formData.docenteId} 
  onValueChange={(value) => handleInputChange('docenteId', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona un docente (opcional)" />
  </SelectTrigger>
  <SelectContent>
    {/* ❌ ERROR: value="" está reservado por Radix */}
    <SelectItem value="">Sin asignar</SelectItem>
    {mockDocentes.map((docente) => (
      <SelectItem key={docente.id} value={docente.id}>
        {docente.nombre}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### ✅ ¿Por qué NO funcionaba?

1. **Radix UI reserva `value=""` internamente** para el estado "sin selección"
2. Si pones `<SelectItem value="">`, estás **intentando usar el valor reservado**
3. Esto causa un conflicto y React lanza un error fatal
4. El componente se rompe y puede causar que toda la app se caiga

### 🛠️ SOLUCIÓN:

Usar un valor especial como `"none"` o `"undefined"` en lugar de cadena vacía:

#### Código CORRECTO:

```tsx
// ✅ CORRECTO - Usando "none" en lugar de ""
<Select 
  value={formData.docenteId || undefined}  // ← Si está vacío, pasar undefined
  onValueChange={(value) => handleInputChange('docenteId', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona un docente (opcional)" />
  </SelectTrigger>
  <SelectContent>
    {/* ✅ Usar "none" en lugar de "" */}
    <SelectItem value="none">Sin asignar</SelectItem>
    {mockDocentes.map((docente) => (
      <SelectItem key={docente.id} value={docente.id}>
        {docente.nombre}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**IMPORTANTE:** También debes actualizar el `onValueChange` para convertir `"none"` de vuelta a vacío:

```tsx
// Opción 1: Directamente en el onChange
<Select 
  value={formData.docenteId || undefined}
  onValueChange={(value) => {
    // Si selecciona "none", guardar como vacío
    const finalValue = value === 'none' ? '' : value;
    handleInputChange('docenteId', finalValue);
  }}
>

// Opción 2: Si ya tienes un handler, puedes omitirlo
// porque "none" también es válido como valor
<Select 
  value={formData.docenteId || undefined}
  onValueChange={(value) => handleInputChange('docenteId', value)}
>
```

### 📝 Cambios Necesarios en tu Proyecto:

**Archivos afectados:**
- `/components/MateriaForm.tsx` (línea 370)
- `/components/FileUploadManagement.tsx` (línea 1450)
- Cualquier otro `<Select>` que tenga un `<SelectItem value="">`

**Pasos detallados:**

#### **Cambio 1: MateriaForm.tsx**

**ANTES (líneas 360-381):**
```tsx
<Select 
  value={formData.docenteId} 
  onValueChange={(value) => handleInputChange('docenteId', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona un docente (opcional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">Sin asignar</SelectItem>  {/* ❌ */}
    {mockDocentes.map((docente) => (
      <SelectItem key={docente.id} value={docente.id}>
        {docente.nombre}
        {docente.especialidad && (
          <span className="text-muted-foreground"> - {docente.especialidad}</span>
        )}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**DESPUÉS:**
```tsx
<Select 
  value={formData.docenteId || undefined}  {/* ✅ Cambio 1 */}
  onValueChange={(value) => handleInputChange('docenteId', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona un docente (opcional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Sin asignar</SelectItem>  {/* ✅ Cambio 2 */}
    {mockDocentes.map((docente) => (
      <SelectItem key={docente.id} value={docente.id}>
        {docente.nombre}
        {docente.especialidad && (
          <span className="text-muted-foreground"> - {docente.especialidad}</span>
        )}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### **Cambio 2: FileUploadManagement.tsx**

**ANTES (líneas 1442-1455):**
```tsx
<Select 
  value={columnMapping.email || ''} 
  onValueChange={(value) => setColumnMapping(prev => ({ ...prev, email: value }))}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona columna" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">Sin mapear</SelectItem>  {/* ❌ */}
    {availableColumns.map((col) => (
      <SelectItem key={col} value={col}>{col}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**DESPUÉS:**
```tsx
<Select 
  value={columnMapping.email || undefined}  {/* ✅ Cambio 1 */}
  onValueChange={(value) => setColumnMapping(prev => ({ 
    ...prev, 
    email: value === 'none' ? '' : value  {/* ✅ Cambio 3: Convertir "none" a "" */}
  }))}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona columna" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Sin mapear</SelectItem>  {/* ✅ Cambio 2 */}
    {availableColumns.map((col) => (
      <SelectItem key={col} value={col}>{col}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 🔍 Cómo Encontrar TODOS los Casos en tu Proyecto:

Busca en todos los archivos `.tsx`:

```bash
# Buscar SelectItem con value vacío
grep -r 'SelectItem value=""' --include="*.tsx"

# O en Windows con PowerShell:
Get-ChildItem -Recurse -Filter *.tsx | Select-String 'SelectItem value=""'

# O usando VS Code:
# Ctrl+Shift+F → Buscar: SelectItem value=""
```

### 🎯 Resultado:
✅ No más errores de Radix UI Select  
✅ Select funciona correctamente con valores opcionales  
✅ No se rompe la app al seleccionar "Sin asignar"  
✅ Placeholder se muestra correctamente  

---

## 📊 TABLA RESUMEN DE CAMBIOS

| Archivo | Línea Aprox. | Cambio | Razón |
|---------|--------------|--------|-------|
| `/components/ui/dialog.tsx` | 37-51 | `function DialogOverlay` → `const DialogOverlay = React.forwardRef` | Permitir refs en componentes |
| `/components/ui/dialog.tsx` | 53-77 | `function DialogContent` → `const DialogContent = React.forwardRef` | Permitir refs en componentes |
| `/components/FichasMateriasManagement.tsx` | 10 | Importar `DialogDescription` | Agregar descripción accesible |
| `/components/FichasMateriasManagement.tsx` | 807-815 | Agregar `<DialogDescription>` en Dialog de Ficha | Cumplir con ARIA |
| `/components/FichasMateriasManagement.tsx` | 988-996 | Agregar `<DialogDescription>` en Dialog de Materia | Cumplir con ARIA |
| `/components/MateriaForm.tsx` | 363 | `value={formData.docenteId}` → `value={formData.docenteId \|\| undefined}` | Evitar conflicto con Radix |
| `/components/MateriaForm.tsx` | 370 | `<SelectItem value="">` → `<SelectItem value="none">` | Usar valor válido |
| `/components/FileUploadManagement.tsx` | 1443 | `value={columnMapping.email \|\| ''}` → `value={columnMapping.email \|\| undefined}` | Evitar conflicto con Radix |
| `/components/FileUploadManagement.tsx` | 1444 | Agregar conversión `value === 'none' ? '' : value` | Convertir "none" a vacío |
| `/components/FileUploadManagement.tsx` | 1450 | `<SelectItem value="">` → `<SelectItem value="none">` | Usar valor válido |

---

## 🚀 GUÍA DE IMPLEMENTACIÓN PASO A PASO

### Paso 1: Arreglar DialogOverlay y DialogContent

**Archivo:** `/components/ui/dialog.tsx`

1. Busca la línea que dice:
   ```tsx
   function DialogOverlay({
   ```

2. Reemplázala con:
   ```tsx
   const DialogOverlay = React.forwardRef<
     React.ElementRef<typeof DialogPrimitive.Overlay>,
     React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
   >(({ className, ...props }, ref) => {
   ```

3. Dentro de la función, cambia:
   ```tsx
   <DialogPrimitive.Overlay
     data-slot="dialog-overlay"
   ```
   
   Por:
   ```tsx
   <DialogPrimitive.Overlay
     ref={ref}
     data-slot="dialog-overlay"
   ```

4. Al final del componente (antes del closing brace), agrega:
   ```tsx
   });
   DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
   ```

5. **Repite el mismo proceso para `DialogContent`** (líneas 53-77 aproximadamente)

### Paso 2: Agregar DialogDescription

**Archivo:** `/components/FichasMateriasManagement.tsx`

1. En los imports (línea 10), asegúrate de que esté:
   ```tsx
   import { 
     Dialog, 
     DialogContent, 
     DialogDescription,  // ← Verifica que esté
     DialogHeader, 
     DialogTitle, 
     DialogTrigger 
   } from './ui/dialog';
   ```

2. Busca cada `<DialogHeader>` en el archivo (hay 3)

3. Dentro de cada uno, después del `<DialogTitle>`, agrega:
   ```tsx
   <DialogDescription>
     Descripción apropiada según el contexto
   </DialogDescription>
   ```

### Paso 3: Arreglar SelectItem con value vacío

**Archivo:** `/components/MateriaForm.tsx`

1. Busca la línea 363 (aproximadamente):
   ```tsx
   value={formData.docenteId}
   ```
   
2. Cámbiala por:
   ```tsx
   value={formData.docenteId || undefined}
   ```

3. Busca la línea 370:
   ```tsx
   <SelectItem value="">Sin asignar</SelectItem>
   ```
   
4. Cámbiala por:
   ```tsx
   <SelectItem value="none">Sin asignar</SelectItem>
   ```

**Archivo:** `/components/FileUploadManagement.tsx`

1. Busca la línea 1443:
   ```tsx
   value={columnMapping.email || ''}
   ```
   
2. Cámbiala por:
   ```tsx
   value={columnMapping.email || undefined}
   ```

3. Busca la línea 1444:
   ```tsx
   onValueChange={(value) => setColumnMapping(prev => ({ ...prev, email: value }))}
   ```
   
4. Cámbiala por:
   ```tsx
   onValueChange={(value) => setColumnMapping(prev => ({ 
     ...prev, 
     email: value === 'none' ? '' : value 
   }))}
   ```

5. Busca la línea 1450:
   ```tsx
   <SelectItem value="">Sin mapear</SelectItem>
   ```
   
6. Cámbiala por:
   ```tsx
   <SelectItem value="none">Sin mapear</SelectItem>
   ```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de hacer todos los cambios, verifica:

- [ ] No hay warnings de `Function components cannot be given refs`
- [ ] No hay warnings de `Missing Description`
- [ ] No hay errores de `SelectItem must have a value prop that is not an empty string`
- [ ] Los diálogos se abren y cierran correctamente
- [ ] Las animaciones funcionan suavemente
- [ ] Los Select con opción "Sin asignar" funcionan
- [ ] El focus trap funciona al abrir diálogos
- [ ] Los lectores de pantalla pueden leer las descripciones de los diálogos

---

## 🎓 CONCEPTOS CLAVE APRENDIDOS

### 1. React.forwardRef
- **¿Qué es?** Un wrapper que permite que los componentes funcionales reciban refs
- **¿Cuándo usarlo?** Cuando un componente necesita exponer su elemento DOM interno
- **Sintaxis:**
  ```tsx
  const MiComponente = React.forwardRef<HTMLDivElement, MiProps>(
    (props, ref) => {
      return <div ref={ref}>{props.children}</div>;
    }
  );
  ```

### 2. Accesibilidad ARIA
- **DialogDescription es obligatorio** para cumplir con WCAG 2.1
- Los lectores de pantalla necesitan tanto título como descripción
- Siempre incluir contexto descriptivo en diálogos modales

### 3. Radix UI Select
- El valor `""` (cadena vacía) está **reservado internamente**
- Usar valores como `"none"`, `"undefined"` o `"empty"` para "sin selección"
- Convertir estos valores de vuelta a `""` en el `onValueChange` si es necesario

---

## 📞 PREGUNTAS FRECUENTES

**Q: ¿Por qué no simplemente remover el SelectItem con value=""?**  
A: Porque el usuario necesita una forma de "deseleccionar" o elegir "Sin asignar". Simplemente usar `undefined` como value del Select lo haría, pero no es intuitivo visualmente.

**Q: ¿Puedo usar `aria-describedby` en lugar de DialogDescription?**  
A: Sí, pero `DialogDescription` es la forma recomendada por Radix UI y maneja automáticamente los atributos ARIA correctos.

**Q: ¿Tengo que agregar forwardRef a TODOS mis componentes?**  
A: No, solo a aquellos que:
- Son wrapeados por librerías que necesitan refs (como Radix UI)
- Necesitan exponer su elemento DOM interno
- Son usados con `ref` en algún lugar del código

**Q: ¿Qué pasa si tengo muchos Selects con value vacío?**  
A: Debes buscar todos con `grep` o búsqueda global y cambiarlos uno por uno. Es tedioso pero necesario para que funcione correctamente.

---

## 🎯 CONCLUSIÓN

Estos 3 errores son **muy comunes** al trabajar con:
- ✅ Radix UI (especialmente Select y Dialog)
- ✅ Componentes de UI de shadcn/ui
- ✅ Formularios con opciones opcionales

Ahora que los has corregido, tu aplicación:
- ✅ Es más accesible (WCAG 2.1)
- ✅ No tiene warnings en consola
- ✅ Funciona correctamente con refs
- ✅ Los Select manejan valores vacíos apropiadamente

**¡Felicidades!** 🎉 Has mejorado significativamente la calidad de tu código React.
