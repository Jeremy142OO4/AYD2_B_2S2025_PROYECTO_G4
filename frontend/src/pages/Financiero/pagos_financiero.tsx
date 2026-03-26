import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
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

// 🔗 API BASE URL - Backend Go
const API_BASE_URL = 'http://localhost:4000'

// ========== FUNCIONES API ==========
async function obtenerFacturasCertificadasPendiente() {
	try {
		const response = await fetch(`${API_BASE_URL}/facturas/certificadas-pendiente`)
		const data = await response.json()
		return { data: response.ok ? data : null, error: response.ok ? null : data?.error }
	} catch (err) {
		return { data: null, error: 'Error de conexión' }
	}
}

async function obtenerPagos() {
	try {
		const response = await fetch(`${API_BASE_URL}/pagos`)
		const data = await response.json()
		return { data: response.ok ? data : null, error: response.ok ? null : data?.error }
	} catch (err) {
		return { data: null, error: 'Error de conexión' }
	}
}

async function registrarPago(payload: any) {
	try {
		console.log('Enviando pago al backend:', payload)
		const response = await fetch(`${API_BASE_URL}/pagos`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		})
		const data = await response.json()
		console.log('Respuesta del backend:', { status: response.status, data })
		return { data: response.ok ? data : null, error: response.ok ? null : (data?.message || data?.error || 'Error desconocido') }
	} catch (err) {
		console.error('Error en registrarPago:', err)
		return { data: null, error: 'Error de conexión' }
	}
}

type EstadoPago = 'pendiente' | 'Pagada' | 'Parcial' | 'certificado'

type MetodoPago = 'Transferencia' | 'Cheque' | 'Tarjeta'

type ItemFactura = {
	descripcion: string
	cantidad: number
	precio: number
}

type Factura = {
	id: string
	cliente: string
	nit: string
	direccionFiscal: string
	fechaEmision: string
	estado: EstadoPago
	items: ItemFactura[]
	total?: number
	iva?: number
	saldo?: number
}

type Pago = {
	id: string
	facturaId: string
	monto: number
	metodoPago: MetodoPago
	fechaPago: string
	referencia: string
	banco?: string
	estado?: string
	datosBancarios?: {
		banco: string
		numeroCuenta: string
		titular: string
	}
}

type ResultadoPago =
	| {
		status: 'ok'
		message: string
	}
	| {
		status: 'error'
		message: string
	}

const ivaRate = 0.12

const metodoPagoOptions: MetodoPago[] = ['Transferencia', 'Cheque', 'Tarjeta']

const bancosDisponibles = [
	'Banco Industrial',
	'Banco G&T',
	'Banco de Crédito',
	'Banco Azteca',
	'BAC',
	'Otro',
]

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

function calculateTotals(items: ItemFactura[]) {
	const subtotal = items.reduce((acc, item) => acc + item.cantidad * item.precio, 0)
	const iva = subtotal * ivaRate
	const total = subtotal + iva
	return { subtotal, iva, total }
}

function formatMoney(value: number): string {
	return `Q ${value.toLocaleString('es-GT', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

export default function PagosFinancieroPage() {
	const [facturas, setFacturas] = useState<Factura[]>([])
	const [pagos, setPagos] = useState<Pago[]>([])
	const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const [paymentOpen, setPaymentOpen] = useState(false)
	const [processing, setProcessing] = useState(false)
	const [paymentResult, setPaymentResult] = useState<ResultadoPago | null>(null)
	const [error, setError] = useState<string | null>(null)

	const [formPago, setFormPago] = useState({
		monto: '',
		metodoPago: 'Transferencia' as MetodoPago,
		referencia: '',
		banco: '',
		numeroCuenta: '',
		titular: '',
		numeroTarjeta: '',
		mesVencimiento: '',
		anoVencimiento: '',
		cvv: '',
	})

	// 📡 CARGAR DATOS DEL BACKEND
	useEffect(() => {
		const cargarDatos = async () => {
			setError(null)

			try {
				// Cargar facturas certificadas pendiente de pago
				const facturasResponse = await obtenerFacturasCertificadasPendiente()
				if (facturasResponse.data) {
					const facturasConvertidas: Factura[] = facturasResponse.data.map((f: any) => ({
						id: f.id.toString(),
						cliente: f.cliente_nombre || 'N/A',
						nit: f.nit || 'N/A',
						direccionFiscal: f.direccion_fiscal || 'N/A',
						fechaEmision: f.fecha,
						estado: f.estado,
						items: [],
						total: (f.total || 0) + (f.iva || 0),
						iva: f.iva,
						saldo: f.saldo || 0,
					}))
					setFacturas(facturasConvertidas)
				} else if (facturasResponse.error) {
					setError(facturasResponse.error)
				}

				// Cargar pagos
				const pagosResponse = await obtenerPagos()
				if (pagosResponse.data) {
					const pagosConvertidos: Pago[] = pagosResponse.data.map((p: any) => ({
						id: `PAG-${p.id}`,
						facturaId: p.factura_id.toString(),
						monto: p.monto,
						metodoPago: p.metodo as MetodoPago,
						fechaPago: new Date(p.fecha).toISOString().split('T')[0],
						referencia: p.numero_autorizacion,
						banco: p.banco,
						estado: p.estado,
						datosBancarios: p.banco
							? { banco: p.banco, numeroCuenta: '', titular: '' }
							: undefined,
					}))
					setPagos(pagosConvertidos)
				}
			} catch (err) {
				setError('Error al conectar con el servidor')
				console.error(err)
			}
		}

		cargarDatos()
	}, [])


	const selectedFactura = useMemo(
		() => facturas.find((factura) => factura.id === selectedFacturaId) ?? null,
		[facturas, selectedFacturaId],
	)

	const detailTotals = selectedFactura 
		? selectedFactura.total !== undefined 
			? { total: selectedFactura.total, subtotal: selectedFactura.total - (selectedFactura.iva || 0), iva: selectedFactura.iva || 0 }
			: calculateTotals(selectedFactura.items)
		: null

	const openPaymentModal = (facturaId: string) => {
		setSelectedFacturaId(facturaId)
		setPaymentResult(null)
		setFormPago({
			monto: '',
			metodoPago: 'Transferencia',
			referencia: '',
			banco: '',
			numeroCuenta: '',
			titular: '',
			numeroTarjeta: '',
			mesVencimiento: '',
			anoVencimiento: '',
			cvv: '',
		})
		setDetailOpen(false)
		setPaymentOpen(true)
	}

	const closeDetailModal = () => {
		setDetailOpen(false)
	}

	const closePaymentModal = () => {
		if (processing) return
		setPaymentOpen(false)
	}

	const procesarPago = async () => {
		if (!selectedFactura) {
			setPaymentResult({
				status: 'error',
				message: 'Error: no hay factura seleccionada.',
			})
			return
		}

		const monto = parseFloat(formPago.monto)
		// Usar el saldo pendiente (no el total) para validación
		const saldoPendiente = selectedFactura.saldo || 0

		console.log('Validando pago:', { monto, saldoPendiente, facturaId: selectedFactura.id })

		if (!formPago.monto || monto <= 0) {
			setPaymentResult({
				status: 'error',
				message: 'Error de validación: ingresa un monto válido.',
			})
			return
		}

		// Permitir un pequeño margen de error por decimales (0.01)
		if (monto > saldoPendiente + 0.01) {
			setPaymentResult({
				status: 'error',
				message: `Error: El monto a pagar (${formatMoney(monto)}) no puede exceder el saldo pendiente de la factura (${formatMoney(saldoPendiente)})`,
			})
			return
		}

		if (!formPago.referencia.trim()) {
			setPaymentResult({
				status: 'error',
				message: 'Error de validación: ingresa una referencia o número de transacción.',
			})
			return
		}

		// Validar datos según el método de pago
		if (formPago.metodoPago === 'Tarjeta') {
			if (!formPago.numeroTarjeta.trim() || !formPago.mesVencimiento.trim() || 
				!formPago.anoVencimiento.trim() || !formPago.cvv.trim()) {
				setPaymentResult({
					status: 'error',
					message: 'Error de validación: completa los datos de la tarjeta.',
				})
				return
			}
			if (formPago.numeroTarjeta.replace(/\s/g, '').length !== 16) {
				setPaymentResult({
					status: 'error',
					message: 'Error de validación: número de tarjeta debe tener 16 dígitos.',
				})
				return
			}
			if (formPago.cvv.length !== 3) {
				setPaymentResult({
					status: 'error',
					message: 'Error de validación: CVV debe tener 3 dígitos.',
				})
				return
			}
		} else {
			// Para transferencia y cheque, validar datos bancarios
			if (!formPago.banco.trim() || !formPago.numeroCuenta.trim() || !formPago.titular.trim()) {
				setPaymentResult({
					status: 'error',
					message: 'Error de validación: completa los datos bancarios.',
				})
				return
			}
		}

		setProcessing(true)
		setPaymentResult(null)

		try {
			// Extraer ID numérico de la factura para el backend
			const facturaIdNumerico = parseInt(selectedFactura.id.replace(/[^0-9]/g, '')) || 0
			if (facturaIdNumerico === 0) {
				setPaymentResult({
					status: 'error',
					message: 'Error: ID de factura inválido',
				})
				setProcessing(false)
				return
			}

			// 📡 ENVIAR PAGO AL BACKEND
			const response = await registrarPago({
				factura_id: facturaIdNumerico,
				monto: monto,
				metodo: formPago.metodoPago.toLowerCase(),
				banco: formPago.banco,
				numero_autorizacion: formPago.referencia,
			})

			if (response.error) {
				console.error('Error al registrar pago:', response.error)
				setPaymentResult({
					status: 'error',
					message: `Error: ${response.error}`,
				})
				setProcessing(false)
				return
			}

			// Actualizar estado local de factura
			setFacturas((prev) =>
				prev.map((factura) => {
					if (factura.id === selectedFactura.id) {
						const nuevoEstado =
							monto >= saldoPendiente
								? 'Pagada'
								: monto > 0
									? 'Parcial'
									: factura.estado
						return { ...factura, estado: nuevoEstado, saldo: Math.max(0, (factura.saldo || 0) - monto) }
					}
					return factura
				}),
			)

			// Crear nuevo pago local
			const nuevoPago: Pago = {
				id: `PAG-${Date.now()}`,
				facturaId: selectedFactura.id,
				monto: monto,
				metodoPago: formPago.metodoPago,
				fechaPago: new Date().toISOString().split('T')[0],
				referencia: formPago.referencia,
				datosBancarios: {
					banco: formPago.banco,
					numeroCuenta: formPago.numeroCuenta,
					titular: formPago.titular,
				},
			}

			setPagos((prev) => [...prev, nuevoPago])

			setPaymentResult({
				status: 'ok',
				message: '✅ Pago registrado correctamente en el servidor',
			})

			// Cerrar modal después de 2 segundos
			setTimeout(() => {
				setPaymentOpen(false)
				setFormPago({
					monto: '',
					metodoPago: 'Transferencia',
					referencia: '',
					banco: '',
					numeroCuenta: '',
					titular: '',
					numeroTarjeta: '',
					mesVencimiento: '',
					anoVencimiento: '',
					cvv: '',
				})
			}, 2000)
		} catch (err) {
			setPaymentResult({
				status: 'error',
				message: 'Error al procesar el pago en el servidor',
			})
		} finally {
			setProcessing(false)
		}
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Pagos
				</Typography>
			</div>

			{/* ALERTA DE ERROR */}
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}



{/* SECCIÓN SUPERIOR - FACTURAS PENDIENTES + FORMULARIO PAGO */}
		<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
			{/* FACTURAS PENDIENTES */}
			<Paper className="op-panel pf-panel" elevation={0}>
				<div style={{ padding: '1.5rem' }}>
					<Typography variant="h6" style={{ marginBottom: '1rem', fontWeight: 600, color: '#1b3c53' }}>
						Facturas Pendientes
					</Typography>
					{facturas.length > 0 ? (
						<TableContainer className="pf-tableWrap">
							<Table className="op-table" stickyHeader size="small">
								<TableHead>
									<TableRow>
										<TableCell>Factura</TableCell>
										<TableCell>Cliente</TableCell>
										<TableCell>Saldo Pendiente</TableCell>
										<TableCell>Acción</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
										{facturas.map((factura) => {
										const saldoPendiente = factura.saldo || 0
											return (
												<TableRow key={factura.id}>
													<TableCell>{factura.id}</TableCell>
													<TableCell>{factura.cliente}</TableCell>
													<TableCell>{formatMoney(saldoPendiente)}</TableCell>
													<TableCell>
														<Button
															size="small"
															className="op-action op-action--info"
															onClick={() => {
																setSelectedFacturaId(factura.id)
																setFormPago({
																	monto: saldoPendiente.toString(),
																	metodoPago: 'Transferencia',
																	referencia: '',
																	banco: '',
																	numeroCuenta: '',
																	titular: '',
																	numeroTarjeta: '',
																	mesVencimiento: '',
																	anoVencimiento: '',
																	cvv: '',
																})
															}}
														>
															Seleccionar
														</Button>
													</TableCell>
												</TableRow>
											)
										})}
								</TableBody>
							</Table>
						</TableContainer>
					) : (
						<Box sx={{ textAlign: 'center', py: 3, color: '#456882' }}>
							<Typography>No hay facturas pendientes.</Typography>
						</Box>
					)}
				</div>
			</Paper>

			{/* FORMULARIO DE PAGO */}
			<Paper className="op-panel pf-panel" elevation={0}>
				<div style={{ padding: '1.5rem' }}>
					<Typography variant="h6" style={{ marginBottom: '1rem', fontWeight: 600, color: '#1b3c53' }}>
						Registrar Pago
					</Typography>
					{selectedFactura ? (
						<div className="pf-paymentForm">
							<section style={{ marginBottom: '1.5rem' }}>
								<Typography variant="subtitle2" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
									Factura seleccionada
								</Typography>
								<Box sx={{ backgroundColor: 'rgba(210, 193, 182, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>
									<Typography variant="body2">
										<strong>{selectedFactura.id}</strong>
									</Typography>
									<Typography variant="body2">{selectedFactura.cliente}</Typography>
									<Typography variant="body2">NIT: {selectedFactura.nit}</Typography>
									<Typography variant="body2">
										{formatMoney(selectedFactura.total || calculateTotals(selectedFactura.items).total)}
									</Typography>
								</Box>
							</section>

							<Stack spacing={2}>
								<TextField
									label="Monto a pagar"
									type="number"
									value={formPago.monto}
									onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
									inputProps={{ step: '0.01', min: '0' }}
									size="small"
									fullWidth
								/>

								<FormControl fullWidth size="small">
									<InputLabel>Método de pago</InputLabel>
									<Select
										value={formPago.metodoPago}
										label="Método de pago"
										onChange={(e) =>
											setFormPago({ ...formPago, metodoPago: e.target.value as MetodoPago })
										}
									>
										{metodoPagoOptions.map((metodo) => (
											<MenuItem key={metodo} value={metodo}>
												{metodo}
											</MenuItem>
										))}
									</Select>
								</FormControl>

								<TextField
									label="Referencia"
									value={formPago.referencia}
									onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
									size="small"
									fullWidth
									placeholder="Ej: AUTH-2026-001"
								/>

								{formPago.metodoPago === 'Tarjeta' ? (
									<>
										<TextField
											label="Número de tarjeta"
											value={formPago.numeroTarjeta}
											onChange={(e) =>
												setFormPago({ ...formPago, numeroTarjeta: e.target.value.replace(/\D/g, '').slice(0, 16) })
											}
											size="small"
											fullWidth
											placeholder="0000 0000 0000 0000"
											inputProps={{ maxLength: 16 }}
										/>

										<Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
											<TextField
												label="Mes vencimiento"
												value={formPago.mesVencimiento}
												onChange={(e) =>
													setFormPago({ ...formPago, mesVencimiento: e.target.value.replace(/\D/g, '').slice(0, 2) })
												}
												size="small"
												placeholder="MM"
												inputProps={{ maxLength: 2 }}
											/>
											<TextField
												label="Año"
												value={formPago.anoVencimiento}
												onChange={(e) =>
													setFormPago({ ...formPago, anoVencimiento: e.target.value.replace(/\D/g, '').slice(0, 4) })
												}
												size="small"
												placeholder="YYYY"
												inputProps={{ maxLength: 4 }}
											/>
											<TextField
												label="CVV"
												value={formPago.cvv}
												onChange={(e) =>
													setFormPago({ ...formPago, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })
												}
												size="small"
												placeholder="000"
												inputProps={{ maxLength: 3, type: 'password' }}
											/>
										</Box>
									</>
								) : (
									<>
										<FormControl fullWidth size="small">
											<InputLabel>Banco</InputLabel>
											<Select
												value={formPago.banco}
												label="Banco"
												onChange={(e) => setFormPago({ ...formPago, banco: e.target.value })}
											>
												{bancosDisponibles.map((banco) => (
													<MenuItem key={banco} value={banco}>
														{banco}
													</MenuItem>
												))}
											</Select>
										</FormControl>

										<TextField
											label="No. de cuenta"
											value={formPago.numeroCuenta}
											onChange={(e) =>
												setFormPago({ ...formPago, numeroCuenta: e.target.value })
											}
											size="small"
											fullWidth
										/>

										<TextField
											label="Titular"
											value={formPago.titular}
											onChange={(e) => setFormPago({ ...formPago, titular: e.target.value })}
											size="small"
											fullWidth
										/>
									</>
								)}

								<Button
									variant="contained"
									fullWidth
									onClick={procesarPago}
									disabled={processing}
									sx={{ backgroundColor: '#1b3c53', '&:hover': { backgroundColor: '#456882' } }}
								>
									{processing ? 'Procesando...' : 'Registrar Pago'}
								</Button>
							</Stack>

							{paymentResult && (
								<Alert
									severity={paymentResult.status === 'ok' ? 'success' : 'error'}
									sx={{ mt: 2 }}
								>
									{paymentResult.message}
								</Alert>
							)}
						</div>
					) : (
						<Box sx={{ textAlign: 'center', py: 3, color: '#456882' }}>
							<Typography>Selecciona una factura para pagar</Typography>
						</Box>
					)}
				</div>
			</Paper>
		</Box>

		{/* SECCIÓN INFERIOR - TODOS LOS PAGOS */}
		<Paper className="op-panel pf-panel" elevation={0} style={{ marginTop: '2rem' }}>
			<div style={{ padding: '1.5rem' }}>
				<Typography variant="h6" style={{ marginBottom: '1rem', fontWeight: 600, color: '#1b3c53' }}>
					Todos los Pagos
				</Typography>
				{pagos.length > 0 ? (
					<TableContainer className="pf-tableWrap">
						<Table className="op-table" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell>ID Pago</TableCell>
									<TableCell>Factura</TableCell>
									<TableCell>Monto</TableCell>
									<TableCell>Método</TableCell>
									<TableCell>Banco</TableCell>
									<TableCell>Referencia</TableCell>
									<TableCell>Estado</TableCell>
									<TableCell>Fecha</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{pagos.map((pago) => (
									<TableRow key={pago.id}>
										<TableCell>{pago.id}</TableCell>
										<TableCell>{pago.facturaId}</TableCell>
										<TableCell>{formatMoney(pago.monto)}</TableCell>
										<TableCell>{pago.metodoPago}</TableCell>
										<TableCell>{pago.banco || '-'}</TableCell>
										<TableCell>{pago.referencia}</TableCell>
										<TableCell>
											<Chip
												label={pago.estado || 'N/A'}
												size="small"
												sx={{
													backgroundColor:
														pago.estado?.toLowerCase() === 'pagado'
															? 'rgba(76, 140, 100, 0.3)'
															: 'rgba(210, 193, 182, 0.4)',
													color:
														pago.estado?.toLowerCase() === 'pagado'
															? '#2d5f40'
															: '#5a4a3a',
												}}
											/>
										</TableCell>
										<TableCell>{pago.fechaPago}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				) : (
					<Box sx={{ textAlign: 'center', py: 3, color: '#456882' }}>
						<Typography>No hay pagos registrados.</Typography>
					</Box>
				)}
			</div>
		</Paper>

			{/* DETALLE FACTURA DIALOG */}
			<Dialog
				open={detailOpen}
				onClose={closeDetailModal}
				maxWidth="lg"
				fullWidth
				className="pf-detailDialog"
			>
				<DialogTitle>
					<div className="pf-detailHeader">
						<Typography variant="h6" className="op-title">
							Detalle de Factura
						</Typography>
						{selectedFactura && (
							<Chip
								label={selectedFactura.estado}
								sx={{
									backgroundColor:
										selectedFactura.estado === 'pendiente'
											? 'rgba(210, 193, 182, 0.4)'
											: selectedFactura.estado === 'Parcial'
												? 'rgba(69, 104, 130, 0.3)'
												: 'rgba(76, 140, 100, 0.3)',
									color:
										selectedFactura.estado === 'pendiente'
											? '#5a4a3a'
											: selectedFactura.estado === 'Parcial'
												? '#1b3c53'
												: '#2d5f40',
								}}
							/>
						)}
					</div>
				</DialogTitle>
				<DialogContent className="pf-detailDialogBody">
					{selectedFactura && detailTotals && (
						<div className="pf-detailGrid">
							<section className="pf-detailCard">
								<h3>Datos Generales</h3>
								<ul>
									<li>Numero factura: {selectedFactura.id}</li>
									<li>Cliente: {selectedFactura.cliente}</li>
									<li>NIT: {selectedFactura.nit}</li>
									<li>Direccion fiscal: {selectedFactura.direccionFiscal}</li>
									<li>Fecha emision: {selectedFactura.fechaEmision}</li>
									<li>Estado: {selectedFactura.estado}</li>
								</ul>
							</section>

							<section className="pf-detailCard">
								<h3>Detalle de servicio</h3>
								<TableContainer>
									<Table size="small" className="pf-miniTable">
										<TableHead>
											<TableRow>
												<TableCell>Descripcion</TableCell>
												<TableCell>Cantidad</TableCell>
												<TableCell>Precio</TableCell>
												<TableCell>Subtotal</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{selectedFactura.items.map((item) => (
												<TableRow key={`${selectedFactura.id}-${item.descripcion}`}>
													<TableCell>{item.descripcion}</TableCell>
													<TableCell>{item.cantidad}</TableCell>
													<TableCell>{formatMoney(item.precio)}</TableCell>
													<TableCell>{formatMoney(item.cantidad * item.precio)}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
								<Divider className="pf-divider" style={{ margin: '1rem 0' }} />
								<div className="pf-summary">
									<p>
										Subtotal: <strong>{formatMoney(detailTotals.subtotal)}</strong>
									</p>
									<p>
										IVA: <strong>{formatMoney(detailTotals.iva)}</strong>
									</p>
									<p>
										Total: <strong>{formatMoney(detailTotals.total)}</strong>
									</p>
								</div>
							</section>

							<section className="pf-detailCard pf-detailCard--actions">
								<h3>Acciones</h3>
								{(selectedFactura.estado === 'pendiente' ||
									selectedFactura.estado === 'Parcial') && (
									<Button
										className="pf-paymentBtn"
										onClick={() => openPaymentModal(selectedFactura.id)}
										sx={{
											backgroundColor: '#1b3c53',
											color: '#f9f3ef',
											padding: '0.5rem 1.25rem',
											borderRadius: '6px',
											fontWeight: 500,
											'&:hover': {
												backgroundColor: '#456882',
											},
										}}
									>
										Proceder al pago
									</Button>
								)}
								{selectedFactura.estado === 'Pagada' && (
									<Typography className="pf-emptyAction">
										Esta factura ya ha sido pagada en su totalidad.
									</Typography>
								)}
							</section>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={closeDetailModal}>Cerrar</Button>
				</DialogActions>
			</Dialog>

			{/* PAYMENT DIALOG */}
			<Dialog open={paymentOpen} onClose={closePaymentModal} maxWidth="md" fullWidth>
				<DialogTitle>Registrar Pago</DialogTitle>
				<DialogContent>
					{selectedFactura && (
						<div className="pf-paymentForm">
							<section style={{ marginBottom: '1.5rem' }}>
								<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
									Vista previa factura
								</Typography>
								<Box
									sx={{
										backgroundColor: 'rgba(210, 193, 182, 0.1)',
										padding: '1rem',
										borderRadius: '6px',
										borderLeft: '4px solid #1b3c53',
									}}
								>
									<p>
										<strong>Factura:</strong> {selectedFactura.id}
									</p>
									<p>
										<strong>Cliente:</strong> {selectedFactura.cliente}
									</p>
									<p>
										<strong>NIT:</strong> {selectedFactura.nit}
									</p>
									<p>
										<strong>Total a pagar:</strong>{' '}
										{formatMoney(selectedFactura.total !== undefined ? selectedFactura.total : calculateTotals(selectedFactura.items).total)}
									</p>
								</Box>
							</section>

							<Divider style={{ margin: '1.5rem 0' }} />

							<section style={{ marginBottom: '1.5rem' }}>
								<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: '1rem' }}>
									Formulario de pago
								</Typography>
								<Stack spacing={2}>
									<TextField
										label="Monto a pagar"
										type="number"
										value={formPago.monto}
										onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
										inputProps={{ step: '0.01', min: '0' }}
										fullWidth
									/>

									<FormControl fullWidth>
										<InputLabel>Método de pago</InputLabel>
										<Select
											value={formPago.metodoPago}
											label="Método de pago"
											onChange={(e) =>
												setFormPago({ ...formPago, metodoPago: e.target.value as MetodoPago })
											}
										>
											{metodoPagoOptions.map((metodo) => (
												<MenuItem key={metodo} value={metodo}>
													{metodo}
												</MenuItem>
											))}
										</Select>
									</FormControl>

									<TextField
										label="Referencia o No. de transacción"
										value={formPago.referencia}
										onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
										fullWidth
										placeholder="Ej: 123456789"
									/>
								</Stack>
							</section>

							{/* Datos de pago según método */}
							{formPago.metodoPago === 'Tarjeta' ? (
								<section>
									<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: '1rem' }}>
										Datos de la tarjeta
									</Typography>
									<Stack spacing={2}>
										<TextField
											label="Número de tarjeta"
											value={formPago.numeroTarjeta}
											onChange={(e) =>
												setFormPago({ ...formPago, numeroTarjeta: e.target.value.replace(/\D/g, '').slice(0, 16) })
											}
											fullWidth
											placeholder="0000 0000 0000 0000"
											inputProps={{ maxLength: 16 }}
										/>

										<Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
											<TextField
												label="Mes vencimiento"
												value={formPago.mesVencimiento}
												onChange={(e) =>
													setFormPago({ ...formPago, mesVencimiento: e.target.value.replace(/\D/g, '').slice(0, 2) })
												}
												placeholder="MM"
												inputProps={{ maxLength: 2 }}
											/>
											<TextField
												label="Año"
												value={formPago.anoVencimiento}
												onChange={(e) =>
													setFormPago({ ...formPago, anoVencimiento: e.target.value.replace(/\D/g, '').slice(0, 4) })
												}
												placeholder="YYYY"
												inputProps={{ maxLength: 4 }}
											/>
											<TextField
												label="CVV"
												value={formPago.cvv}
												onChange={(e) =>
													setFormPago({ ...formPago, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })
												}
												placeholder="000"
												inputProps={{ maxLength: 3, type: 'password' }}
											/>
										</Box>
									</Stack>
								</section>
							) : (
								<section>
									<Typography variant="subtitle1" style={{ fontWeight: 600, marginBottom: '1rem' }}>
										Registro de datos bancarios
									</Typography>
									<Stack spacing={2}>
										<FormControl fullWidth>
											<InputLabel>Banco</InputLabel>
											<Select
												value={formPago.banco}
												label="Banco"
												onChange={(e) => setFormPago({ ...formPago, banco: e.target.value })}
											>
												{bancosDisponibles.map((banco) => (
													<MenuItem key={banco} value={banco}>
														{banco}
													</MenuItem>
												))}
											</Select>
										</FormControl>

										<TextField
											label="Número de cuenta"
											value={formPago.numeroCuenta}
											onChange={(e) =>
												setFormPago({ ...formPago, numeroCuenta: e.target.value })
											}
											fullWidth
											placeholder="Ej: 123456789012"
										/>

										<TextField
											label="Titular de la cuenta"
											value={formPago.titular}
											onChange={(e) => setFormPago({ ...formPago, titular: e.target.value })}
											fullWidth
											placeholder="Nombre del titular"
										/>
									</Stack>
								</section>
							)}

							{paymentResult && (
								<Alert
									severity={paymentResult.status === 'ok' ? 'success' : 'error'}
									sx={{ mt: 2 }}
								>
									{paymentResult.status === 'ok' ? '✔ ' : '❌ '}
									{paymentResult.message}
								</Alert>
							)}
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={closePaymentModal} disabled={processing}>
						Cancelar
					</Button>
					<Button
						onClick={procesarPago}
						disabled={processing || !selectedFactura}
						variant="contained"
						sx={{ backgroundColor: '#1b3c53', '&:hover': { backgroundColor: '#456882' } }}
					>
						{processing ? 'Procesando...' : 'Confirmar pago'}
					</Button>
				</DialogActions>
			</Dialog>
		</motion.section>
	)
}
