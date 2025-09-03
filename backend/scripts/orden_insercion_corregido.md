# Orden de Inserción de Datos Corregido
## Base de Datos Automatización CCB Santiago

### ✅ **Problema Solucionado**
**Error Original:** `Cannot add or update a child row: a foreign key constraint fails`

**Causa:** Las inserciones estaban desordenadas, intentando insertar datos en tablas dependientes antes de que existieran los datos padre.

---

## 📋 **Orden Correcto de Inserción**

### **1. Tablas Base (Sin Foreign Keys)**
```sql
-- Sin dependencias
INSERT INTO cuentas ...
INSERT INTO areas_conocimiento ...
INSERT INTO modalidades ...
INSERT INTO actividades ...
INSERT INTO regiones ...
INSERT INTO programas ...
INSERT INTO habilidades ...
```

### **2. Tablas con FK Simples**
```sql
-- Dependen de tablas base
INSERT INTO municipios ...              -- FK: regiones
INSERT INTO valor_horas_region ...      -- FK: regiones
INSERT INTO sectores ...                -- FK: areas_conocimiento
INSERT INTO valor_horas ...             -- FK: modalidades
INSERT INTO rutas ...                   -- FK: valor_horas
INSERT INTO usuarios_info ...           -- FK: cuentas, areas_conocimiento
```

### **3. Tablas con FK Múltiples**
```sql
-- Dependen de las anteriores
INSERT INTO ruta_sector ...             -- FK: rutas, sectores
INSERT INTO programa_ruta ...           -- FK: programas, rutas
INSERT INTO hojas_de_vida ...           -- FK: usuarios_info
INSERT INTO vacantes ...                -- FK: usuarios_info, rutas
INSERT INTO responsable_rutas ...       -- FK: cuentas, rutas
```

### **4. Tablas de Procesos**
```sql
-- Dependen de usuarios y vacantes
INSERT INTO postulaciones ...           -- FK: usuarios_info, vacantes, hojas_de_vida
INSERT INTO contratos ...               -- FK: postulaciones, usuarios_info
```

### **5. Tablas de Ejecución**
```sql
-- Dependen de contratos y usuarios
INSERT INTO programaciones_grupales ... -- FK: usuarios_info, programa_ruta, contratos, etc.
INSERT INTO programaciones_individuales ... -- FK: usuarios_info, programa_ruta, contratos, etc.
```

### **6. Tablas de Evidencias**
```sql
-- Dependen de programaciones
INSERT INTO evidencias_grupales ...     -- FK: usuarios_info, programaciones_grupales, responsable_rutas
INSERT INTO evidencias_individuales ... -- FK: usuarios_info, programaciones_individuales, responsable_rutas
```

### **7. Tablas de Informes**
```sql
-- Dependen de contratos y evidencias
INSERT INTO informes ...                -- FK: contratos, usuarios_info, evidencias
```

---

## 🔧 **Cambios Realizados**

### **Orden ANTERIOR (❌ Incorrecto):**
1. programa_ruta
2. **postulaciones** ❌ (antes de usuarios_info)
3. **contratos** ❌ (antes de postulaciones válidas)
4. usuarios_info
5. hojas_de_vida
6. vacantes
7. responsable_rutas
8. programaciones

### **Orden ACTUAL (✅ Correcto):**
1. cuentas
2. areas_conocimiento
3. modalidades, regiones, programas
4. municipios, valor_horas_region, sectores, valor_horas, rutas
5. ruta_sector, programa_ruta
6. **usuarios_info** ✅
7. **hojas_de_vida** ✅
8. **vacantes** ✅
9. **responsable_rutas** ✅
10. **postulaciones** ✅ (después de usuarios_info)
11. **contratos** ✅ (después de postulaciones)
12. **programaciones** ✅ (después de contratos)
13. **evidencias** ✅ (después de programaciones)
14. **informes** ✅ (después de evidencias)

---

## 🎯 **Verificación de Dependencias**

### **✅ Postulaciones**
- **usu_cedula** → usuarios_info ✅ (existe)
- **vac_id** → vacantes ✅ (existe)
- **hv_id** → hojas_de_vida ✅ (existe)

### **✅ Contratos**
- **pos_id** → postulaciones ✅ (existe)
- **usu_cedula** → usuarios_info ✅ (existe)

### **✅ Programaciones**
- **usu_cedula** → usuarios_info ✅ (existe)
- **oamp** → contratos ✅ (existe)
- **pr_id** → programa_ruta ✅ (existe)

### **✅ Evidencias**
- **usu_cedula** → usuarios_info ✅ (existe)
- **pro_id/proin_id** → programaciones ✅ (existe)
- **rr_id** → responsable_rutas ✅ (existe)

---

## 📊 **Datos Finales**
- **85 usuarios** (80 consultores + 4 profesionales + 1 reclutador)
- **20 hojas de vida** validadas
- **1 vacante** creada por reclutador
- **20 postulaciones** aprobadas
- **20 contratos** con consecutivos únicos
- **10 programaciones** (5 grupales + 5 individuales)
- **6 evidencias** (3 grupales + 3 individuales)
- **6 informes** generados automáticamente

**🎉 El script ahora debería ejecutarse sin errores de Foreign Key** 