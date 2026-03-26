import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Avatar,
	Button,
	Chip,
	Divider,
	IconButton,
	InputAdornment,
	LinearProgress,
	MenuItem,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'

type EstadoContrato = 'Vigente' | 'Expirado'

type Contrato = {
	id: number
	cliente: string
	origen: string
	destino: string
	fechaInicio: string
	fechaFin: string
	estado: EstadoContrato
}

type ClienteOption = {
	clienteId: number
	nombre: string
	correo: string
}

type BackendClientesResponse = {
	data?: Array<{
		cliente_id: number
		nombre: string
		correo: string
	}>
	error?: string
}

type BackendContratosResponse = {
	data?: Array<{
		id: number
		nombre_cliente: string
		origen: string
		destino: string
		activo: boolean
	}>
	error?: string
}

type BackendCreateResponse = {
	message?: string
	error?: string
}

type RutaAutorizadaForm = {
	origen: string
	destino: string
}

const createEmptyRuta = (): RutaAutorizadaForm => ({
	origen: '',
	destino: '',
})

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'
const NEGOTIATED_DISCOUNT = 10

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

export default function ContratoOperativoPage() {
	const [clientes, setClientes] = useState<ClienteOption[]>([])
	const [contratos, setContratos] = useState<Contrato[]>([])
	const [loadingInit, setLoadingInit] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [rutas, setRutas] = useState<RutaAutorizadaForm[]>([createEmptyRuta()])

	const [form, setForm] = useState({
		clienteId: '',
		fechaInicio: '',
		fechaFin: '',
		pesoMin: '1',
		pesoMax: '1000',
	})

	const resumen = useMemo(() => {
		const vigentes = contratos.filter((item) => item.estado === 'Vigente').length
		return {
			total: contratos.length,
			vigentes,
			expirados: Math.max(contratos.length - vigentes, 0),
		}
	}, [contratos])

	const loadData = async () => {
		try {
			setLoadingInit(true)
			setError('')

			const [clientesRes, contratosRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/operativo/clientes/opciones`),
				fetch(`${API_BASE_URL}/api/operativo/contratos`),
			])

			const clientesPayload = (await clientesRes.json().catch(() => ({}))) as BackendClientesResponse
			if (!clientesRes.ok) {
				throw new Error(clientesPayload.error ?? 'No se pudo cargar el catalogo de clientes.')
			}

			const contratosPayload = (await contratosRes.json().catch(() => ({}))) as BackendContratosResponse
			if (!contratosRes.ok) {
				throw new Error(contratosPayload.error ?? 'No se pudo cargar el listado de contratos.')
			}

			const clientesMapped: ClienteOption[] = (clientesPayload.data ?? []).map((item) => ({
				clienteId: item.cliente_id,
				nombre: item.nombre,
				correo: item.correo,
			}))

			const contratosMapped: Contrato[] = (contratosPayload.data ?? []).map((item) => ({
				id: item.id,
				cliente: item.nombre_cliente,
				origen: item.origen || 'Sin origen',
				destino: item.destino || 'Sin destino',
				fechaInicio: '-',
				fechaFin: '-',
				estado: item.activo ? 'Vigente' : 'Expirado',
			}))

			setClientes(clientesMapped)
			setContratos(contratosMapped)
			setForm((prev) => ({
				...prev,
				clienteId: prev.clienteId || String(clientesMapped[0]?.clienteId ?? ''),
			}))
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la informacion de contratos.')
		} finally {
			setLoadingInit(false)
		}
	}

	useEffect(() => {
		void loadData()
	}, [])

	const createContrato = async () => {
		const clienteId = Number(form.clienteId)
		const pesoMin = Number(form.pesoMin)
		const pesoMax = Number(form.pesoMax)

		if (!clienteId || !form.fechaInicio || !form.fechaFin) {
			setError('Completa cliente y fechas del contrato.')
			return
		}

		if (Number.isNaN(pesoMin) || Number.isNaN(pesoMax) || pesoMin < 0 || pesoMax <= 0 || pesoMax < pesoMin) {
			setError('Define un rango de peso valido: minimo >= 0 y maximo > minimo.')
			return
		}

		if (rutas.length === 0) {
			setError('Debes agregar al menos una ruta autorizada.')
			return
		}

		if (form.fechaFin < form.fechaInicio) {
			setError('La fecha fin no puede ser menor a la fecha inicio.')
			return
		}

		const rutasPayload = rutas.map((ruta, index) => {
			if (!ruta.origen.trim() || !ruta.destino.trim()) {
				throw new Error(`Completa origen y destino en la ruta ${index + 1}.`)
			}

			return {
				origen: ruta.origen.trim(),
				destino: ruta.destino.trim(),
				tipo_unidad: 'LIGERA',
				peso_min: pesoMin,
				peso_max: pesoMax,
			}
		})

		try {
			setSubmitting(true)
			setError('')
			setSuccess('')

			const payload = {
				cliente_id: clienteId,
				fecha_inicio: form.fechaInicio,
				fecha_fin: form.fechaFin,
				descuento: NEGOTIATED_DISCOUNT,
				limite_credito: 0,
				dias_credito: 30,
				rutas_autorizadas: rutasPayload,
			}

			const response = await fetch(`${API_BASE_URL}/api/operativo/contratos`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			const responseData = (await response.json().catch(() => ({}))) as BackendCreateResponse
			if (!response.ok) {
				throw new Error(responseData.error ?? 'No se pudo crear el contrato digital.')
			}

			setSuccess(responseData.message ?? 'Contrato creado exitosamente.')
			setForm((prev) => ({
				...prev,
				fechaInicio: '',
				fechaFin: '',
				pesoMin: '1',
				pesoMax: '1000',
			}))
			setRutas([createEmptyRuta()])

			await loadData()
		} catch (createError) {
			setError(createError instanceof Error ? createError.message : 'No se pudo crear el contrato.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Stack direction="row" spacing={1} alignItems="center">
					<Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(27, 60, 83, 0.12)', color: 'var(--color-primary-dark)' }}>
						<DescriptionOutlinedIcon fontSize="small" />
					</Avatar>
					<Typography variant="h5" className="op-title">
						Contratos
					</Typography>
				</Stack>
			</div>


			{loadingInit ? <LinearProgress sx={{ mt: 1, mb: 1 }} /> : null}
			{error ? <Alert severity="error">{error}</Alert> : null}
			{success ? <Alert severity="success">{success}</Alert> : null}
			<Alert severity="info" sx={{ mb: 1 }}>
				Tarifario base fijo por unidad: Ligera Q8.00/km, Pesada Q12.50/km, Cabezal Q18.00/km. Descuento negociado aplicado: {NEGOTIATED_DISCOUNT}%.
			</Alert>

			<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} sx={{ mt: 0.2, mb: 0.2 }}>
				<Chip label={`Total: ${resumen.total}`} color="default" />
				<Chip label={`Vigentes: ${resumen.vigentes}`} color="success" />
				<Chip label={`Expirados: ${resumen.expirados}`} color="error" />
			</Stack>

			<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
				<Typography variant="h6" className="op-title">Crear contrato digital</Typography>
				<div className="op-form-grid" style={{ marginTop: '0.75rem' }}>
					<TextField
						select
						label="Cliente"
						value={form.clienteId}
						onChange={(event) => setForm((prev) => ({ ...prev, clienteId: event.target.value }))}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<PersonOutlineOutlinedIcon fontSize="small" />
								</InputAdornment>
							),
						}}
						fullWidth
					>
						{clientes.map((cliente) => (
							<MenuItem key={cliente.clienteId} value={String(cliente.clienteId)}>
								{cliente.nombre} ({cliente.correo})
							</MenuItem>
						))}
					</TextField>

					<TextField
						label="Fecha inicio"
						type="date"
						value={form.fechaInicio}
						onChange={(event) => setForm((prev) => ({ ...prev, fechaInicio: event.target.value }))}
						InputLabelProps={{ shrink: true }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<CalendarMonthOutlinedIcon fontSize="small" />
								</InputAdornment>
							),
						}}
						fullWidth
					/>

					<TextField
						label="Fecha fin"
						type="date"
						value={form.fechaFin}
						onChange={(event) => setForm((prev) => ({ ...prev, fechaFin: event.target.value }))}
						InputLabelProps={{ shrink: true }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<CalendarMonthOutlinedIcon fontSize="small" />
								</InputAdornment>
							),
						}}
						fullWidth
					/>

					<TextField
						label="Peso minimo"
						type="number"
						value={form.pesoMin}
						onChange={(event) => setForm((prev) => ({ ...prev, pesoMin: event.target.value }))}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<ScaleOutlinedIcon fontSize="small" />
								</InputAdornment>
							),
						}}
						inputProps={{ min: 0, step: 0.01 }}
						fullWidth
					/>

					<TextField
						label="Peso maximo"
						type="number"
						value={form.pesoMax}
						onChange={(event) => setForm((prev) => ({ ...prev, pesoMax: event.target.value }))}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<ScaleOutlinedIcon fontSize="small" />
								</InputAdornment>
							),
						}}
						inputProps={{ min: 0.01, step: 0.01 }}
						fullWidth
					/>

				</div>

				<Stack spacing={1.2} sx={{ mt: 2 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
							Rutas autorizadas
						</Typography>
						<Button
							variant="outlined"
							startIcon={<AddCircleOutlineOutlinedIcon />}
							onClick={() => setRutas((prev) => [...prev, createEmptyRuta()])}
						>
							Agregar ruta
						</Button>
					</Stack>

					{rutas.map((ruta, index) => (
						<Paper key={`ruta-${index}`} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
							<Stack spacing={1}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										Ruta {index + 1}
									</Typography>
									<IconButton
										size="small"
										onClick={() => {
											setRutas((prev) => prev.filter((_, routeIndex) => routeIndex !== index))
										}}
										disabled={rutas.length === 1}
									>
										<RemoveCircleOutlineOutlinedIcon fontSize="small" />
									</IconButton>
								</Stack>

								<div className="op-form-grid" style={{ marginTop: '0.25rem' }}>
									<TextField
										label="Ruta inicio"
										value={ruta.origen}
										onChange={(event) => {
											setRutas((prev) =>
												prev.map((item, routeIndex) =>
													routeIndex === index ? { ...item, origen: event.target.value } : item,
												),
											)
										}}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<AltRouteOutlinedIcon fontSize="small" />
												</InputAdornment>
											),
										}}
										fullWidth
									/>

									<TextField
										label="Ruta fin"
										value={ruta.destino}
										onChange={(event) => {
											setRutas((prev) =>
												prev.map((item, routeIndex) =>
													routeIndex === index ? { ...item, destino: event.target.value } : item,
												),
											)
										}}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<AltRouteOutlinedIcon fontSize="small" />
												</InputAdornment>
											),
										}}
										fullWidth
									/>

								</div>
							</Stack>
						</Paper>
					))}
				</Stack>

				<Divider sx={{ my: 2 }} />
				<Button className="op-btn op-btn--primary" onClick={() => void createContrato()} sx={{ mt: 2 }} disabled={submitting}>
					{submitting ? 'Guardando...' : 'Guardar contrato'}
				</Button>
			</Paper>

			<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
				<Typography variant="h6" className="op-title">Listado de contratos</Typography>
				<TableContainer>
					<Table className="op-table">
						<TableHead>
							<TableRow>
								<TableCell>Contrato</TableCell>
								<TableCell>Cliente</TableCell>
								<TableCell>Ruta inicio</TableCell>
								<TableCell>Ruta fin</TableCell>
								<TableCell>Estado</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{contratos.map((item) => (
								<TableRow key={item.id}>
									<TableCell>{`CTR-${String(item.id).padStart(4, '0')}`}</TableCell>
									<TableCell>{item.cliente}</TableCell>
									<TableCell>{item.origen}</TableCell>
									<TableCell>{item.destino}</TableCell>
									<TableCell>
										<Chip size="small" label={item.estado} color={item.estado === 'Vigente' ? 'success' : 'error'} />
									</TableCell>
								</TableRow>
							))}
							{!loadingInit && contratos.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5}>
										<Typography variant="body2" color="text.secondary">No hay contratos registrados.</Typography>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</motion.section>
	)
}

