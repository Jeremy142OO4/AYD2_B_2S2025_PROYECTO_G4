import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/login'
import { Navbar } from '../components/Navbar'
import type { UserRole } from '../util/auth'
import AgenteLogistico from '../pages/Agente_logistico/agente_logistico'
import MenuInicial from '../pages/Agente_logistico/Menu_inicial'
import { getCurrentUser, signOut } from '../util/auth'
import Ordenes from '../pages/Agente_logistico/Ordenes'	
import Crear_orden from '../pages/Agente_logistico/Crear_Orden'
import Vehiculos from '../pages/Agente_logistico/Vehiculos'
import CrearCamion from '../pages/Agente_logistico/Crear_Camion'
import Pilotos from '../pages/Agente_logistico/Pilotos'
import CrearPiloto from '../pages/Agente_logistico/Crear_Piloto'
import Bitacora from '../pages/Agente_logistico/Bitacora'
import DashboardPatio from '../pages/Patio/dashboard_patio'
import Validar_orden from '../pages/Patio/ValidarOrden'
import ViajesPiloto from '../pages/Piloto/Viajes_piloto'
import DeatalleViaje from '../pages/Piloto/Detalle_Viaje'
import DashboardClientePage from '../pages/Cliente/dashboard_cliente'
import SolicitudesClientePage from '../pages/Cliente/solicitudes_cliente'
import SeguimientoClientePage from '../pages/Cliente/seguimiento_cliente'
import PagosClientePage from '../pages/Cliente/pagos_cliente'
import EstadoCuentaClientePage from '../pages/Cliente/Estado_cuenta_cliente'
import PerfilClientePage from '../pages/Cliente/perfil_cliente'
import DashboardOperativoPage from '../pages/Operativo/dashboard_operativo'
import ClientesOperativoPage from '../pages/Operativo/clientes_operativo.tsx'
import ContratoOperativoPage from '../pages/Operativo/contrato_operativo'
import ServicioOperativoPage from '../pages/Operativo/servicio_operativo'
<<<<<<< HEAD
import DashboardFinancieroPage from '../pages/Financiero/dashboard_financiero'
import FacturacionFinanciamientoPage from '../pages/Financiero/facturacion_financiamiento.tsx'
import PagosFinancieroPage from '../pages/Financiero/pagos_financiero.tsx'
import EstadoCuenaFinancieroPage from '../pages/Financiero/estado_cuentas_financiero.tsx'
import PerfilFinancieroPage from '../pages/Financiero/perfil_financiero.tsx'
import DashboardGerentePage from '../pages/dashboard_gerente'
import Bitacora_piloto from '../pages/Piloto/BitacoraPiloto.tsx'
=======
import FacturacionFinanciamientoPage from '../pages/Financiero/facturacion_financiamiento'
import PagosFinancieroPage from '../pages/Financiero/pagos_financiero'
import EstadoCuenaFinancieroPage from '../pages/Financiero/estado_cuentas_financiero'
import DashboardGerentePage from '../pages/Gerencia/dashboard_gerente'
>>>>>>> feature/frontend/conexion_operativo_parte2_202300813

function RequireAuth({ children }: { children: ReactElement }) {
  return getCurrentUser() ? children : <Navigate to="/login" replace />
}

function RequireRole({
  children,
  role,
}: {
  children: ReactElement
  role: UserRole
}) {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

function NavbarShell({
  children,
  onLogout,
}: {
  children: ReactElement
  onLogout?: () => void
}) {
  const user = getCurrentUser()

  const rolesWithTopButtons: UserRole[] = [
    'Cliente',
    'Agente Operativo',
    'Agente Financiero',
    'Gerencia',
  ]

  if (!user || !rolesWithTopButtons.includes(user.role)) {
    return children
  }

  return (
    <>
      <Navbar user={user} onLogout={onLogout} />
      {children}
    </>
  )
}

function RedirectToLanding() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  switch (user.role) {
    case 'Cliente':
      return <Navigate to="/cliente/dashboard" replace />
    case 'Agente Operativo':
      return <Navigate to="/operativo/dashboard" replace />
    case 'Agente Logistico':
      return <Navigate to="/agente_logistico" replace />
    case 'Encargado del Patio':
      return <Navigate to="/dashboard_patio" replace />
    case 'Piloto':
      return <Navigate to="/Viajes" replace />
    case 'Agente Financiero':
      return <Navigate to="/financiero/dashboard" replace />
    case 'Gerencia':
      return <Navigate to="/gerencia/dashboard" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

function LegacyPortalRedirect() {
  return <RedirectToLanding />
}

function ReportesOperativoPlaceholder() {
  return <div className="op-module"><div className="op-toolbar"><h2 className="op-title">Reportes</h2></div><div className="op-panel">Modulo opcional de Fase 2. Se deja en blanco por ahora.</div></div>
}

export default function AppRouter() {
  const handleLogout = () => {
    signOut()
    window.location.href = "/login"
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectToLanding />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/portal"
          element={
            <RequireAuth>
              <LegacyPortalRedirect />
            </RequireAuth>
          }
        />

        <Route
          path="/portal/:section"
          element={
            <RequireAuth>
              <LegacyPortalRedirect />
            </RequireAuth>
          }
        />

        <Route
          path="/cliente/dashboard"
          element={
            <RequireRole role="Cliente">
                <NavbarShell onLogout={handleLogout}>
                  <DashboardClientePage />
                </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/cliente/solicitudes"
          element={
            <RequireRole role="Cliente">
                <NavbarShell onLogout={handleLogout}>
                  <SolicitudesClientePage />
                </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/cliente/seguimiento"
          element={
            <RequireRole role="Cliente">
                <NavbarShell onLogout={handleLogout}>
                  <SeguimientoClientePage />
                </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/cliente/pagos"
          element={
            <RequireRole role="Cliente">
                <NavbarShell onLogout={handleLogout}>
                  <PagosClientePage />
                </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/cliente/estado-cuenta"
          element={
            <RequireRole role="Cliente">
                <NavbarShell onLogout={handleLogout}>
                  <EstadoCuentaClientePage />
                </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/cliente/perfil"
          element={
            <RequireRole role="Cliente">
                <NavbarShell onLogout={handleLogout}>
                  <PerfilClientePage />
                </NavbarShell>
            </RequireRole>
          }
        />

        <Route
          path="/operativo/dashboard"
          element={
            <RequireRole role="Agente Operativo">
              <NavbarShell onLogout={handleLogout}>
                <DashboardOperativoPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/operativo/clientes"
          element={
            <RequireRole role="Agente Operativo">
              <NavbarShell onLogout={handleLogout}>
                <ClientesOperativoPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/operativo/contratos"
          element={
            <RequireRole role="Agente Operativo">
              <NavbarShell onLogout={handleLogout}>
                <ContratoOperativoPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/operativo/ordenes-servicio"
          element={
            <RequireRole role="Agente Operativo">
              <NavbarShell onLogout={handleLogout}>
                <ServicioOperativoPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/operativo/reportes"
          element={
            <RequireRole role="Agente Operativo">
              <NavbarShell onLogout={handleLogout}>
                <ReportesOperativoPlaceholder />
              </NavbarShell>
            </RequireRole>
          }
        />

        <Route
          path="/financiero/dashboard"
          element={
            <RequireRole role="Agente Financiero">
              <NavbarShell onLogout={handleLogout}>
                <DashboardFinancieroPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/financiero/facturacion"
          element={
            <RequireRole role="Agente Financiero">
              <NavbarShell onLogout={handleLogout}>
                <FacturacionFinanciamientoPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/financiero/pagos"
          element={
            <RequireRole role="Agente Financiero">
              <NavbarShell onLogout={handleLogout}>
                <PagosFinancieroPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/financiero/estado-cuenta"
          element={
            <RequireRole role="Agente Financiero">
              <NavbarShell onLogout={handleLogout}>
                <EstadoCuenaFinancieroPage />
              </NavbarShell>
            </RequireRole>
          }
        />
        <Route
          path="/financiero/perfil"
          element={
            <RequireRole role="Agente Financiero">
              <NavbarShell onLogout={handleLogout}>
                <PerfilFinancieroPage />
              </NavbarShell>
            </RequireRole>
          }
        />

        <Route
          path="/gerencia/dashboard"
          element={
            <RequireRole role="Gerencia">
              <NavbarShell onLogout={handleLogout}>
                <DashboardGerentePage activeSection="dashboard" />
              </NavbarShell>
            </RequireRole>
          }
        />

        <Route
          path="/agente_logistico"
          element={
            <RequireRole role="Agente Logistico">
              <MenuInicial onLogout={handleLogout} />
            </RequireRole>
          }
        >
          <Route index element={<AgenteLogistico />} />
			<Route path="ordenes" element={<Ordenes/>}/>
			<Route path="crear_orden" element={<Crear_orden/>}/>
			<Route path="vehiculos" element={<Vehiculos/>}/>
			<Route path="crear_camion" element={<CrearCamion/>}/>
			<Route path="piloto" element={<Pilotos/>}/>
						<Route path="crear_piloto" element={<CrearPiloto/>}/>
			<Route path="bitacora" element={<Bitacora/>}/>

        </Route>

	<Route
          path="/dashboard_patio"
          element={
            <RequireRole role="Encargado del Patio">
              <DashboardPatio />
            </RequireRole>
          }
        />

        <Route
          path="/dashboard_patio/validar_orden"
          element={
            <RequireRole role="Encargado del Patio">
              <Validar_orden />
            </RequireRole>
          }
        />


	<Route
          path="/Viajes"
          element={
            <RequireRole role="Piloto">
              <ViajesPiloto />
            </RequireRole>
          }
        />
        <Route
          path="/Viajes/detalle"
          element={
            <RequireRole role="Piloto">
              <DeatalleViaje />
            </RequireRole>
          }
        />

        <Route
          path="viajes/Historial"
          element={
            <RequireRole role="Piloto">
              <Bitacora_piloto />
            </RequireRole>
          }
        />



        <Route path="*" element={<RedirectToLanding />} />
      </Routes>
    </BrowserRouter>
  )
}