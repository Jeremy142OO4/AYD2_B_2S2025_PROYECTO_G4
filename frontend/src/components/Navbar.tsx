import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@mui/material'
import {
  AdminPanelSettings,
  AttachMoney,
  Engineering,
  Groups,
  LocalShipping,
  NotificationsNone,
  PrecisionManufacturing,
  PersonOutline,
  SupportAgent,
} from '@mui/icons-material'
import type { SessionUser, UserRole } from '../util/auth'

type Props = {
  onLogout?: () => void
  user: SessionUser
}

type NavLink = {
  label: string
  section: string
}

type NotificationItem = {
  label: string
  section: string
  active?: boolean
}

function getDefaultRouteByRole(role: UserRole): string {
  switch (role) {
    case 'Cliente':
      return '/cliente/dashboard'
    case 'Agente Operativo':
      return '/operativo/dashboard'
    case 'Agente Logistico':
      return '/agente_logistico'
    case 'Piloto':
      return '/Viajes'
    case 'Encargado del Patio':
      return '/dashboard_patio'
    case 'Agente Financiero':
      return '/financiero/dashboard'
    case 'Gerencia':
      return '/gerencia/dashboard'
    default:
      return '/'
  }
}

function getRouteBySection(role: UserRole, section: string): string {
  const routesByRole: Record<UserRole, Record<string, string>> = {
    Cliente: {
      dashboard: '/cliente/dashboard',
      solicitudes: '/cliente/solicitudes',
      seguimiento: '/cliente/seguimiento',
      pagos: '/cliente/pagos',
      'estado-cuenta-cliente': '/cliente/estado-cuenta',
      alertas: '/cliente/alertas',
      'perfil-cliente': '/cliente/perfil',
    },
    'Encargado del Patio': {
      patio: '/dashboard_patio',
      asignaciones: '/dashboard_patio/validar_orden',
    },
    'Agente Operativo': {
      operaciones: '/operativo/dashboard',
      clientes: '/operativo/clientes',
      contratos: '/operativo/contratos',
      'ordenes-servicio': '/operativo/ordenes-servicio',
      reportes: '/operativo/reportes',
    },
    'Agente Logistico': {
      despachos: '/agente_logistico',
      inventario: '/agente_logistico',
    },
    Piloto: {
      viajes: '/Viajes',
      'estado-carga': '/Viajes',
    },
    'Agente Financiero': {
      dashboard: '/financiero/dashboard',
      facturacion: '/financiero/facturacion',
      pagos: '/financiero/pagos',
      'estado-cuenta': '/financiero/estado-cuenta',
      //perfil: '/financiero/perfil',
      reportes: '/financiero/facturacion',
      cobros: '/financiero/facturacion',
    },
    Gerencia: {
      dashboard: '/gerencia/dashboard',
    },
  }

  return routesByRole[role][section] ?? getDefaultRouteByRole(role)
}

const linksByRole: Record<UserRole, NavLink[]> = {
  Cliente: [
    { label: 'Dashboard', section: 'dashboard' },
    { label: 'Solicitudes', section: 'solicitudes' },
    { label: 'Seguimiento', section: 'seguimiento' },
    { label: 'Pagos', section: 'pagos' },
    { label: 'Estado de cuenta', section: 'estado-cuenta-cliente' },
  ],
  'Encargado del Patio': [
    { label: 'Patio', section: 'patio' },
    { label: 'Asignaciones', section: 'asignaciones' },
  ],
  'Agente Operativo': [
    { label: 'Dashboard Operativo', section: 'operaciones' },
    { label: 'Clientes', section: 'clientes' },
    { label: 'Contratos', section: 'contratos' },
    { label: 'Ordenes de Servicio', section: 'ordenes-servicio' },
    { label: 'Reportes', section: 'reportes' },
  ],
  'Agente Logistico': [
    { label: 'Despachos', section: 'despachos' },
    { label: 'Inventario', section: 'inventario' },
  ],
  Piloto: [
    { label: 'Viajes', section: 'viajes' },
    { label: 'Estado de Carga', section: 'estado-carga' },
  ],
  'Agente Financiero': [
    { label: 'Dashboard', section: 'dashboard' },
    { label: 'Facturacion', section: 'facturacion' },
    { label: 'Pagos', section: 'pagos' },
    { label: 'Estado de Cuenta', section: 'estado-cuenta' },
  ],
  Gerencia: [
    { label: 'Dashboard', section: 'dashboard' },
  ],
}

export const Navbar: React.FC<Props> = ({ onLogout, user }) => {
  const navigate = useNavigate()
  const [openNotifications, setOpenNotifications] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [facturasBorrador, setFacturasBorrador] = useState(0)
  const [pagosPendientes, setPagosPendientes] = useState(0)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)

  const creditLimit = 15000
  const creditUsed = 13800
  const contractEndDate = '2026-03-24'
  const contractExpiredDate = '2026-03-12'
  const highRiskAssigned = true

  const daysUntil = (dateIso: string): number => {
    const todayIso = new Date().toISOString().slice(0, 10)
    const current = new Date(`${todayIso}T00:00:00`).getTime()
    const target = new Date(`${dateIso}T00:00:00`).getTime()
    return Math.ceil((target - current) / (1000 * 60 * 60 * 24))
  }

  const usage = creditUsed / creditLimit
  const contratoVencido = daysUntil(contractExpiredDate) < 0
  const diasParaVencer = daysUntil(contractEndDate)
  const contratoPorVencer = diasParaVencer >= 0 && diasParaVencer <= 5
  const limiteAlcanzado = creditUsed >= creditLimit
  const creditoCercano = usage >= 0.8 && usage < 0.9
  const bloqueado = limiteAlcanzado || highRiskAssigned

  const clienteAlertas: NotificationItem[] = [
    {
      label: 'Su cuenta se encuentra bloqueada. Contacte a soporte.',
      section: 'alertas',
      active: bloqueado,
    },
    {
      label: 'Ha alcanzado su limite de credito. No puede generar nuevas ordenes.',
      section: 'alertas',
      active: limiteAlcanzado,
    },
    {
      label: 'Esta proximo a alcanzar su limite de credito.',
      section: 'alertas',
      active: creditoCercano,
    },
    {
      label: 'Su contrato ha expirado. No puede operar.',
      section: 'alertas',
      active: contratoVencido,
    },
    {
      label: 'Su contrato esta proximo a vencer.',
      section: 'alertas',
      active: contratoPorVencer,
    },
    {
      label: 'Su cuenta esta bajo revision administrativa.',
      section: 'alertas',
      active: highRiskAssigned,
    },
  ]

  // Notificaciones dinámicas para Agente Financiero
  const financieroAlertas: NotificationItem[] = [
    ...(facturasBorrador > 0 ? [
      { 
        label: `${facturasBorrador} factura${facturasBorrador > 1 ? 's' : ''} en borrador en Facturación lista${facturasBorrador > 1 ? 's' : ''} para certificar.`, 
        section: 'facturacion', 
        active: true 
      }
    ] : []),
    ...(pagosPendientes > 0 ? [
      { 
        label: `${pagosPendientes} factura${pagosPendientes > 1 ? 's' : ''} en certificado pendiente${pagosPendientes > 1 ? 's' : ''} de pago en Pagos.`, 
        section: 'pagos', 
        active: true 
      }
    ] : []),
    ...(facturasBorrador === 0 && pagosPendientes === 0 ? [
      { label: 'Sin notificaciones activas.', section: 'dashboard', active: false }
    ] : [])
  ]

  const notificationsByRole: Record<UserRole, NotificationItem[]> = {
    Cliente: [],
    'Encargado del Patio': [{ label: 'Sin notificaciones activas.', section: 'patio', active: false }],
    'Agente Operativo': [{ label: 'Sin notificaciones activas.', section: 'operaciones', active: false }],
    'Agente Logistico': [{ label: 'Sin notificaciones activas.', section: 'despachos', active: false }],
    Piloto: [{ label: 'Sin notificaciones activas.', section: 'viajes', active: false }],
    'Agente Financiero': financieroAlertas,
    Gerencia: [{ label: 'Sin notificaciones activas.', section: 'dashboard', active: false }],
  }

  const notifications = notificationsByRole[user.role] ?? []
  const unreadCount = notifications.filter((item) => item.active !== false).length
  const showNotifications = user.role !== 'Cliente'

  // Cargar datos dinámicos para Agente Financiero
  useEffect(() => {
    if (user.role !== 'Agente Financiero') return

    const cargarDatos = async () => {
      try {
        // Obtener facturas en borrador (para Facturación)
        const factResponse = await fetch('http://localhost:4000/facturas/borrador')
        if (factResponse.ok) {
          const factData = await factResponse.json()
          setFacturasBorrador(Array.isArray(factData) ? factData.length : 0)
        }

        // Obtener facturas certificadas pendiente de pago (para Pagos)
        const pagosResponse = await fetch('http://localhost:4000/facturas/certificadas-pendiente')
        if (pagosResponse.ok) {
          const pagosData = await pagosResponse.json()
          setPagosPendientes(Array.isArray(pagosData) ? pagosData.length : 0)
        }
      } catch (error) {
        console.error('Error al cargar datos de notificaciones:', error)
      }
    }

    cargarDatos()
  }, [user.role])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setOpenProfile(false)
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) setOpenNotifications(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenProfile(false)
        setOpenNotifications(false)
      }
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const links = linksByRole[user.role]

  const roleIcons: Record<UserRole, typeof PersonOutline> = {
    Cliente: PersonOutline,
    'Encargado del Patio': Engineering,
    'Agente Operativo': Groups,
    'Agente Logistico': LocalShipping,
    Piloto: PrecisionManufacturing,
    'Agente Financiero': AttachMoney,
    Gerencia: AdminPanelSettings,
  }

  const RoleIcon = roleIcons[user.role] ?? SupportAgent

  return (
    <header className="navbar">
      <nav className="navbar__inner">
        <div className="navbar__left">
          <button
            type="button"
            onClick={() => navigate(getDefaultRouteByRole(user.role))}
            className="navbar__brand"
          >
            LogiTrans
          </button>

          <div className="navbar__links">
            {links.map((link) => (
              <button
                key={`${link.section}-${link.label}`}
                type="button"
                className="navbar__link"
                onClick={() => navigate(getRouteBySection(user.role, link.section))}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="navbar__actions">
            {showNotifications && <div className="navbar__notifications" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setOpenNotifications((v) => !v)}
                className="navbar__iconButton"
                aria-label="Notificaciones"
                title="Notificaciones"
              >
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <NotificationsNone fontSize="small" />
                </Badge>
              </button>

              {openNotifications && (
                <div className="navbar__menu navbar__menu--notifications">
                  {notifications.map((notification, index) => (
                    <button
                      key={`${notification.label}-${index}`}
                      type="button"
                      onClick={() => {
                        setOpenNotifications(false)
                        navigate(getRouteBySection(user.role, notification.section))
                      }}
                      className="navbar__menuItem navbar__menuItem--notification"
                    >
                      {notification.label}
                    </button>
                  ))}
                </div>
              )}
            </div>}

            <div className="navbar__user" ref={profileRef}>
              <div className="navbar__userInfo">
                <span className="navbar__email">{user.email}</span>
                <span className="navbar__role">{user.role}</span>
              </div>

              <button
                type="button"
                onClick={() => setOpenProfile((v) => !v)}
                className="navbar__iconButton"
                aria-label="Menu de perfil"
                title="Perfil"
              >
                <RoleIcon fontSize="small" />
              </button>

              {openProfile && (
                <div className="navbar__menu">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenProfile(false)
                      if (user.role === 'Cliente') {
                        navigate('/cliente/perfil')
                      } else if (user.role === 'Agente Financiero') {
                        navigate('/financiero/perfil')
                      } else {
                        navigate(getDefaultRouteByRole(user.role))
                      }
                    }}
                    className="navbar__menuItem"
                  >
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenProfile(false)
                      onLogout?.()
                    }}
                    className="navbar__menuItem"
                  >
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
        </div>
      </nav>
    </header>
  )
}