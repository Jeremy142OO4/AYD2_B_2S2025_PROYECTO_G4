import { forwardRef, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Avatar,
	Button,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
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
	useMediaQuery,
} from '@mui/material'
import type { TransitionProps } from '@mui/material/transitions'
import { useTheme } from '@mui/material/styles'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined'
import MailOutlineOutlinedIcon from '@mui/icons-material/MailOutlineOutlined'
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

type Riesgo = 'BAJO' | 'MEDIO' | 'ALTO'
type EstadoCliente = 'Activo' | 'Bloqueado'

type HistorialServicio = {
	fecha: string
	orden: string
	estado: string
}

type Cliente = {
	id: number
	empresa: string
	nit: string
	correo: string
	telefono: string
	direccion: string
	riesgo: Riesgo
	limiteCredito: number
	estado: EstadoCliente
	historial: HistorialServicio[]
}

type BackendClient = {
	id_cliente?: number
	nombre: string
	correo: string
	rol: string
	nit?: string
	direccion?: string
	telefono?: string
	riesgo?: string
	limite_credito?: number
}

type BackendCreateResponse = {
	message?: string
	error?: string
	data?: {
		id_cliente?: number
		nombre_empresa?: string
		correo?: string
		nit?: string
		direccion?: string
		telefono?: string
		riesgo_global?: string
		limite_credito?: number
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

const modalAnim = {
	hidden: { opacity: 0, scale: 0.96, y: 18 },
	show: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: { duration: 0.24, ease: 'easeOut' as const },
	},
	exit: {
		opacity: 0,
		scale: 0.96,
		y: 18,
		transition: { duration: 0.18, ease: 'easeIn' as const },
	},
}

const MotionDialogTransition = forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement }>(
	function MotionDialogTransition(props, ref) {
		const { in: inProp, children, onEnter, onExited } = props

		if (inProp) {
			onEnter?.(undefined as never, false)
		}

		return (
			<motion.div
				ref={ref}
				variants={modalAnim}
				initial="hidden"
				animate={inProp ? 'show' : 'exit'}
				onAnimationComplete={() => {
					if (!inProp) {
						onExited?.(undefined as never)
					}
				}}
			>
				{children}
			</motion.div>
		)
	},
)

const money = (value: number) =>
	new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', maximumFractionDigits: 2 }).format(value)

const normalizeRisk = (raw?: string): Riesgo => {
	const value = String(raw ?? '').trim().toUpperCase()
	if (value === 'ALTO' || value === 'MEDIO') {
		return value
	}
	return 'BAJO'
}

const riskLabel = (riesgo: Riesgo) => riesgo.charAt(0) + riesgo.slice(1).toLowerCase()

const toEstado = (riesgo: Riesgo, limiteCredito: number): EstadoCliente =>
	riesgo === 'ALTO' || limiteCredito <= 0 ? 'Bloqueado' : 'Activo'

export default function ClientesOperativoPage() {
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('md'))

	const [clientes, setClientes] = useState<Cliente[]>([])
	const [selectedId, setSelectedId] = useState<number>(0)
	const [detailOpen, setDetailOpen] = useState(false)
	const [showCreate, setShowCreate] = useState(false)
	const [loadingList, setLoadingList] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	const [createForm, setCreateForm] = useState({
		empresa: '',
		nit: '',
		correo: '',
		password: '',
		direccion: '',
		telefono: '',
		riesgo: 'BAJO' as Riesgo,
		limiteCredito: '',
		diasCredito: '30',
	})

	const selected = useMemo(
		() => clientes.find((item) => item.id === selectedId) ?? null,
		[clientes, selectedId],
	)

	const selectedHistoryCount = selected?.historial.length ?? 0

	const openClienteDetalle = (id: number) => {
		setSelectedId(id)
		setDetailOpen(true)
	}

	const closeClienteDetalle = () => {
		setDetailOpen(false)
	}

	const loadClientes = async () => {
		try {
			setLoadingList(true)
			setError('')

			const response = await fetch(`${API_BASE_URL}/api/operativo/clientes`)
			if (!response.ok) {
				throw new Error('No se pudo cargar el listado de clientes.')
			}

			const payload = (await response.json()) as BackendClient[]
			const mapped = payload
				.filter((item) => item.rol.toLowerCase() === 'cliente' && typeof item.id_cliente === 'number')
				.map((item) => {
					const riesgo = normalizeRisk(item.riesgo)
					const limiteCredito = Number(item.limite_credito ?? 0)
					return {
						id: item.id_cliente as number,
						empresa: item.nombre,
						nit: item.nit ?? 'Sin NIT',
						correo: item.correo,
						telefono: item.telefono ?? 'Sin telefono',
						direccion: item.direccion ?? 'Sin direccion',
						riesgo,
						limiteCredito,
						estado: toEstado(riesgo, limiteCredito),
						historial: [],
					} satisfies Cliente
				})

			setClientes(mapped)
			setSelectedId((prev) => (prev && mapped.some((item) => item.id === prev) ? prev : (mapped[0]?.id ?? 0)))
		} catch (loadError) {
			setError(loadError instanceof Error ? loadError.message : 'Error al cargar clientes.')
		} finally {
			setLoadingList(false)
		}
	}

	useEffect(() => {
		void loadClientes()
	}, [])

	const saveCliente = async () => {
		const limiteCredito = Number(createForm.limiteCredito)
		const diasCredito = Number(createForm.diasCredito)

		if (
			!createForm.empresa.trim() ||
			!createForm.nit.trim() ||
			!createForm.correo.trim() ||
			!createForm.password.trim() ||
			!createForm.direccion.trim() ||
			!createForm.telefono.trim()
		) {
			setError('Completa todos los campos obligatorios para registrar al cliente.')
			return
		}

		if (Number.isNaN(limiteCredito) || limiteCredito <= 0) {
			setError('El limite de credito debe ser mayor a 0.')
			return
		}

		if (Number.isNaN(diasCredito) || diasCredito < 0) {
			setError('Los dias de credito deben ser 0 o mayor.')
			return
		}

		try {
			setSubmitting(true)
			setError('')
			setSuccess('')

			const payload = {
				nombre: createForm.empresa.trim(),
				correo: createForm.correo.trim().toLowerCase(),
				password: createForm.password.trim(),
				nit: createForm.nit.trim(),
				direccion: createForm.direccion.trim(),
				telefono: createForm.telefono.trim(),
				limite_credito: limiteCredito,
				dias_credito: diasCredito,
				capacidad_pago: createForm.riesgo,
				lavado_dinero: createForm.riesgo,
				aduanas: createForm.riesgo,
				cliente_activo: true,
				usuario_eliminado: false,
				foto_perfil: null,
			}

			const response = await fetch(`${API_BASE_URL}/api/operativo/clientes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})

			const result = (await response.json().catch(() => ({}))) as BackendCreateResponse
			if (!response.ok) {
				throw new Error(result.error ?? result.message ?? 'No se pudo registrar el cliente.')
			}

			setSuccess(result.message ?? 'Cliente creado exitosamente.')
			setShowCreate(false)
			setCreateForm({
				empresa: '',
				nit: '',
				correo: '',
				password: '',
				direccion: '',
				telefono: '',
				riesgo: 'BAJO',
				limiteCredito: '',
				diasCredito: '30',
			})

			await loadClientes()
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : 'Error al crear el cliente.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Stack direction="row" spacing={1} alignItems="center">
					<Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(27, 60, 83, 0.12)', color: 'var(--color-primary-dark)' }}>
						<BusinessOutlinedIcon fontSize="small" />
					</Avatar>
					<Typography variant="h5" className="op-title">
						Clientes
					</Typography>
				</Stack>
				<Button className="op-btn op-btn--primary" onClick={() => setShowCreate((prev) => !prev)}>
					{showCreate ? 'Cancelar' : 'Registrar cliente'}
				</Button>
			</div>

			<Alert severity="info" icon={<WarningAmberOutlinedIcon fontSize="inherit" />}>
				Registro gestionado por Operativo: alta de cliente con perfil de riesgo y limite de credito.
			</Alert>

			{loadingList ? <LinearProgress sx={{ mt: 1, mb: 1 }} /> : null}
			{error ? <Alert severity="error">{error}</Alert> : null}
			{success ? <Alert severity="success">{success}</Alert> : null}

			{showCreate ? (
				<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
					<Typography variant="h6" className="op-title">Nuevo cliente</Typography>
					<div className="op-form-grid" style={{ marginTop: '0.75rem' }}>
						<TextField
							label="Empresa"
							value={createForm.empresa}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, empresa: event.target.value }))}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<BusinessOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							fullWidth
						/>
						<TextField
							label="NIT"
							value={createForm.nit}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, nit: event.target.value }))}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<BadgeOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							fullWidth
						/>
						<TextField
							label="Correo"
							type="email"
							value={createForm.correo}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, correo: event.target.value }))}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<EmailOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							fullWidth
						/>
						<TextField
							label="Contrasena"
							type="password"
							value={createForm.password}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<LockOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							fullWidth
						/>
						<TextField
							label="Direccion"
							value={createForm.direccion}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, direccion: event.target.value }))}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<PlaceOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							fullWidth
						/>
						<TextField
							label="Telefono"
							value={createForm.telefono}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, telefono: event.target.value }))}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<PhoneOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							fullWidth
						/>
						<TextField
							label="Limite de credito"
							type="number"
							value={createForm.limiteCredito}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, limiteCredito: event.target.value }))}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SavingsOutlinedIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							inputProps={{ min: 1, step: 0.01 }}
							fullWidth
							required
						/>
						<TextField
							select
							label="Riesgo"
							value={createForm.riesgo}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, riesgo: event.target.value as Riesgo }))}
							fullWidth
						>
							<MenuItem value="BAJO">Bajo</MenuItem>
							<MenuItem value="MEDIO">Medio</MenuItem>
							<MenuItem value="ALTO">Alto</MenuItem>
						</TextField>
						<TextField
							label="Dias de credito"
							type="number"
							value={createForm.diasCredito}
							onChange={(event) => setCreateForm((prev) => ({ ...prev, diasCredito: event.target.value }))}
							inputProps={{ min: 0, step: 1 }}
							fullWidth
						/>
					</div>
					<Button className="op-btn op-btn--primary" onClick={() => void saveCliente()} sx={{ mt: 2 }} disabled={submitting}>
						{submitting ? 'Guardando...' : 'Guardar cliente'}
					</Button>
				</Paper>
			) : null}

			<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
				<TableContainer>
					<Table className="op-table">
						<TableHead>
							<TableRow>
								<TableCell>Cliente</TableCell>
								<TableCell>NIT</TableCell>
								<TableCell>Riesgo</TableCell>
								<TableCell>Limite de credito</TableCell>
								<TableCell>Estado</TableCell>
								<TableCell>Accion</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{clientes.map((cliente) => (
								<TableRow key={cliente.id} selected={cliente.id === selectedId}>
									<TableCell>{cliente.empresa}</TableCell>
									<TableCell>{cliente.nit}</TableCell>
									<TableCell>
										<Chip
											size="small"
											label={riskLabel(cliente.riesgo)}
											color={cliente.riesgo === 'ALTO' ? 'error' : cliente.riesgo === 'MEDIO' ? 'warning' : 'success'}
										/>
									</TableCell>
									<TableCell>{money(cliente.limiteCredito)}</TableCell>
									<TableCell>
										<Chip size="small" label={cliente.estado} color={cliente.estado === 'Bloqueado' ? 'error' : 'success'} />
									</TableCell>
									<TableCell>
										<Button size="small" className="op-action op-action--info" onClick={() => openClienteDetalle(cliente.id)}>
											Ver cliente
										</Button>
									</TableCell>
								</TableRow>
							))}
							{!loadingList && clientes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6}>
										<Typography variant="body2" color="text.secondary">No hay clientes registrados aun.</Typography>
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			<Dialog
				open={detailOpen && Boolean(selected)}
				onClose={closeClienteDetalle}
				fullScreen={isMobile}
				fullWidth
				maxWidth="md"
				TransitionComponent={MotionDialogTransition}
				closeAfterTransition
				slotProps={{
					backdrop: {
						sx: {
							backdropFilter: 'blur(10px)',
							backgroundColor: 'rgba(27, 60, 83, 0.26)',
						},
					},
					paper: {
						sx: {
							borderRadius: isMobile ? 0 : 4,
							m: isMobile ? 0 : 2,
							maxHeight: isMobile ? '100dvh' : 'calc(100dvh - 40px)',
							display: 'flex',
							overflow: 'hidden',
							border: '1px solid rgba(27, 60, 83, 0.12)',
							background: 'linear-gradient(180deg, rgba(249, 243, 239, 0.98) 0%, rgba(255, 255, 255, 0.98) 100%)',
							boxShadow: '0 28px 60px rgba(27, 60, 83, 0.28)',
						},
					},
				}}
			>
				{selected ? (
					<>
						<DialogTitle sx={{ p: 0 }}>
							<div
								style={{
									padding: '1.1rem 1.25rem 1rem',
									background: 'linear-gradient(135deg, rgba(27, 60, 83, 0.98) 0%, rgba(69, 104, 130, 0.96) 100%)',
									color: 'var(--color-background)',
									position: 'relative',
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										position: 'absolute',
										inset: 0,
										background:
											'radial-gradient(circle at 15% 15%, rgba(210, 193, 182, 0.24) 0%, rgba(210, 193, 182, 0) 34%), radial-gradient(circle at 90% 10%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 30%)',
										pointerEvents: 'none',
									}}
								/>
								<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ position: 'relative' }}>
									<Stack direction="row" spacing={1.3} alignItems="center">
										<Avatar sx={{ width: 46, height: 46, bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
											<AssignmentIndOutlinedIcon fontSize="small" />
										</Avatar>
										<div>
											<Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.05, color: '#fff' }}>
												Perfil de cliente
											</Typography>
											<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
												{selected.empresa}
											</Typography>
										</div>
									</Stack>
									<IconButton onClick={closeClienteDetalle} aria-label="Cerrar detalle" sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' } }}>
										<CloseRoundedIcon />
									</IconButton>
								</Stack>
							</div>
						</DialogTitle>
						<DialogContent sx={{ p: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
							<Stack spacing={2} sx={{ p: 2, pb: isMobile ? 3.2 : 2 }}>
								<Paper
									variant="outlined"
									sx={{
										p: 2,
										borderRadius: 4,
										borderColor: 'rgba(27, 60, 83, 0.12)',
										background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(249,243,239,0.98) 100%)',
									}}
								>
									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
										<Stack spacing={1} sx={{ width: '100%' }}>
											<Stack direction="row" spacing={1} flexWrap="wrap">
												<Chip size="small" icon={<ShieldOutlinedIcon />} label={riskLabel(selected.riesgo)} color={selected.riesgo === 'ALTO' ? 'error' : selected.riesgo === 'MEDIO' ? 'warning' : 'success'} />
												<Chip size="small" icon={<BusinessOutlinedIcon />} label={selected.estado} color={selected.estado === 'Bloqueado' ? 'error' : 'success'} />
											</Stack>

											<Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap' }}>
												<Paper variant="outlined" sx={{ px: 1.4, py: 1, borderRadius: 3, minWidth: 150, flex: '1 1 150px', borderColor: 'rgba(69, 104, 130, 0.18)' }}>
													<Stack direction="row" spacing={1} alignItems="center">
														<Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(27, 60, 83, 0.10)', color: 'var(--color-primary-dark)' }}>
															<CreditScoreOutlinedIcon fontSize="small" />
														</Avatar>
														<div>
															<Typography variant="caption" color="text.secondary">Límite de crédito</Typography>
															<Typography variant="body1" sx={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>{money(selected.limiteCredito)}</Typography>
														</div>
													</Stack>
												</Paper>

												<Paper variant="outlined" sx={{ px: 1.4, py: 1, borderRadius: 3, minWidth: 150, flex: '1 1 150px', borderColor: 'rgba(69, 104, 130, 0.18)' }}>
													<Stack direction="row" spacing={1} alignItems="center">
														<Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(27, 60, 83, 0.10)', color: 'var(--color-primary-dark)' }}>
															<TimelineOutlinedIcon fontSize="small" />
														</Avatar>
														<div>
															<Typography variant="caption" color="text.secondary">Servicios asociados</Typography>
															<Typography variant="body1" sx={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>{selectedHistoryCount}</Typography>
														</div>
													</Stack>
												</Paper>
											</Stack>
										</Stack>
									</Stack>
								</Paper>

								<Paper
									variant="outlined"
									sx={{
										p: 2,
										borderRadius: 4,
										borderColor: 'rgba(27, 60, 83, 0.12)',
										background: 'rgba(255,255,255,0.88)',
									}}
								>
									<Typography variant="subtitle1" className="op-title" sx={{ mb: 1.25 }}>
										Datos generales
									</Typography>
									<Stack spacing={1.1}>
										<Stack direction="row" spacing={1.2} alignItems="center">
											<Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(69, 104, 130, 0.12)', color: 'var(--color-primary-dark)' }}>
												<BusinessOutlinedIcon fontSize="small" />
											</Avatar>
											<Typography variant="body2"><strong>Empresa:</strong> {selected.empresa}</Typography>
										</Stack>
										<Stack direction="row" spacing={1.2} alignItems="center">
											<Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(69, 104, 130, 0.12)', color: 'var(--color-primary-dark)' }}>
												<MailOutlineOutlinedIcon fontSize="small" />
											</Avatar>
											<Typography variant="body2"><strong>Correo:</strong> {selected.correo || 'Sin correo'}</Typography>
										</Stack>
										<Stack direction="row" spacing={1.2} alignItems="center">
											<Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(69, 104, 130, 0.12)', color: 'var(--color-primary-dark)' }}>
												<LocalPhoneOutlinedIcon fontSize="small" />
											</Avatar>
											<Typography variant="body2"><strong>Teléfono:</strong> {selected.telefono || 'Sin telefono'}</Typography>
										</Stack>
										<Stack direction="row" spacing={1.2} alignItems="center">
											<Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(69, 104, 130, 0.12)', color: 'var(--color-primary-dark)' }}>
												<LocationOnOutlinedIcon fontSize="small" />
											</Avatar>
											<Typography variant="body2"><strong>Dirección:</strong> {selected.direccion || 'Sin direccion'}</Typography>
										</Stack>
									</Stack>
								</Paper>

								<Paper
									variant="outlined"
									sx={{
										p: 2,
										borderRadius: 4,
										borderColor: 'rgba(27, 60, 83, 0.12)',
										background: 'rgba(255,255,255,0.88)',
									}}
								>
									<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
										<Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(27, 60, 83, 0.12)', color: 'var(--color-primary-dark)' }}>
											<TimelineOutlinedIcon fontSize="small" />
										</Avatar>
										<Typography variant="subtitle1" className="op-title">
											Historial de servicios
										</Typography>
									</Stack>
									<Stack spacing={1}>
										{selected.historial.map((row) => (
											<Paper key={`${row.orden}-${row.fecha}`} variant="outlined" sx={{ p: 1.15, borderRadius: 2.5, borderColor: 'rgba(69, 104, 130, 0.18)', bgcolor: 'rgba(249, 243, 239, 0.55)' }}>
												<Typography variant="body2">
													<strong>{row.fecha}</strong> — {row.orden} — {row.estado}
												</Typography>
											</Paper>
										))}
										{selected.historial.length === 0 ? (
											<Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(69, 104, 130, 0.22)', bgcolor: 'rgba(69, 104, 130, 0.08)' }}>
												<Stack direction="row" spacing={1.2} alignItems="center">
													<Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(69, 104, 130, 0.14)', color: 'var(--color-primary-dark)' }}>
														<TimelineOutlinedIcon fontSize="small" />
													</Avatar>
													<div>
														<Typography variant="body2" sx={{ fontWeight: 700 }}>
															Sin historial registrado
														</Typography>
														<Typography variant="caption" color="text.secondary">
															Aún no hay servicios vinculados a este cliente.
														</Typography>
													</div>
												</Stack>
											</Paper>
										) : null}
									</Stack>
								</Paper>
							</Stack>
						</DialogContent>
					</>
				) : null}
			</Dialog>
		</motion.section>
	)
}
