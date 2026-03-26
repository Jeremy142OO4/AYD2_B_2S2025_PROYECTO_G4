import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Chip,
	CircularProgress,
	Grid,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import CreditScoreOutlinedIcon from '@mui/icons-material/CreditScoreOutlined'
import { getCurrentUser } from '../../util/auth'

type InvoiceStatus = 'Pagada' | 'Pendiente' | 'Vencida'

type Invoice = {
	id: string
	fechaEmision: string
	fechaVencimiento: string
	monto: number
	estado: InvoiceStatus
}

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

type BackendFacturaItem = {
	numero?: string
	fechaEmision?: string
	fechaVencimiento?: string
	monto?: number
	estado?: string
}

type BackendPagoItem = {
	factura_id?: number
	fecha?: string
	monto?: number
}

type BackendEstadoCuentaResponse = {
	limiteCredito?: number
	facturas?: BackendFacturaItem[]
	pagos_realizados?: BackendPagoItem[]
	total_facturado?: number
	total_pagado?: number
	saldo_pendiente?: number
	error?: string
}

function money(value: number): string {
	return `Q ${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function normalizeInvoiceStatus(status?: string): InvoiceStatus {
	const normalized = (status ?? '').trim().toLowerCase()
	if (normalized === 'pagada') {
		return 'Pagada'
	}
	if (normalized === 'vencida') {
		return 'Vencida'
	}
	return 'Pendiente'
}

export default function EstadoCuentaClientePage() {
	const [invoices, setInvoices] = useState<Invoice[]>([])
	const [financialHistory, setFinancialHistory] = useState<string[]>([])
	const [limiteCredito, setLimiteCredito] = useState(0)
	const [saldoPendiente, setSaldoPendiente] = useState(0)
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const currentUser = getCurrentUser()
	const referenceID = currentUser?.userId ?? currentUser?.clienteId

	useEffect(() => {
		const loadEstadoCuenta = async () => {
			if (!referenceID) {
				setErrorMessage('No se encontro userId en la sesion. Inicia sesion nuevamente.')
				setInvoices([])
				setFinancialHistory([])
				return
			}

			setIsLoading(true)
			setErrorMessage('')

			try {
				const response = await fetch(`${API_BASE_URL}/api/clientes/me/estado-cuenta?user_id=${referenceID}`)
				if (!response.ok) {
					const payload = (await response.json().catch(() => ({}))) as BackendEstadoCuentaResponse
					throw new Error(payload.error ?? 'No se pudo cargar el estado de cuenta.')
				}

				const payload = (await response.json()) as BackendEstadoCuentaResponse
				const mappedInvoices = (payload.facturas ?? []).map((invoice) => ({
					id: invoice.numero ?? '-',
					fechaEmision: invoice.fechaEmision ?? '-',
					fechaVencimiento: invoice.fechaVencimiento ?? '-',
					monto: invoice.monto ?? 0,
					estado: normalizeInvoiceStatus(invoice.estado),
				}))

				setInvoices(mappedInvoices)
				setLimiteCredito(payload.limiteCredito ?? 0)
				setSaldoPendiente(payload.saldo_pendiente ?? 0)
				setFinancialHistory(
					(payload.pagos_realizados ?? []).map((payment) =>
						`${payment.fecha ?? '-'}: Pago aplicado a factura ${payment.factura_id ?? '-'} por ${money(payment.monto ?? 0)}`,
					),
				)
			} catch (error) {
				setInvoices([])
				setFinancialHistory([])
				setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al cargar el estado de cuenta.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadEstadoCuenta()
	}, [referenceID])

	const facturasPagadas = useMemo(
		() => invoices.filter((invoice) => invoice.estado === 'Pagada'),
		[invoices],
	)

	const facturasPendientes = useMemo(
		() => invoices.filter((invoice) => invoice.estado === 'Pendiente' || invoice.estado === 'Vencida'),
		[invoices],
	)

	const creditoDisponible = Math.max(limiteCredito - saldoPendiente, 0)

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Estado de Cuenta
				</Typography>
			</div>

			<Alert severity="info" sx={{ mb: 2 }}>
				Vista financiera completa del cliente: facturas, deuda, credito y trazabilidad historica.
			</Alert>

			{errorMessage ? (
				<Alert severity="warning" sx={{ mb: 2 }}>
					{errorMessage}
				</Alert>
			) : null}

			{isLoading ? (
				<Paper className="op-panel" elevation={0} sx={{ p: 2, mb: 1.5 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<CircularProgress size={20} />
						<Typography variant="body2">Cargando estado de cuenta...</Typography>
					</Stack>
				</Paper>
			) : null}

			<Grid container spacing={1.5} sx={{ mb: 0.5 }}>
				<Grid size={{ xs: 12, md: 3 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Stack direction="row" spacing={1} alignItems="center">
							<AccountBalanceWalletOutlinedIcon color="primary" />
							<div>
								<Typography variant="caption" color="text.secondary">Deuda total</Typography>
								<Typography variant="h6" sx={{ fontWeight: 800 }}>{money(saldoPendiente)}</Typography>
							</div>
						</Stack>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Stack direction="row" spacing={1} alignItems="center">
							<CreditScoreOutlinedIcon color="primary" />
							<div>
								<Typography variant="caption" color="text.secondary">Limite de credito</Typography>
								<Typography variant="h6" sx={{ fontWeight: 800 }}>{money(limiteCredito)}</Typography>
							</div>
						</Stack>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Stack direction="row" spacing={1} alignItems="center">
							<CreditScoreOutlinedIcon color="primary" />
							<div>
								<Typography variant="caption" color="text.secondary">Credito disponible</Typography>
								<Typography variant="h6" sx={{ fontWeight: 800 }}>{money(creditoDisponible)}</Typography>
							</div>
						</Stack>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
							<Chip label={`Emitidas: ${invoices.length}`} color="primary" />
							<Chip label={`Pagadas: ${facturasPagadas.length}`} color="success" />
							<Chip label={`Pendientes/Vencidas: ${facturasPendientes.length}`} color="warning" />
						</Stack>
					</Paper>
				</Grid>
			</Grid>

			<Paper className="op-panel" elevation={0} sx={{ p: 2, mb: 1.5 }}>
				<Typography variant="h6" className="op-title">
					Facturas emitidas
				</Typography>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Factura</TableCell>
							<TableCell>Emision</TableCell>
							<TableCell>Vencimiento</TableCell>
							<TableCell>Monto</TableCell>
							<TableCell>Estado</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{invoices.map((invoice) => (
							<TableRow key={invoice.id}>
								<TableCell>{invoice.id}</TableCell>
								<TableCell>{invoice.fechaEmision}</TableCell>
								<TableCell>{invoice.fechaVencimiento}</TableCell>
								<TableCell>{money(invoice.monto)}</TableCell>
								<TableCell>
									<Chip
										size="small"
										label={invoice.estado}
										color={invoice.estado === 'Pagada' ? 'success' : invoice.estado === 'Vencida' ? 'error' : 'warning'}
									/>
								</TableCell>
							</TableRow>
						))}
						{invoices.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5}>No hay facturas disponibles.</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</Paper>

			<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
				<Typography variant="h6" className="op-title">
					Historial financiero
				</Typography>
				<Stack spacing={0.9}>
					{financialHistory.map((line) => (
						<Typography key={line} variant="body2">• {line}</Typography>
					))}
					{financialHistory.length === 0 ? (
						<Typography variant="body2">Sin pagos aplicados por ahora.</Typography>
					) : null}
				</Stack>
			</Paper>
		</motion.section>
	)
}
