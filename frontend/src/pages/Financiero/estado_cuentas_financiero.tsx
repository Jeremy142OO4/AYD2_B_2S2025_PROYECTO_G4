import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
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

type EstadoFactura = 'Pendiente' | 'Pagada' | 'Parcial'

type ItemFactura = {
	descripcion: string
	cantidad: number
	precio: number
}

type Factura = {
	id: string
	cliente: string
	nit: string
	fechaEmision: string
	estado: EstadoFactura
	items: ItemFactura[]
	saldoPendiente: number
}

type Pago = {
	id: string
	facturaId: string
	monto: number
	metodoPago: string
	fechaPago: string
	referencia: string
}

type CuentaCliente = {
	cliente: string
	nit: string
	totalFacturas: number
	totalPagos: number
	saldoPendiente: number
	facturasPendientes: number
	ultimoPago?: string
	limiteCredito?: number
	diasCredito?: number
}

const ivaRate = 0.12

const facturasData: Factura[] = [
	{
		id: 'FAC-2026-0001',
		cliente: 'AYD',
		nit: '326251-K',
		fechaEmision: '2026-03-17',
		estado: 'Pendiente',
		items: [
			{ descripcion: 'Servicio de transporte terrestre', cantidad: 1, precio: 3800 },
			{ descripcion: 'Maniobra de carga', cantidad: 2, precio: 475 },
		],
		saldoPendiente: 5070,
	},
	{
		id: 'FAC-2026-0002',
		cliente: 'TransCargo GT',
		nit: '7412568-2',
		fechaEmision: '2026-03-10',
		estado: 'Pagada',
		items: [{ descripcion: 'Flete refrigerado', cantidad: 1, precio: 5200 }],
		saldoPendiente: 0,
	},
	{
		id: 'FAC-2026-0003',
		cliente: 'Logisur',
		nit: '9988775-9',
		fechaEmision: '2026-03-05',
		estado: 'Pendiente',
		items: [
			{ descripcion: 'Transporte consolidado', cantidad: 1, precio: 3000 },
			{ descripcion: 'Seguro de carga', cantidad: 1, precio: 550 },
		],
		saldoPendiente: 3990,
	},
	{
		id: 'FAC-2026-0004',
		cliente: 'NeoFleet',
		nit: '8899123-4',
		fechaEmision: '2026-02-28',
		estado: 'Pagada',
		items: [{ descripcion: 'Servicio express', cantidad: 1, precio: 4100 }],
		saldoPendiente: 0,
	},
	{
		id: 'FAC-2026-0005',
		cliente: 'Rutas del Norte',
		nit: '5512441-0',
		fechaEmision: '2026-02-15',
		estado: 'Parcial',
		items: [{ descripcion: 'Traslado de contenedores', cantidad: 2, precio: 2600 }],
		saldoPendiente: 1460,
	},
]

const pagosData: Pago[] = [
	{
		id: 'PAG-FAC-2026-0002-001',
		facturaId: 'FAC-2026-0002',
		monto: 5824,
		metodoPago: 'Transferencia',
		fechaPago: '2026-03-15',
		referencia: '123456789',
	},
	{
		id: 'PAG-FAC-2026-0004-001',
		facturaId: 'FAC-2026-0004',
		monto: 4592,
		metodoPago: 'Cheque',
		fechaPago: '2026-03-08',
		referencia: 'CHQ-987654',
	},
	{
		id: 'PAG-FAC-2026-0005-001',
		facturaId: 'FAC-2026-0005',
		monto: 2924,
		metodoPago: 'Transferencia',
		fechaPago: '2026-03-01',
		referencia: '555666777',
	},
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

function buildClientAccounts(facturas: Factura[], pagos: Pago[]): CuentaCliente[] {
	const accountsMap = new Map<string, CuentaCliente>()

	// Procesar facturas
	facturas.forEach((factura) => {
		if (!accountsMap.has(factura.cliente)) {
			accountsMap.set(factura.cliente, {
				cliente: factura.cliente,
				nit: factura.nit,
				totalFacturas: 0,
				totalPagos: 0,
				saldoPendiente: 0,
				facturasPendientes: 0,
			})
		}

		const cuenta = accountsMap.get(factura.cliente)!
		const total = calculateTotals(factura.items).total
		cuenta.totalFacturas += total

		if (factura.estado === 'Pendiente' || factura.estado === 'Parcial') {
			cuenta.facturasPendientes += 1
			cuenta.saldoPendiente += factura.saldoPendiente
		}
	})

	// Procesar pagos
	pagos.forEach((pago) => {
		const factura = facturas.find((f) => f.id === pago.facturaId)
		if (factura && accountsMap.has(factura.cliente)) {
			const cuenta = accountsMap.get(factura.cliente)!
			cuenta.totalPagos += pago.monto
			cuenta.ultimoPago = pago.fechaPago
		}
	})

	return Array.from(accountsMap.values()).sort(
		(a, b) => b.saldoPendiente - a.saldoPendiente,
	)
}

export default function EstadoCuentasFinancieroPage() {
	const [cuentas, setCuentas] = useState<CuentaCliente[]>([])
	const [searchNIT, setSearchNIT] = useState('')
	const [selectedClienteNit, setSelectedClienteNit] = useState<string | null>(null)
	const [detailOpen, setDetailOpen] = useState(false)
	const [selectedCuentaDetail, setSelectedCuentaDetail] = useState<any>(null)
	const [loading, setLoading] = useState(true)

	// Cargar estado de cuenta por NIT
	useEffect(() => {
		if (!selectedClienteNit) return

		const cargarDetalle = async () => {
			try {
				const response = await fetch(`http://localhost:4000/estado-cuenta/nit/${selectedClienteNit}`)
				if (!response.ok) throw new Error('Error al cargar estado de cuenta')
				const data = await response.json()
				setSelectedCuentaDetail(data)
			} catch (error) {
				console.error('Error:', error)
			}
		}

		cargarDetalle()
	}, [selectedClienteNit])

	// Cargar todas las cuentas (clientes con información de crédito)
	useEffect(() => {
		const cargarCuentas = async () => {
			try {
				setLoading(true)
				const response = await fetch('http://localhost:4000/clientes/creditos')
				if (!response.ok) throw new Error('Error al cargar clientes')
				const data = await response.json()
				
				// Mapear respuesta del backend a formato local
				const cuentasFormateadas: CuentaCliente[] = data.map((cliente: any) => ({
					cliente: cliente.nombre || 'Sin nombre',
					nit: cliente.nit,
					totalFacturas: cliente.total_facturado || 0,
					totalPagos: cliente.total_pagado || 0,
					saldoPendiente: cliente.saldo_pendiente || 0,
					facturasPendientes: cliente.saldo_pendiente > 0 ? 1 : 0,
					ultimoPago: null,
					limiteCredito: cliente.limite_credito || 0,
					diasCredito: cliente.dias_credito || 0,
				}))
				
				setCuentas(cuentasFormateadas)
			} catch (error) {
				console.error('Error:', error)
				// Fallback a datos iniciales
				const cuentasCalculadas = buildClientAccounts(facturasData, pagosData)
				setCuentas(cuentasCalculadas)
			} finally {
				setLoading(false)
			}
		}

		cargarCuentas()
	}, [])

	const filteredCuentas = useMemo(() => {
		return cuentas.filter((cuenta) => {
			const byNIT = cuenta.nit
				.toLowerCase()
				.includes(searchNIT.trim().toLowerCase())
			return byNIT
		})
	}, [cuentas, searchNIT])

	const selectedCuenta = useMemo(
		() => cuentas.find((cuenta) => cuenta.nit === selectedClienteNit) ?? null,
		[cuentas, selectedClienteNit],
	)

	const facturasPendientes = useMemo(
		() =>
			selectedClienteNit
				? facturasData.filter(
						(f) =>
							f.nit === selectedClienteNit &&
							(f.estado === 'Pendiente' || f.estado === 'Parcial'),
					)
				: [],
		[selectedClienteNit],
	)

	const pagosCliente = useMemo(
		() =>
			selectedClienteNit
				? pagosData.filter((p) => {
						const factura = facturasData.find((f) => f.id === p.facturaId)
						return factura?.nit === selectedClienteNit
					})
				: [],
		[selectedClienteNit],
	)

	const openDetail = (clienteNit: string) => {
		setSelectedClienteNit(clienteNit)
		setDetailOpen(true)
	}

	const closeDetail = () => {
		setDetailOpen(false)
	}

	const totalSaldoPendiente = filteredCuentas.reduce((sum, cuenta) => sum + cuenta.saldoPendiente, 0)

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Estado de Cuentas
				</Typography>
			</div>

			{/* RESUMEN DE SALDOS */}
			<div className="ec-summaryCards">
				<Card
					className="ec-summaryCard"
					elevation={0}
					sx={{
						backgroundColor: '#f9f3ef',
						border: '1px solid rgba(210, 193, 182, 0.5)',
						borderRadius: '8px',
					}}
				>
					<CardContent>
						<Stack spacing={0.5}>
							<Typography color="textSecondary" variant="body2" sx={{ fontWeight: 500 }}>
								Total facturas pendientes
							</Typography>
							<Typography variant="h5" sx={{ color: '#1b3c53', fontWeight: 700 }}>
								{formatMoney(totalSaldoPendiente)}
							</Typography>
							<Typography color="textSecondary" variant="caption">
								De {filteredCuentas.filter((c) => c.saldoPendiente > 0).length} cliente(s)
							</Typography>
						</Stack>
					</CardContent>
				</Card>

				<Card
					className="ec-summaryCard"
					elevation={0}
					sx={{
						backgroundColor: '#f9f3ef',
						border: '1px solid rgba(210, 193, 182, 0.5)',
						borderRadius: '8px',
					}}
				>
					<CardContent>
						<Stack spacing={0.5}>
							<Typography color="textSecondary" variant="body2" sx={{ fontWeight: 500 }}>
								Clientes con mora
							</Typography>
							<Typography variant="h5" sx={{ color: '#c44336', fontWeight: 700 }}>
								{filteredCuentas.filter((c) => c.saldoPendiente > 0).length}
							</Typography>
							<Typography color="textSecondary" variant="caption">
								Requieren atención
							</Typography>
						</Stack>
					</CardContent>
				</Card>

				<Card
					className="ec-summaryCard"
					elevation={0}
					sx={{
						backgroundColor: '#f9f3ef',
						border: '1px solid rgba(210, 193, 182, 0.5)',
						borderRadius: '8px',
					}}
				>
					<CardContent>
						<Stack spacing={0.5}>
							<Typography color="textSecondary" variant="body2" sx={{ fontWeight: 500 }}>
								Clientes activos
							</Typography>
							<Typography variant="h5" sx={{ color: '#1b3c53', fontWeight: 700 }}>
								{filteredCuentas.length}
							</Typography>
							<Typography color="textSecondary" variant="caption">
								En el sistema
							</Typography>
						</Stack>
					</CardContent>
				</Card>


			</div>

			{/* TABLA PRINCIPAL */}
			<Paper className="op-panel ec-panel" elevation={0} style={{ marginTop: '2rem' }}>
				<div style={{ padding: '1.5rem' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1rem',
						}}
					>
						<Typography variant="h6" style={{ fontWeight: 600, color: '#1b3c53' }}>
							Resumen de Cuentas
						</Typography>
						<TextField
							label="Buscar por NIT"
							value={searchNIT}
							onChange={(event) => setSearchNIT(event.target.value)}
							size="small"
							sx={{ width: '250px' }}
						/>
					</div>

					<TableContainer className="ec-tableWrap">
						<Table className="op-table" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell>Cliente</TableCell>
									<TableCell>NIT</TableCell>
								<TableCell align="right">Límite crédito</TableCell>
								<TableCell align="right">Usado</TableCell>
								<TableCell align="right">Disponible</TableCell>
								<TableCell align="right">Saldo pendiente</TableCell>
									<TableCell>Acción</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredCuentas.map((cuenta) => {
									const creditoDisponible = (cuenta.limiteCredito || 0) - (cuenta.saldoPendiente || 0)
									return (
										<TableRow key={cuenta.nit}>
											<TableCell sx={{ fontWeight: 500 }}>{cuenta.cliente}</TableCell>
											<TableCell>{cuenta.nit}</TableCell>
											<TableCell align="right" sx={{ color: '#1b3c53', fontWeight: 500 }}>
												{formatMoney(cuenta.limiteCredito || 0)}
											</TableCell>
											<TableCell align="right" sx={{ color: '#1b3c53' }}>
												{formatMoney(cuenta.totalFacturas || 0)}
											</TableCell>
											<TableCell
												align="right"
												sx={{
													color: creditoDisponible > 0 ? '#4c8c64' : '#c44336',
													fontWeight: 600,
												}}
											>
												{formatMoney(Math.max(0, creditoDisponible))}
											</TableCell>
											<TableCell
												align="right"
												sx={{
													color: (cuenta.saldoPendiente || 0) > 0 ? '#c44336' : '#4c8c64',
													fontWeight: 600,
												}}
											>
												{formatMoney(cuenta.saldoPendiente || 0)}
											</TableCell>
											<TableCell>
												<Button
													size="small"
													className="op-action op-action--info"
													onClick={() => openDetail(cuenta.nit)}
												>
													Ver detalle
												</Button>
											</TableCell>
										</TableRow>
									)
								})}
								{filteredCuentas.length === 0 && (
									<TableRow>
										<TableCell colSpan={7}>
											<Typography className="ec-empty">
												No hay cuentas con esos filtros.
											</Typography>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</div>
			</Paper>

			{/* DETAIL DIALOG */}
			<Dialog
				open={detailOpen}
				onClose={closeDetail}
				maxWidth="lg"
				fullWidth
				className="ec-detailDialog"
			>
				<DialogTitle>
					<div className="ec-detailHeader">
						<Typography variant="h6" className="op-title">
							Detalle de Cuenta - {selectedCuenta?.cliente || selectedCuentaDetail?.cliente}
						</Typography>
						<Chip
							label={
								(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente) > 0
									? 'CON DEUDA'
									: 'AL DÍA'
							}
							sx={{
								backgroundColor:
									(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente) > 0
										? 'rgba(196, 67, 54, 0.15)'
										: 'rgba(76, 140, 100, 0.15)',
								color:
									(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente) > 0
										? '#c44336'
										: '#4c8c64',
							}}
						/>
					</div>
				</DialogTitle>
				<DialogContent className="ec-detailContent">
					{(selectedCuenta || selectedCuentaDetail) && (
						<div className="ec-detailGrid">
							{/* RESUMEN DE CUENTA */}
							<section className="ec-detailCard">
								<h3>Resumen de Cuenta</h3>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: '1fr 1fr',
										gap: '1rem',
										marginTop: '1rem',
									}}
								>
									<Box
										sx={{
											padding: '1rem',
											backgroundColor: 'rgba(210, 193, 182, 0.1)',
											borderRadius: '6px',
											borderLeft: '4px solid #1b3c53',
										}}
									>
										<Typography variant="caption" color="textSecondary">
											Cliente
										</Typography>
										<Typography sx={{ fontWeight: 600 }}>
											{selectedCuenta?.cliente || selectedCuentaDetail?.cliente}
										</Typography>
									</Box>
									<Box
										sx={{
											padding: '1rem',
											backgroundColor: 'rgba(210, 193, 182, 0.1)',
											borderRadius: '6px',
											borderLeft: '4px solid #1b3c53',
										}}
									>
										<Typography variant="caption" color="textSecondary">
											NIT
										</Typography>
										<Typography sx={{ fontWeight: 600 }}>
											{selectedClienteNit}
										</Typography>
									</Box>
									<Box
										sx={{
											padding: '1rem',
											backgroundColor: 'rgba(210, 193, 182, 0.1)',
											borderRadius: '6px',
											borderLeft: '4px solid #1b3c53',
										}}
									>
										<Typography variant="caption" color="textSecondary">
											Total facturas
										</Typography>
										<Typography
											sx={{ fontWeight: 600, color: '#1b3c53' }}
										>
											{formatMoney(selectedCuentaDetail?.total_facturado || selectedCuenta?.totalFacturas || 0)}
										</Typography>
									</Box>
									<Box
										sx={{
											padding: '1rem',
											backgroundColor: 'rgba(76, 140, 100, 0.1)',
											borderRadius: '6px',
											borderLeft: '4px solid #4c8c64',
										}}
									>
										<Typography variant="caption" color="textSecondary">
											Pagos realizados
										</Typography>
										<Typography sx={{ fontWeight: 600, color: '#4c8c64' }}>
											{formatMoney(selectedCuentaDetail?.total_pagado || selectedCuenta?.totalPagos || 0)}
										</Typography>
									</Box>
									<Box
										sx={{
											padding: '1rem',
											backgroundColor:
												(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente) > 0
													? 'rgba(196, 67, 54, 0.1)'
													: 'rgba(76, 140, 100, 0.1)',
											borderRadius: '6px',
											borderLeft:
												(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente) > 0
													? '4px solid #c44336'
													: '4px solid #4c8c64',
										}}
									>
										<Typography variant="caption" color="textSecondary">
											Saldo pendiente
										</Typography>
										<Typography
											sx={{
												fontWeight: 600,
												color:
													(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente) > 0
														? '#c44336'
														: '#4c8c64',
											}}
										>
											{formatMoney(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente || 0)}
										</Typography>
									</Box>
									<Box
										sx={{
											padding: '1rem',
											backgroundColor: 'rgba(66, 165, 245, 0.1)',
											borderRadius: '6px',
											borderLeft: '4px solid #42a5f5',
										}}
									>
										<Typography variant="caption" color="textSecondary">
											Límite de crédito
										</Typography>
										<Typography sx={{ fontWeight: 600, color: '#42a5f5' }}>
											{formatMoney(selectedCuentaDetail?.limite_credito || selectedCuenta?.limiteCredito || 0)}
										</Typography>
									</Box>
									<Box
										sx={{
											padding: '1rem',
											backgroundColor: 'rgba(76, 140, 100, 0.1)',
											borderRadius: '6px',
											borderLeft: '4px solid #4c8c64',
										}}
									>
										<Typography variant="caption" color="textSecondary">
											Crédito disponible
										</Typography>
										<Typography sx={{ fontWeight: 600, color: '#4c8c64' }}>
											{formatMoney(
												((selectedCuentaDetail?.limite_credito || selectedCuenta?.limiteCredito || 0) -
													(selectedCuentaDetail?.saldo_pendiente || selectedCuenta?.saldoPendiente || 0))
											)}
										</Typography>
									</Box>
								</Box>
							</section>

							<Divider sx={{ my: 2 }} />

							{/* FACTURAS PENDIENTES */}
							<section className="ec-detailCard">
								<h3>Detalle de Facturas</h3>
								{(selectedCuentaDetail?.facturas?.length || 0) > 0 ? (
									<TableContainer>
										<Table size="small" className="ec-miniTable" sx={{ mt: 1 }}>
											<TableHead>
												<TableRow>
													<TableCell>Factura</TableCell>
													<TableCell>Fecha</TableCell>
													<TableCell align="right">Total</TableCell>
													<TableCell align="right">Total Pagado</TableCell>
													<TableCell>Estado</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{(selectedCuentaDetail?.facturas || []).map((factura: any) => {
													const total = factura.total_factura || (factura.items?.length ? calculateTotals(factura.items).total : 0)
													const saldo = factura.monto || 0
													return (
														<TableRow key={factura.factura_id || factura.id}>
															<TableCell>{factura.numero || factura.factura_id || factura.id}</TableCell>
															<TableCell>{factura.fecha_factura ? factura.fecha_factura.split('T')[0] : factura.fechaEmision}</TableCell>
															<TableCell align="right">
																{formatMoney(total)}
															</TableCell>
															<TableCell
																align="right"
																sx={{
																	color: '#c44336',
																	fontWeight: 500,
																}}
															>
															{formatMoney(saldo)}
															</TableCell>
															<TableCell>
																<Chip
																	label={factura.estado}
																	size="small"
																	sx={{
																		backgroundColor: 'rgba(196, 67, 54, 0.2)',
																		color: '#c44336',
																	}}
																/>
															</TableCell>
														</TableRow>
													)
												})}
											</TableBody>
										</Table>
									</TableContainer>
								) : (
									<Typography sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
										No hay facturas pendientes. ✓
									</Typography>
								)}
							</section>
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={closeDetail}>Cerrar</Button>
				</DialogActions>
			</Dialog>
		</motion.section>
	)
}
