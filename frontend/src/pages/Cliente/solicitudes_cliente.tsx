import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Button,
	Chip,
	Grid,
	InputAdornment,
	MenuItem,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AddTaskOutlinedIcon from '@mui/icons-material/AddTaskOutlined'
import { getCurrentUser } from '../../util/auth'

type RequestStatus = 'Registrada' | 'Aceptada'

type RequestOrder = {
	id: string
	origen: string
	destino: string
	tipoCarga: string
	fecha: string
	estado: RequestStatus
}

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

const initialOrders: RequestOrder[] = []

const cargaOptions = ['Unidad Ligera', 'Unidad Pesada', 'Cabezal']
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

type BackendRequestHistoryItem = {
	solicitud_id?: number
	codigo?: string
	origen?: string
	destino?: string
	tipo_carga?: string
	fecha?: string
	estado?: string
}

type BackendRequestHistoryResponse = {
	data?: BackendRequestHistoryItem[]
}

type BackendRequestCreateResponse = {
	data?: BackendRequestHistoryItem
	error?: string
}

type BackendAuthorizedRouteItem = {
	ruta_id?: number
	origen?: string
	destino?: string
}

type BackendAuthorizedRoutesResponse = {
	data?: BackendAuthorizedRouteItem[]
	error?: string
}

type AuthorizedRouteOption = {
	id: number
	origen: string
	destino: string
}

export default function SolicitudesClientePage() {
	const [routeId, setRouteId] = useState('')
	const [tipoCarga, setTipoCarga] = useState(cargaOptions[0])
	const [authorizedRoutes, setAuthorizedRoutes] = useState<AuthorizedRouteOption[]>([])
	const [orders, setOrders] = useState<RequestOrder[]>(initialOrders)
	const [feedback, setFeedback] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const currentUser = getCurrentUser()

	const selectedRoute = useMemo(
		() => authorizedRoutes.find((route) => String(route.id) === routeId),
		[authorizedRoutes, routeId],
	)

	const loadAuthorizedRoutes = async () => {
		if (!currentUser?.clienteId) {
			setAuthorizedRoutes([])
			setRouteId('')
			return
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/clientes/me/rutas-autorizadas?cliente_id=${currentUser.clienteId}`)
			const payload = (await response.json().catch(() => ({}))) as BackendAuthorizedRoutesResponse

			if (!response.ok) {
				throw new Error(payload.error ?? 'No se pudieron cargar las rutas autorizadas.')
			}

			const mappedRoutes: AuthorizedRouteOption[] = (payload.data ?? []).map((item) => ({
				id: item.ruta_id ?? 0,
				origen: item.origen ?? '-',
				destino: item.destino ?? '-',
			}))

			setAuthorizedRoutes(mappedRoutes)
			setRouteId((prev) => prev || String(mappedRoutes[0]?.id ?? ''))
		} catch (error) {
			setAuthorizedRoutes([])
			setRouteId('')
			setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al cargar rutas autorizadas.')
		}
	}

	const reloadHistory = async () => {
		if (!currentUser?.clienteId) {
			setErrorMessage('No se encontro clienteId en la sesion. Inicia sesion nuevamente.')
			setOrders([])
			return
		}

		setIsLoading(true)
		setErrorMessage('')

		try {
			const response = await fetch(
				`${API_BASE_URL}/api/clientes/me/solicitudes?cliente_id=${currentUser.clienteId}`,
			)

			if (!response.ok) {
				throw new Error('No se pudo cargar el historial de solicitudes.')
			}

			const payload = (await response.json()) as BackendRequestHistoryResponse
			const rows = payload.data ?? []

			setOrders(
				rows.map((item) => ({
					id: item.codigo ?? `OS-${item.solicitud_id ?? 0}`,
					origen: item.origen ?? '-',
					destino: item.destino ?? '-',
					tipoCarga: item.tipo_carga ?? 'Unidad Ligera',
					fecha: item.fecha ?? '-',
					estado: item.estado === 'Aceptada' ? 'Aceptada' : 'Registrada',
				})),
			)
		} catch (error) {
			setOrders([])
			setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al cargar solicitudes.')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void (async () => {
			await Promise.all([reloadHistory(), loadAuthorizedRoutes()])
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const totalRegistradas = useMemo(
		() => orders.filter((order) => order.estado === 'Registrada').length,
		[orders],
	)

	const totalAceptadas = useMemo(
		() => orders.filter((order) => order.estado === 'Aceptada').length,
		[orders],
	)

	const createRequest = () => {
		if (!selectedRoute) {
			setFeedback('Selecciona una ruta autorizada para crear la solicitud.')
			return
		}

		if (!currentUser?.clienteId) {
			setFeedback('No se encontro clienteId en la sesion. Inicia sesion nuevamente.')
			return
		}

		setFeedback('')
		setErrorMessage('')

		void (async () => {
			try {
				const response = await fetch(
					`${API_BASE_URL}/api/clientes/me/solicitudes?cliente_id=${currentUser.clienteId}`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							origen: selectedRoute.origen,
							destino: selectedRoute.destino,
							tipo_carga: tipoCarga,
						}),
					},
				)

				const payload = (await response.json().catch(() => ({}))) as BackendRequestCreateResponse

				if (!response.ok) {
					throw new Error(payload.error ?? 'No se pudo crear la solicitud.')
				}

				setFeedback('Solicitud registrada exitosamente.')
				await reloadHistory()
			} catch (error) {
				setFeedback(error instanceof Error ? error.message : 'Error inesperado al crear la solicitud.')
			}
		})()
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Solicitudes
				</Typography>
			</div>

			<Alert severity="info" sx={{ mb: 2 }}>
				Este es el punto de entrada de la accion principal del cliente: aqui nacen las solicitudes.
			</Alert>

			{errorMessage ? (
				<Alert severity="warning" sx={{ mb: 2 }}>
					{errorMessage}
				</Alert>
			) : null}

			<Grid container spacing={1.5}>
				<Grid size={{ xs: 12, md: 5 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Crear solicitud de servicio
						</Typography>
						<Stack spacing={1.2}>
							<TextField
								select
								label="Ruta autorizada"
								value={routeId}
								onChange={(event) => setRouteId(event.target.value)}
								fullWidth
							>
								{authorizedRoutes.map((route) => (
									<MenuItem key={route.id} value={String(route.id)}>
										{route.origen} → {route.destino}
									</MenuItem>
								))}
							</TextField>

							<TextField
								label="Origen"
								value={selectedRoute?.origen ?? ''}
								InputProps={{
									readOnly: true,
									startAdornment: (
										<InputAdornment position="start">
											<PlaceOutlinedIcon fontSize="small" />
										</InputAdornment>
									),
								}}
								fullWidth
							/>
							<TextField
								label="Destino"
								value={selectedRoute?.destino ?? ''}
								InputProps={{
									readOnly: true,
									startAdornment: (
										<InputAdornment position="start">
											<PlaceOutlinedIcon fontSize="small" />
										</InputAdornment>
									),
								}}
								fullWidth
							/>
							<TextField
								select
								label="Tipo de carga"
								value={tipoCarga}
								onChange={(event) => setTipoCarga(event.target.value)}
								fullWidth
							>
								{cargaOptions.map((option) => (
									<MenuItem key={option} value={option}>
										{option}
									</MenuItem>
								))}
							</TextField>

							<Button variant="contained" onClick={createRequest} startIcon={<AddTaskOutlinedIcon />}>
								Registrar solicitud
							</Button>

							{authorizedRoutes.length === 0 ? (
								<Alert severity="info">No tienes rutas autorizadas en tu contrato vigente.</Alert>
							) : null}

							{feedback ? (
								<Alert severity={feedback.includes('exitosamente') ? 'success' : 'warning'}>{feedback}</Alert>
							) : null}
						</Stack>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 7 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Historial de solicitudes
						</Typography>

						<Stack direction="row" spacing={1} sx={{ mb: 1.2 }}>
							<Chip icon={<Inventory2OutlinedIcon />} label={`Registradas: ${totalRegistradas}`} color="warning" />
							<Chip icon={<Inventory2OutlinedIcon />} label={`Aceptadas: ${totalAceptadas}`} color="success" />
						</Stack>

						<Stack spacing={1}>
							{isLoading ? <Alert severity="info">Cargando historial de solicitudes...</Alert> : null}

							{orders.map((order) => (
								<Paper key={order.id} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
									<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
										<div>
											<Typography sx={{ fontWeight: 800 }}>{order.id}</Typography>
											<Typography variant="body2">
												{order.origen} → {order.destino} | {order.tipoCarga}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												Fecha: {order.fecha}
											</Typography>
										</div>
										<Chip label={order.estado} color={order.estado === 'Aceptada' ? 'success' : 'warning'} />
									</Stack>
								</Paper>
							))}

							{!isLoading && orders.length === 0 ? (
								<Alert severity="info">No hay solicitudes registradas para este cliente.</Alert>
							) : null}
						</Stack>
					</Paper>
				</Grid>
			</Grid>
		</motion.section>
	)
}
