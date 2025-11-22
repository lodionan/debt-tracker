# Miry - Sistema de Registro de Deudas

Aplicación completa para gestión de deudas en negocio de joyería con versiones web y móvil.

## 🚀 Características

### Backend (Spring Boot)
- ✅ API REST completa con Spring Boot 3.2.0
- ✅ Autenticación JWT con roles (Admin/Cliente)
- ✅ Base de datos MySQL con JPA/Hibernate
- ✅ Control de acceso basado en roles
- ✅ Notificaciones automáticas semanales por email
- ✅ Reportes mensuales detallados
- ✅ Integración con Stripe para pagos con tarjeta
- ✅ Dashboard con estadísticas en tiempo real

### Frontend Web (React.js)
- ✅ Interfaz responsiva con React.js + TypeScript
- ✅ Dashboard administrativo completo
- ✅ Vista cliente limitada
- ✅ Gestión completa de clientes, deudas y pagos
- ✅ Gráficos y reportes visuales

### App Móvil (React Native)
- ✅ Apps nativas para Android e iOS
- ✅ Funcionalidades idénticas al web
- ✅ Notificaciones push
- ✅ Optimizada para dispositivos móviles

## 🛠️ Tecnologías

### Backend
- Java 17
- Spring Boot 3.2.0
- MySQL 8.0
- JWT Authentication
- Stripe Payment Gateway
- Spring Mail
- Spring Scheduling

### Frontend
- React.js 18
- TypeScript
- Axios
- React Router
- Tailwind CSS

### Móvil
- React Native
- Expo (opcional)
- React Navigation

### Despliegue
- Heroku (Backend)
- Vercel (Frontend Web)
- Google Play Store (Android)
- Apple App Store (iOS)

## 📋 Requisitos del Sistema

- Java 17+
- Node.js 16+
- MySQL 8.0+
- Maven 3.6+

## 🚀 Instalación y Configuración

### Backend

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd debt-tracker
   ```

2. **Configurar base de datos MySQL**
   ```sql
   CREATE DATABASE debt_tracker;
   ```

3. **Configurar variables de entorno**
   ```bash
   # En application.properties o variables de entorno
   spring.datasource.username=tu_usuario_mysql
   spring.datasource.password=tu_password_mysql
   jwt.secret=tu_jwt_secret
   stripe.secret.key=sk_test_tu_clave_stripe
   stripe.publishable.key=pk_test_tu_clave_stripe
   ```

4. **Compilar y ejecutar**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend Web

1. **Instalar dependencias**
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar API URL**
   ```bash
   # En .env
   REACT_APP_API_URL=http://localhost:8080
   ```

3. **Ejecutar desarrollo**
   ```bash
   npm start
   ```

### App Móvil

1. **Instalar dependencias**
   ```bash
   cd DebtTrackerMobile
   npm install
   ```

2. **Configurar API URL**
   ```javascript
   // En src/config/api.js
   export const API_BASE_URL = 'http://localhost:8080';
   ```

3. **Ejecutar en Android**
   ```bash
   npx react-native run-android
   ```

4. **Ejecutar en iOS**
   ```bash
   npx react-native run-ios
   ```

## 📱 Despliegue

### Backend en Heroku

1. **Crear aplicación**
   ```bash
   heroku create debt-tracker-api
   ```

2. **Configurar base de datos**
   ```bash
   heroku addons:create cleardb:ignite
   ```

3. **Configurar variables**
   ```bash
   heroku config:set JWT_SECRET=tu_jwt_secret
   heroku config:set STRIPE_SECRET_KEY=sk_test_tu_clave
   heroku config:set STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave
   ```

4. **Desplegar**
   ```bash
   git push heroku main
   ```

### Frontend en Vercel

1. **Conectar repositorio a Vercel**
2. **Configurar variables de entorno**
   ```
   REACT_APP_API_URL=https://debt-tracker-api.herokuapp.com
   ```
3. **Deploy automático**

### Apps Móviles

#### Google Play Store
1. **Generar APK/AAB**
   ```bash
   cd DebtTrackerMobile/android
   ./gradlew bundleRelease
   ```

2. **Crear cuenta de desarrollador**
3. **Subir aplicación**
4. **Configurar store listing**

#### Apple App Store
1. **Configurar Xcode**
2. **Generar build**
3. **Crear cuenta de desarrollador Apple**
4. **Subir via App Store Connect**

## 🔐 Autenticación

### Roles del Sistema
- **ADMIN**: Acceso completo a todas las funcionalidades
- **CLIENT**: Acceso limitado a sus propias deudas

### Endpoints de Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register-client` - Registro de clientes

## 📊 APIs Disponibles

### Clientes
- `GET /api/clients` - Listar clientes (Admin)
- `POST /api/clients` - Crear cliente (Admin)
- `PUT /api/clients/{id}` - Actualizar cliente (Admin)
- `DELETE /api/clients/{id}` - Eliminar cliente (Admin)

### Deudas
- `GET /api/debts` - Listar deudas
- `POST /api/debts` - Crear deuda (Admin)
- `PUT /api/debts/{id}` - Actualizar deuda (Admin)
- `DELETE /api/debts/{id}` - Eliminar deuda (Admin)

### Pagos
- `GET /api/payments` - Listar pagos
- `POST /api/payments` - Registrar pago
- `GET /api/payments/debt/{debtId}` - Pagos por deuda

### Reportes
- `GET /api/reports/monthly/{year}/{month}` - Reporte mensual
- `GET /api/reports/client/{clientId}` - Reporte por cliente
- `GET /api/dashboard` - Dashboard completo

### Pagos Gateway
- `POST /api/payments/gateway/create-intent` - Crear intención Stripe
- `POST /api/payments/gateway/cash` - Procesar pago en efectivo

## 📧 Notificaciones

- **Recordatorios semanales**: Automáticos cada domingo a las 9 AM
- **Notificaciones por email**: Configurables
- **Reportes mensuales**: Generación automática

## 🔒 Seguridad

- JWT tokens con expiración
- Bcrypt para hash de contraseñas
- CORS configurado
- Validación de entrada
- Control de acceso por roles

## 📈 Monitoreo

- Logs detallados
- Métricas de aplicación
- Dashboard de rendimiento
- Alertas automáticas

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: soporte@debttracker.com
- Documentación: [Wiki del proyecto]

---

**Desarrollado con ❤️ para negocios de joyería**