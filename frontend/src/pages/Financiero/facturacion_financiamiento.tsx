import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { jsPDF } from 'jspdf'
import {
	Alert,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
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

type EstadoFactura = 'Borrador' | 'Certificada' | 'Pendiente' | 'Pagada' | 'Vencida'

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
	estado: EstadoFactura
	items: ItemFactura[]
	autorizacion?: string
	serie?: string
	uuid?: string
	total?: number
	iva?: number
	ordenID?: number
	clienteID?: number
}

type CertResult =
	| {
		status: 'ok'
		message: string
	}
	| {
		status: 'error'
		message: string
	}

const ivaRate = 0.12

const statusOptions: Array<EstadoFactura | 'Todos'> = [
	'Todos',
	'Borrador',
	'Certificada',
	'Pendiente',
	'Pagada',
	'Vencida',
]

interface FacturaBackend {
	id: number
	cliente_nombre?: string
	nit?: string
	direccion_fiscal?: string
	fecha: string
	estado: string
	total: number
	iva: number
	uuid?: string
	orden_id?: number
	cliente_id?: number
}

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

function calculateTotals(factura: Factura) {
	// Si la factura tiene items, calcular basándose en items
	if (factura.items && factura.items.length > 0) {
		const subtotal = factura.items.reduce((acc, item) => acc + item.cantidad * item.precio, 0)
		const iva = subtotal * ivaRate
		const total = subtotal + iva
		return { subtotal, iva, total }
	}
	// Si no hay items, usar los valores del backend
	// En los datos del backend: total = subtotal (ANTES de IVA), iva = IVA
	if (factura.total && factura.iva) {
		const subtotal = factura.total
		const iva = factura.iva
		const total = subtotal + iva
		return { subtotal, iva, total }
	}
	// Fallback
	return { subtotal: 0, iva: 0, total: 0 }
}

function formatMoney(value: number): string {
	return `Q ${value.toLocaleString('es-GT', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

function buildAndDownloadInvoicePdf(factura: Factura, isDraft = false): void {
	const totals = calculateTotals(factura)
	const doc = new jsPDF({ unit: 'mm', format: 'a4' })
	const pageWidth = doc.internal.pageSize.getWidth()

	doc.setFillColor(27, 60, 83)
	doc.rect(0, 0, pageWidth, 22, 'F')
	doc.setTextColor(249, 243, 239)
	doc.setFont('helvetica', 'bold')
	doc.setFontSize(15)
	doc.text('LogiTrans - Factura Electronica', 12, 14)

	if (isDraft) {
		doc.setTextColor(220, 220, 220)
		doc.setFont('helvetica', 'bold')
		doc.setFontSize(60)
		doc.text('BORRADOR', pageWidth / 2, 140, { align: 'center', angle: 45 } as any)
	}

	doc.setTextColor(27, 60, 83)
	doc.setFont('helvetica', 'normal')
	doc.setFontSize(11)
	doc.text(`No. Factura: ${factura.id}`, 12, 30)
	doc.text(`Fecha emision: ${factura.fechaEmision}`, 12, 36)
	doc.text(`Estado: ${factura.estado}`, 12, 42)

	doc.setFont('helvetica', 'bold')
	doc.text('Datos del cliente', 12, 52)
	doc.setFont('helvetica', 'normal')
	doc.text(`Cliente: ${factura.cliente}`, 12, 58)
	doc.text(`NIT: ${factura.nit}`, 12, 64)
	doc.text(`Direccion fiscal: ${factura.direccionFiscal}`, 12, 70)

	if (factura.estado === 'Certificada') {
		doc.setFont('helvetica', 'bold')
		doc.text('Datos FEL', 12, 80)
		doc.setFont('helvetica', 'normal')
		doc.text(`Autorizacion: ${factura.autorizacion ?? 'N/A'}`, 12, 86)
		doc.text(`Serie: ${factura.serie ?? 'N/A'}`, 12, 92)
		doc.text(`UUID: ${factura.uuid ?? 'N/A'}`, 12, 98)
	}

	let y = factura.estado === 'Certificada' ? 108 : 84

	doc.setFillColor(210, 193, 182)
	doc.rect(12, y, pageWidth - 24, 8, 'F')
	doc.setFont('helvetica', 'bold')
	doc.text('Descripcion', 14, y + 5.6)
	doc.text('Cant.', 108, y + 5.6)
	doc.text('Precio', 128, y + 5.6)
	doc.text('Subtotal', 164, y + 5.6)

	y += 11
	doc.setFont('helvetica', 'normal')

	factura.items.forEach((item) => {
		const subtotal = item.cantidad * item.precio
		doc.text(item.descripcion, 14, y)
		doc.text(String(item.cantidad), 108, y)
		doc.text(formatMoney(item.precio), 128, y)
		doc.text(formatMoney(subtotal), 164, y)
		y += 7
	})

	y += 6
	doc.setDrawColor(69, 104, 130)
	doc.line(128, y, pageWidth - 12, y)
	y += 7

	doc.text(`Subtotal: ${formatMoney(totals.subtotal)}`, 128, y)
	y += 7
	doc.text(`IVA (12%): ${formatMoney(totals.iva)}`, 128, y)
	y += 7
	doc.setFont('helvetica', 'bold')
	doc.text(`Total: ${formatMoney(totals.total)}`, 128, y)

	doc.save(`factura-${factura.id}.pdf`)
}

export default function FacturacionFinanciamientoPage() {
	const [facturas, setFacturas] = useState<Factura[]>([])
	const [loading, setLoading] = useState(true)
	const [searchCliente, setSearchCliente] = useState('')
	const [statusFilter, setStatusFilter] = useState<EstadoFactura | 'Todos'>('Todos')
	const [fechaFilter, setFechaFilter] = useState('')
	const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const [felOpen, setFelOpen] = useState(false)
	const [certifying, setCertifying] = useState(false)
	const [certResult, setCertResult] = useState<CertResult | null>(null)

	// Cargar facturas en borrador desde el backend
	useEffect(() => {
		const cargarFacturas = async () => {
			try {
				setLoading(true)
				const response = await fetch('http://localhost:4000/facturas/borrador')
				if (!response.ok) throw new Error('Error al cargar facturas')
				
				const data: FacturaBackend[] = await response.json()
				const facturasFormateadas: Factura[] = data.map((f) => ({
					id: String(f.id),
					cliente: f.cliente_nombre || 'Sin cliente',
					nit: f.nit || '',
					direccionFiscal: f.direccion_fiscal || '',
					fechaEmision: f.fecha ? f.fecha.split('T')[0] : '',
					estado: 'Borrador' as EstadoFactura,
					items: [],
					uuid: f.uuid,
					total: f.total,
					iva: f.iva,
				}))
				setFacturas(facturasFormateadas)
			} catch (error) {
				console.error('Error al cargar facturas:', error)
				setFacturas([])
			} finally {
				setLoading(false)
			}
		}

		cargarFacturas()
	}, [])

	const filteredFacturas = useMemo(() => {
		return facturas.filter((factura) => {
			const byCliente = factura.cliente.toLowerCase().includes(searchCliente.trim().toLowerCase())
			const byEstado = statusFilter === 'Todos' || factura.estado === statusFilter
			const byFecha = !fechaFilter || factura.fechaEmision === fechaFilter
			return byCliente && byEstado && byFecha
		})
	}, [facturas, searchCliente, statusFilter, fechaFilter])

	const selectedFactura = useMemo(
		() => facturas.find((factura) => factura.id === selectedFacturaId) ?? null,
		[facturas, selectedFacturaId],
	)

	const detailTotals = selectedFactura ? calculateTotals(selectedFactura) : null

	const openDetail = (facturaId: string) => {
		setSelectedFacturaId(facturaId)
		setCertResult(null)
		setDetailOpen(true)
	}

	const openFelModal = (facturaId: string) => {
		setSelectedFacturaId(facturaId)
		setCertResult(null)
		setDetailOpen(false)
		setFelOpen(true)
	}

	const closeDetailModal = () => {
		setDetailOpen(false)
	}

	const closeFelModal = () => {
		if (certifying) return
		setFelOpen(false)
	}

	const certifyFactura = async () => {
		if (!selectedFactura || selectedFactura.estado !== 'Borrador') {
			setCertResult({
				status: 'error',
				message: 'Error de validacion: solo se pueden certificar facturas en borrador.',
			})
			return
		}

		setCertifying(true)
		setCertResult(null)

		try {
			console.log(`Enviando factura ${selectedFactura.id} a certificación...`)
			
			const response = await fetch(`http://localhost:4000/validar_y_enviar_factura/${selectedFactura.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			const data = await response.json()
			console.log('Respuesta del backend:', data)

			if (!response.ok) {
				setCertResult({
					status: 'error',
					message: data.message || data.error || 'Error al certificar la factura.',
				})
				setCertifying(false)
				return
			}

			// Actualizar la factura con los datos del backend
			setFacturas((prev) =>
				prev.map((factura) =>
					factura.id === selectedFactura.id
						? {
								...factura,
								estado: 'Certificada' as EstadoFactura,
								autorizacion: data.autorizacion || data.numero_autorizacion,
								serie: data.serie,
								uuid: data.uuid,
						  }
						: factura,
				),
			)

			setCertResult({ status: 'ok', message: 'Factura certificada correctamente.' })
			setCertifying(false)
		} catch (error) {
			console.error('Error al certificar:', error)
			setCertResult({
				status: 'error',
				message: error instanceof Error ? error.message : 'Error de conexión al certificar.',
			})
			setCertifying(false)
		}
	}

	const downloadPdf = () => {
		if (!selectedFactura) return
		const isDraft = selectedFactura.estado === 'Borrador'
		buildAndDownloadInvoicePdf(selectedFactura, isDraft)
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Facturacion
				</Typography>
			</div>

			<Paper className="op-panel fi-panel" elevation={0}>
				<div className="fi-filters">
					<TextField
						label="Buscar por cliente"
						value={searchCliente}
						onChange={(event) => setSearchCliente(event.target.value)}
						size="small"
						fullWidth
					/>
					<TextField
						label="Estado"
						select
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value as EstadoFactura | 'Todos')}
						size="small"
						fullWidth
					>
						{statusOptions.map((status) => (
							<MenuItem key={status} value={status}>
								{status}
							</MenuItem>
						))}
					</TextField>
					<TextField
						label="Fecha"
						type="date"
						value={fechaFilter}
						onChange={(event) => setFechaFilter(event.target.value)}
						size="small"
						InputLabelProps={{ shrink: true }}
						fullWidth
					/>
				</div>

				<TableContainer className="fi-tableWrap">
					<Table className="op-table" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell>No. Factura</TableCell>
								<TableCell>Cliente</TableCell>
								<TableCell>Fecha emision</TableCell>
								<TableCell>Monto</TableCell>
								<TableCell>Estado</TableCell>
								<TableCell>Accion</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={6}>
										<Typography className="fi-empty">Cargando facturas...</Typography>
									</TableCell>
								</TableRow>
							) : filteredFacturas.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6}>
										<Typography className="fi-empty">No hay facturas con esos filtros.</Typography>
									</TableCell>
								</TableRow>
							) : (
								filteredFacturas.map((factura) => {
									const totals = calculateTotals(factura)
									return (
										<TableRow key={factura.id}>
											<TableCell>{factura.id}</TableCell>
											<TableCell>{factura.cliente}</TableCell>
											<TableCell>{factura.fechaEmision}</TableCell>
											<TableCell>{formatMoney(totals.total)}</TableCell>
											<TableCell>
												<Chip
													label={factura.estado}
													size="small"
													className={`op-state fi-state fi-state--${factura.estado.toLowerCase()}`}
												/>
											</TableCell>
											<TableCell>
												<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
													<Button className="op-action op-action--info" onClick={() => openDetail(factura.id)}>
														Ver detalle
													</Button>
													{factura.estado === 'Borrador' && (
														<Button className="op-action op-action--create" onClick={() => openFelModal(factura.id)}>
															Certificar
														</Button>
													)}
												</Stack>
											</TableCell>
										</TableRow>
									)
								})
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			<Dialog open={detailOpen} onClose={closeDetailModal} maxWidth="lg" fullWidth className="fi-detailDialog">
				<DialogTitle>
					<div className="fi-detailHeader">
						<Typography variant="h6" className="op-title">
							Detalle de Factura
						</Typography>
						{selectedFactura && (
							<Chip
								label={selectedFactura.estado}
								className={`op-state fi-state fi-state--${selectedFactura.estado.toLowerCase()}`}
							/>
						)}
					</div>
				</DialogTitle>
				<DialogContent className="fi-detailDialogBody">
					{selectedFactura && detailTotals && (
						<div className="fi-detailGrid">
							<section className="fi-detailCard">
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

							<section className="fi-detailCard">
								<h3>Detalle de servicio</h3>
								<TableContainer>
									<Table size="small" className="fi-miniTable">
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
								<Divider className="fi-divider" />
								<div className="fi-summary">
									<p>Subtotal: <strong>{formatMoney(detailTotals.subtotal)}</strong></p>
									<p>IVA: <strong>{formatMoney(detailTotals.iva)}</strong></p>
									<p>Total: <strong>{formatMoney(detailTotals.total)}</strong></p>
								</div>
							</section>

							<section className="fi-detailCard fi-detailCard--actions">
								<h3>Acciones</h3>
								{selectedFactura.estado === 'Borrador' ? (
								<Stack spacing={2}>
									<Button className="op-btn op-btn--secondary" onClick={downloadPdf} size="small">
										Descargar Preview (Borrador)
									</Button>
									<Button className="fi-felBtn" onClick={() => openFelModal(selectedFactura.id)}>
										Enviar a Certificacion FEL
									</Button>
								</Stack>
							) : selectedFactura.estado === 'Certificada' ? (
								<div className="fi-certData">
									<p>Numero autorizacion: {selectedFactura.autorizacion}</p>
									<p>Serie: {selectedFactura.serie}</p>
									<p>UUID: {selectedFactura.uuid}</p>
									<Button className="op-btn op-btn--primary" onClick={downloadPdf}>
										Descargar PDF Oficial
									</Button>
								</div>
							) : selectedFactura.estado === 'Pagada' ? (
								<Button className="op-btn op-btn--secondary" onClick={downloadPdf}>
									Descargar PDF (Histórico)
								</Button>
								) : (
									<Typography className="fi-emptyAction">Esta factura aun no puede certificarse.</Typography>
								)}
							</section>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={closeDetailModal}>Cerrar</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={felOpen} onClose={closeFelModal} maxWidth="md" fullWidth>
				<DialogTitle>Certificacion FEL</DialogTitle>
				<DialogContent>
					{selectedFactura && (
						<div className="fi-modalContent">
							<section>
								<Typography variant="subtitle1">Vista previa factura</Typography>
								<p>Factura: {selectedFactura.id}</p>
								<p>Cliente: {selectedFactura.cliente}</p>
								<p>NIT: {selectedFactura.nit}</p>
							</section>
							<section>
								<Typography variant="subtitle1">Confirmacion de datos</Typography>
								<p>Fecha emision: {selectedFactura.fechaEmision}</p>
								<p>Estado actual: {selectedFactura.estado}</p>
								<p>Total calculado: {formatMoney(calculateTotals(selectedFactura).total)}</p>
							</section>
						</div>
					)}

					{certResult && (
						<Alert severity={certResult.status === 'ok' ? 'success' : 'error'} sx={{ mt: 2 }}>
							{certResult.status === 'ok' ? '✔ ' : '❌ '}
							{certResult.message}
						</Alert>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={closeFelModal} disabled={certifying}>
						Cerrar
					</Button>
					<Button
						onClick={certifyFactura}
						disabled={certifying || !selectedFactura || selectedFactura.estado !== 'Borrador'}
					>
						{certifying ? 'Enviando...' : 'Confirmar y enviar'}
					</Button>
				</DialogActions>
			</Dialog>
		</motion.section>
	)
}
