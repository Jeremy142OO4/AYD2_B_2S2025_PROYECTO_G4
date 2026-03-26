import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Avatar,
	Button,
	Chip,
	LinearProgress,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material'
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

type EstadoOrden = 'Registrada' | 'Lista para despacho' | 'En transito' | 'Entregado' | 'Cancelado'

type OrdenRow = {
	id: number
	codigo: string
	clienteId: number
	contratoId: number
	cliente: string
	origen: string
	destino: string
	tipoCarga: string
	peso: number
	estado: EstadoOrden
}

type BackendOrdenesResponse = {
	data?: Array<{
		id: number
		cliente_id: number
		contrato_id: number
		nombre_cliente: string
		origen: string
		destino: string
		peso: number
		estado: string
	}>
	error?: string
}

type BackendGenerateResponse = {
	message?: string
	error?: string
	data?: {
		orden_id?: number
		codigo?: string
		estado?: string
	}
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

export default function ServicioOperativoPage() {
	const [ordenes, setOrdenes] = useState<OrdenRow[]>([])
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	const resumen = useMemo(() => {
		const registradas = ordenes.filter((item) => item.estado === 'Registrada').length
		const listas = ordenes.filter((item) => item.estado === 'Lista para despacho').length
		return { registradas, listas }
	}, [ordenes])

	const normalizeEstado = (raw?: string): EstadoOrden => {
		const clean = String(raw ?? '').trim().toLowerCase()
		if (clean === 'listo para despacho') return 'Lista para despacho'
		if (clean === 'en transito') return 'En transito'
		if (clean === 'entregado') return 'Entregado'
		if (clean === 'cancelado') return 'Cancelado'
		return 'Registrada'
	}

	const inferTipoCarga = (peso: number): string => {
		if (peso <= 1500) return 'Unidad Ligera'
		if (peso <= 6000) return 'Unidad Pesada'
		return 'Cabezal'
	}

	const loadData = async () => {
		try {
			setLoading(true)
			setError('')

			const ordenesRes = await fetch(`${API_BASE_URL}/api/operativo/ordenes-servicio`)

			const ordenesPayload = (await ordenesRes.json().catch(() => ({}))) as BackendOrdenesResponse
			if (!ordenesRes.ok) {
				throw new Error(ordenesPayload.error ?? 'No se pudieron cargar las órdenes.')
			}

			const ordenesMapped: OrdenRow[] = (ordenesPayload.data ?? []).map((item) => ({
				id: item.id,
				codigo: `OS-${new Date().getFullYear()}-${item.id}`,
				clienteId: item.cliente_id,
				contratoId: item.contrato_id,
				cliente: item.nombre_cliente,
				origen: item.origen ?? '-',
				destino: item.destino ?? '-',
				tipoCarga: inferTipoCarga(item.peso ?? 0),
				peso: item.peso ?? 0,
				estado: normalizeEstado(item.estado),
			}))

			setOrdenes(ordenesMapped)
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la información de órdenes.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadData()
	}, [])

	const generarOrden = async (item: OrdenRow) => {
		if (item.estado !== 'Registrada') {
			setError('Solo se pueden generar órdenes para solicitudes en estado Registrada.')
			return
		}

		if (!item.clienteId || !item.origen.trim() || !item.destino.trim() || item.peso <= 0) {
			setError('La solicitud no contiene datos válidos para generar orden.')
			return
		}

		try {
			setSubmitting(true)
			setError('')
			setSuccess('')

			const response = await fetch(`${API_BASE_URL}/api/operativo/ordenes-servicio/generar`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cliente_id: item.clienteId,
					origen: item.origen.trim(),
					destino: item.destino.trim(),
					peso: item.peso,
				}),
			})

			const payload = (await response.json().catch(() => ({}))) as BackendGenerateResponse
			if (!response.ok) {
				throw new Error(payload.error ?? 'No se pudo generar la orden de servicio.')
			}

			setSuccess(payload.message ?? `Orden generada para ${item.codigo}.`)
			await loadData()
		} catch (generateError) {
			setError(generateError instanceof Error ? generateError.message : 'No se pudo generar la orden.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Stack direction="row" spacing={1} alignItems="center">
					<Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(27, 60, 83, 0.12)', color: 'var(--color-primary-dark)' }}>
						<BuildCircleOutlinedIcon fontSize="small" />
					</Avatar>
					<Typography variant="h5" className="op-title">
						Ordenes de Servicio
					</Typography>
				</Stack>
			</div>

			<Alert severity="info" icon={<WarningAmberOutlinedIcon fontSize="inherit" />}>
				Selecciona una solicitud registrada desde la tabla y genera la orden. El sistema valida contrato vigente, ruta permitida y crédito disponible.
			</Alert>

			{loading ? <LinearProgress sx={{ mt: 1, mb: 1 }} /> : null}
			{error ? <Alert severity="error">{error}</Alert> : null}
			{success ? <Alert severity="success">{success}</Alert> : null}

			<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
				<TableContainer>
					<Table className="op-table">
						<TableHead>
							<TableRow>
								<TableCell>Solicitud</TableCell>
								<TableCell>Cliente</TableCell>
								<TableCell>Origen</TableCell>
								<TableCell>Destino</TableCell>
								<TableCell>Tipo carga</TableCell>
								<TableCell>Contrato</TableCell>
								<TableCell>Estado</TableCell>
								<TableCell>Acción</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{ordenes.map((item) => (
								<TableRow key={item.id}>
									<TableCell>{item.codigo}</TableCell>
									<TableCell>{item.cliente}</TableCell>
									<TableCell>{item.origen}</TableCell>
									<TableCell>{item.destino}</TableCell>
									<TableCell>{item.tipoCarga}</TableCell>
									<TableCell>{item.contratoId > 0 ? `CTR-${String(item.contratoId).padStart(4, '0')}` : '-'}</TableCell>
									<TableCell>
										<Chip
											size="small"
											label={item.estado}
											color={
												item.estado === 'Lista para despacho'
													? 'primary'
													: item.estado === 'Registrada'
														? 'default'
														: item.estado === 'Entregado'
															? 'success'
															: 'warning'
											}
										/>
									</TableCell>
									<TableCell>
										<Button
											size="small"
											className="op-action op-action--create"
											onClick={() => void generarOrden(item)}
											disabled={submitting || item.estado !== 'Registrada'}
										>
											Generar orden
										</Button>
									</TableCell>
								</TableRow>
							))}
							{!loading && ordenes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8}>
										<Typography variant="body2" color="text.secondary">
											No hay órdenes registradas.
										</Typography>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
				<Chip label={`Registradas: ${resumen.registradas}`} color="warning" />
				<Chip label={`Listas para despacho: ${resumen.listas}`} color="primary" icon={<AutoAwesomeOutlinedIcon />} />
			</Stack>
		</motion.section>
	)
}
