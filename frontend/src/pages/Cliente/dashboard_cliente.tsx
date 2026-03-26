import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Chip,
	CircularProgress,
	Grid,
	Paper,
	Stack,
	Typography,
} from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import { getCurrentUser } from '../../util/auth'

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const defaultDashboardData = {
	serviciosActivos: 6,
	serviciosCompletados: 18,
	ordenesEnTransito: 4,
	ultimaEntrega: '2026-03-24 16:45',
	deudaActual: 8450,
	creditoDisponible: 1200,
	facturasVencidas: 2,
	bloqueoCredito: true,
}

type DashboardApiResponse = {
	dashboard_cliente?: {
		resumen_servicios?: {
			servicios_activos?: number
			servicios_completados?: number
		}
		estado_general?: {
			ordenes_en_transito?: number
			ultima_entrega?: string
		}
		resumen_financiero?: {
			deuda_actual?: number
			credito_disponible?: number
		}
		alertas?: {
			facturas_vencidas?: number
			bloqueo_por_credito?: boolean
		}
	}
}

function money(value: number): string {
	return `Q ${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type QuickCardProps = {
	label: string
	value: string | number
	icon: ReactNode
}

function QuickCard({ label, value, icon }: QuickCardProps) {
	return (
		<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
			<Stack direction="row" spacing={1.2} alignItems="center">
				{icon}
				<div>
					<Typography variant="caption" color="text.secondary">
						{label}
					</Typography>
					<Typography variant="h6" sx={{ fontWeight: 800 }}>
						{value}
					</Typography>
				</div>
			</Stack>
		</Paper>
	)
}

export default function DashboardClientePage() {
	const [dashboardData, setDashboardData] = useState(defaultDashboardData)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let cancelled = false
		const currentUser = getCurrentUser()

		const fetchDashboard = async () => {
			if (!currentUser?.clienteId) {
				setError('No se encontro clienteId en la sesion. Inicia sesion nuevamente.')
				setLoading(false)
				return
			}

			try {
				setLoading(true)
				setError('')

				const response = await fetch(
					`${API_BASE_URL}/api/clientes/me/dashboard?cliente_id=${currentUser.clienteId}`,
				)

				if (!response.ok) {
					throw new Error('No se pudo obtener el dashboard del cliente.')
				}

				const payload = (await response.json()) as DashboardApiResponse
				const data = payload.dashboard_cliente

				if (!data) {
					throw new Error('El backend no devolvio dashboard_cliente.')
				}

				if (!cancelled) {
					setDashboardData({
						serviciosActivos: data.resumen_servicios?.servicios_activos ?? 0,
						serviciosCompletados: data.resumen_servicios?.servicios_completados ?? 0,
						ordenesEnTransito: data.estado_general?.ordenes_en_transito ?? 0,
						ultimaEntrega: data.estado_general?.ultima_entrega ?? 'Sin entregas registradas',
						deudaActual: data.resumen_financiero?.deuda_actual ?? 0,
						creditoDisponible: data.resumen_financiero?.credito_disponible ?? 0,
						facturasVencidas: data.alertas?.facturas_vencidas ?? 0,
						bloqueoCredito: data.alertas?.bloqueo_por_credito ?? false,
					})
				}
			} catch (fetchError) {
				if (!cancelled) {
					setError(fetchError instanceof Error ? fetchError.message : 'Error inesperado al cargar dashboard.')
					setDashboardData(defaultDashboardData)
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		void fetchDashboard()

		return () => {
			cancelled = true
		}
	}, [])

	const ultimaEntregaLabel = useMemo(() => {
		if (!dashboardData.ultimaEntrega || dashboardData.ultimaEntrega === 'Sin entregas registradas') {
			return 'Sin entregas registradas'
		}

		const parsedDate = new Date(dashboardData.ultimaEntrega)
		if (Number.isNaN(parsedDate.getTime())) {
			return dashboardData.ultimaEntrega
		}

		return parsedDate.toLocaleString('es-GT', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
	}, [dashboardData.ultimaEntrega])

	const hasAlerts = dashboardData.facturasVencidas > 0 || dashboardData.bloqueoCredito

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Dashboard Cliente
				</Typography>
			</div>

			<Alert severity="info" sx={{ mb: 2 }}>
				Vista rapida no operativa: solo visualiza estado general del cliente.
			</Alert>

			{loading ? (
				<Paper className="op-panel" elevation={0} sx={{ p: 3, mb: 2 }}>
					<Stack direction="row" spacing={1.25} alignItems="center">
						<CircularProgress size={20} />
						<Typography variant="body2">Cargando dashboard desde backend...</Typography>
					</Stack>
				</Paper>
			) : null}

			{error ? (
				<Alert severity="warning" sx={{ mb: 2 }}>
					{error}
				</Alert>
			) : null}

			<Grid container spacing={1.5}>
				<Grid size={{ xs: 12, md: 6, lg: 3 }}>
					<QuickCard
						label="Servicios activos"
						value={dashboardData.serviciosActivos}
						icon={<LocalShippingOutlinedIcon color="primary" />}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 6, lg: 3 }}>
					<QuickCard
						label="Servicios completados"
						value={dashboardData.serviciosCompletados}
						icon={<Inventory2OutlinedIcon color="primary" />}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 6, lg: 3 }}>
					<QuickCard
						label="Ordenes en transito"
						value={dashboardData.ordenesEnTransito}
						icon={<RouteOutlinedIcon color="primary" />}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 6, lg: 3 }}>
					<QuickCard
						label="Ultima entrega"
						value={ultimaEntregaLabel}
						icon={<EventAvailableOutlinedIcon color="primary" />}
					/>
				</Grid>
			</Grid>

			<Grid container spacing={1.5} sx={{ mt: 0.25 }}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Resumen financiero
						</Typography>
						<Stack spacing={1.2}>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Stack direction="row" spacing={1} alignItems="center">
									<AccountBalanceWalletOutlinedIcon color="action" fontSize="small" />
									<Typography variant="body2">Deuda actual</Typography>
								</Stack>
								<Typography sx={{ fontWeight: 800 }}>{money(dashboardData.deudaActual)}</Typography>
							</Stack>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Stack direction="row" spacing={1} alignItems="center">
									<CreditScoreOutlinedIcon color="action" fontSize="small" />
									<Typography variant="body2">Credito disponible</Typography>
								</Stack>
								<Typography sx={{ fontWeight: 800 }}>{money(dashboardData.creditoDisponible)}</Typography>
							</Stack>
						</Stack>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Alertas
						</Typography>
						<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
							<Chip
								icon={<WarningAmberOutlinedIcon />}
								label={`Facturas vencidas: ${dashboardData.facturasVencidas}`}
								color={dashboardData.facturasVencidas > 0 ? 'warning' : 'success'}
							/>
							<Chip
								icon={<BlockOutlinedIcon />}
								label={dashboardData.bloqueoCredito ? 'Bloqueo por credito: Activo' : 'Bloqueo por credito: Inactivo'}
								color={dashboardData.bloqueoCredito ? 'error' : 'success'}
							/>
						</Stack>
						<Alert severity={hasAlerts ? 'warning' : 'success'} sx={{ mt: 1.2 }}>
							{hasAlerts
								? 'Hay condiciones financieras que requieren atencion.'
								: 'Estado financiero estable, sin alertas activas.'}
						</Alert>
					</Paper>
				</Grid>
			</Grid>
		</motion.section>
	)
}
