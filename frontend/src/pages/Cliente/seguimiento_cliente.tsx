import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Grid,
	Paper,
	Stack,
	Typography,
} from '@mui/material'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import { getCurrentUser } from '../../util/auth'

type TrackingStatus = 'Listo para despacho' | 'En transito' | 'Entregado'

type TrackingOrder = {
	solicitudId: number
	id: string
	estado: TrackingStatus
	puntosControl: string[]
	eventosRuta: string[]
	evidenciaEntrega?: string
	recepcionConfirmada: boolean
}

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

const initialOrders: TrackingOrder[] = []

const statusFlow: TrackingStatus[] = ['Listo para despacho', 'En transito', 'Entregado']
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

type BackendTrackingItem = {
	solicitud_id?: number
	codigo?: string
	estado?: string
	puntos_control?: string[]
	eventos_ruta?: string[]
	evidencia_entrega?: string
	recepcion_confirmada?: boolean
}

type BackendTrackingResponse = {
	data?: BackendTrackingItem[]
}

type BackendBasicResponse = {
	error?: string
	message?: string
}

export default function SeguimientoClientePage() {
	const [orders, setOrders] = useState<TrackingOrder[]>(initialOrders)
	const [selectedId, setSelectedId] = useState<number | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [isConfirming, setIsConfirming] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const currentUser = getCurrentUser()

	const loadTracking = async () => {
		const referenceID = currentUser?.userId ?? currentUser?.clienteId
		if (!referenceID) {
			setErrorMessage('No se encontro userId en la sesion. Inicia sesion nuevamente.')
			setOrders([])
			setSelectedId(null)
			return
		}

		setIsLoading(true)
		setErrorMessage('')

		try {
			const response = await fetch(`${API_BASE_URL}/api/clientes/me/seguimiento?user_id=${referenceID}`)
			if (!response.ok) {
				throw new Error('No se pudo cargar el seguimiento del cliente.')
			}

			const payload = (await response.json()) as BackendTrackingResponse
			const rows = payload.data ?? []

			const mappedRows: TrackingOrder[] = rows.map((row) => {
				const estadoRaw = row.estado ?? 'Listo para despacho'
				const estado: TrackingStatus =
					estadoRaw === 'Entregado'
						? 'Entregado'
						: estadoRaw === 'En transito'
							? 'En transito'
							: 'Listo para despacho'

				return {
					solicitudId: row.solicitud_id ?? 0,
					id: row.codigo ?? `OS-${row.solicitud_id ?? 0}`,
					estado,
					puntosControl: row.puntos_control ?? [],
					eventosRuta: row.eventos_ruta ?? [],
					evidenciaEntrega: row.evidencia_entrega ?? '',
					recepcionConfirmada: row.recepcion_confirmada ?? false,
				}
			})

			setOrders(mappedRows)
			setSelectedId((current) => {
				if (current && mappedRows.some((item) => item.solicitudId === current)) {
					return current
				}
				return mappedRows.length > 0 ? mappedRows[0].solicitudId : null
			})
		} catch (error) {
			setOrders([])
			setSelectedId(null)
			setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al cargar seguimiento.')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void loadTracking()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const selectedOrder = useMemo(
		() => orders.find((order) => order.solicitudId === selectedId),
		[orders, selectedId],
	)

	const confirmReception = () => {
		const referenceID = currentUser?.userId ?? currentUser?.clienteId
		if (!selectedOrder || !referenceID) {
			return
		}

		void (async () => {
			try {
				setIsConfirming(true)
				setErrorMessage('')

				const response = await fetch(
					`${API_BASE_URL}/api/clientes/me/seguimiento/${selectedOrder.solicitudId}/confirmar-recepcion?user_id=${referenceID}`,
					{ method: 'POST' },
				)

				const payload = (await response.json().catch(() => ({}))) as BackendBasicResponse
				if (!response.ok) {
					throw new Error(payload.error ?? 'No se pudo confirmar la recepcion.')
				}

				await loadTracking()
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al confirmar la recepcion.')
			} finally {
				setIsConfirming(false)
			}
		})()
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Seguimiento
				</Typography>
			</div>

			<Alert severity="info" sx={{ mb: 2 }}>
				Tracking completo del servicio: estado, bitacora y confirmacion de entrega.
			</Alert>

			{errorMessage ? <Alert severity="warning" sx={{ mb: 2 }}>{errorMessage}</Alert> : null}

			{isLoading ? (
				<Paper className="op-panel" elevation={0} sx={{ p: 2, mb: 1.5 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<CircularProgress size={20} />
						<Typography variant="body2">Cargando seguimiento...</Typography>
					</Stack>
				</Paper>
			) : null}

			{!isLoading && orders.length === 0 ? (
				<Alert severity="info" sx={{ mb: 2 }}>
					No hay ordenes para seguimiento en este cliente.
				</Alert>
			) : null}

			<Paper className="op-panel" elevation={0} sx={{ p: 2, mb: 1.5 }}>
				<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
					{orders.map((order) => (
						<Chip
							key={order.solicitudId}
							label={order.id}
							color={order.solicitudId === selectedId ? 'primary' : 'default'}
							onClick={() => setSelectedId(order.solicitudId)}
						/>
					))}
				</Stack>
			</Paper>

			{selectedOrder ? <Grid container spacing={1.5}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Estado de la orden
						</Typography>
						<Stack spacing={1}>
							{statusFlow.map((status) => {
								const reached = statusFlow.indexOf(status) <= statusFlow.indexOf(selectedOrder.estado)
								return (
									<Paper key={status} variant="outlined" sx={{ p: 1.2, borderRadius: 2, opacity: reached ? 1 : 0.55 }}>
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Stack direction="row" spacing={1} alignItems="center">
												<RouteOutlinedIcon fontSize="small" />
												<Typography>{status}</Typography>
											</Stack>
											<Chip size="small" label={reached ? 'Activo/Completado' : 'Pendiente'} color={reached ? 'success' : 'default'} />
										</Stack>
									</Paper>
								)
							})}
						</Stack>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Bitacora de ruta
						</Typography>

						<Typography variant="subtitle2" sx={{ mb: 0.6 }}>Puntos de control</Typography>
						<Stack spacing={0.75} sx={{ mb: 1.25 }}>
							{selectedOrder.puntosControl.map((point) => (
								<Stack key={point} direction="row" spacing={1} alignItems="center">
									<MapOutlinedIcon fontSize="small" color="action" />
									<Typography variant="body2">{point}</Typography>
								</Stack>
							))}
						</Stack>

						<Typography variant="subtitle2" sx={{ mb: 0.6 }}>Eventos en ruta</Typography>
						<Stack spacing={0.75}>
							{selectedOrder.eventosRuta.map((event) => (
								<Stack key={event} direction="row" spacing={1} alignItems="center">
									<CheckCircleOutlinedIcon fontSize="small" color="action" />
									<Typography variant="body2">{event}</Typography>
								</Stack>
							))}
						</Stack>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Confirmacion de entrega
						</Typography>

						{selectedOrder.estado !== 'Entregado' ? (
							<Alert severity="warning">La orden aun no ha sido entregada.</Alert>
						) : (
							<Stack spacing={1.1}>
								<Stack direction="row" spacing={1} alignItems="center">
									<FactCheckOutlinedIcon color="action" fontSize="small" />
									<Typography variant="body2">
										Evidencia: {selectedOrder.evidenciaEntrega ?? 'Sin evidencia adjunta'}
									</Typography>
								</Stack>

								<Button
									variant="contained"
									onClick={confirmReception}
									disabled={selectedOrder.recepcionConfirmada || isConfirming}
								>
									{selectedOrder.recepcionConfirmada
										? 'Recepcion confirmada'
										: isConfirming
											? 'Confirmando...'
											: 'Confirmar recepcion'}
								</Button>
							</Stack>
						)}
					</Paper>
				</Grid>
			</Grid> : null}
		</motion.section>
	)
}
