import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
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
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined'
import { getCurrentUser } from '../../util/auth'

type PendingInvoice = {
	facturaId: number
	id: string
	fecha: string
	monto: number
}

type PaymentHistory = {
	pagoId: number
	id: string
	facturaId: number
	fecha: string
	monto: number
	metodo: string
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

type BackendPendingInvoice = {
	factura_id?: number
	numero?: string
	fecha?: string
	monto?: number
}

type BackendPaymentHistoryItem = {
	pago_id?: number
	factura_id?: number
	fecha?: string
	monto?: number
	metodo?: string
	referencia?: string
}

type BackendClientPaymentsResponse = {
	facturas_pendientes?: BackendPendingInvoice[]
	pagos_historial?: BackendPaymentHistoryItem[]
	total_pendiente?: number
	error?: string
}

type BackendBasicResponse = {
	ok?: boolean
	message?: string
	error?: string
}

function money(value: number): string {
	return `Q ${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PagosClientePage() {
	const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([])
	const [history, setHistory] = useState<PaymentHistory[]>([])
	const [selected, setSelected] = useState<PendingInvoice | null>(null)
	const [intentMessage, setIntentMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [isSubmittingIntent, setIsSubmittingIntent] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')

	const currentUser = getCurrentUser()

	const loadPayments = async () => {
		const referenceID = currentUser?.userId ?? currentUser?.clienteId
		if (!referenceID) {
			setErrorMessage('No se encontro userId en la sesion. Inicia sesion nuevamente.')
			setPendingInvoices([])
			setHistory([])
			return
		}

		setIsLoading(true)
		setErrorMessage('')

		try {
			const response = await fetch(`${API_BASE_URL}/api/clientes/me/pagos?user_id=${referenceID}`)
			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as BackendClientPaymentsResponse
				throw new Error(payload.error ?? 'No se pudo cargar la informacion de pagos.')
			}

			const payload = (await response.json()) as BackendClientPaymentsResponse

			setPendingInvoices(
				(payload.facturas_pendientes ?? []).map((invoice) => ({
					facturaId: invoice.factura_id ?? 0,
					id: invoice.numero ?? `FEL-${invoice.factura_id ?? 0}`,
					fecha: invoice.fecha ?? '-',
					monto: invoice.monto ?? 0,
				})),
			)

			setHistory(
				(payload.pagos_historial ?? []).map((payment) => ({
					pagoId: payment.pago_id ?? 0,
					id: `P-${payment.pago_id ?? 0}`,
					facturaId: payment.factura_id ?? 0,
					fecha: payment.fecha ?? '-',
					monto: payment.monto ?? 0,
					metodo: payment.metodo ?? 'No definido',
				})),
			)
		} catch (error) {
			setPendingInvoices([])
			setHistory([])
			setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al cargar pagos.')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void loadPayments()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const totalPendiente = useMemo(
		() => pendingInvoices.reduce((acc, current) => acc + current.monto, 0),
		[],
	)

	const registerIntent = (invoice: PendingInvoice) => {
		const referenceID = currentUser?.userId ?? currentUser?.clienteId
		if (!referenceID) {
			setErrorMessage('No se encontro userId en la sesion. Inicia sesion nuevamente.')
			return
		}

		void (async () => {
			try {
				setIsSubmittingIntent(true)
				setErrorMessage('')

				const response = await fetch(`${API_BASE_URL}/api/clientes/me/pagos/intencion?user_id=${referenceID}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ factura_id: invoice.facturaId }),
				})

				const payload = (await response.json().catch(() => ({}))) as BackendBasicResponse
				if (!response.ok) {
					throw new Error(payload.error ?? 'No se pudo registrar la intencion de pago.')
				}

				setIntentMessage(payload.message ?? `Intencion de pago registrada para ${invoice.id}.`)
				setSelected(null)
				await loadPayments()
			} catch (error) {
				setErrorMessage(error instanceof Error ? error.message : 'Error inesperado al registrar la intencion.')
			} finally {
				setIsSubmittingIntent(false)
			}
		})()
	}

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Pagos
				</Typography>
			</div>

			<Alert severity="info" sx={{ mb: 2 }}>
				Este modulo es solo de pagos del cliente. La contabilidad interna se procesa en el area financiera.
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
						<Typography variant="body2">Cargando pagos...</Typography>
					</Stack>
				</Paper>
			) : null}

			<Grid container spacing={1.5}>
				<Grid size={{ xs: 12, md: 7 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Facturas pendientes
						</Typography>
						<Stack direction="row" spacing={1} sx={{ mb: 1.25 }}>
							<Chip icon={<ReceiptLongOutlinedIcon />} label={`Pendientes: ${pendingInvoices.length}`} color="warning" />
							<Chip icon={<AttachMoneyOutlinedIcon />} label={`Total pendiente: ${money(totalPendiente)}`} color="error" />
						</Stack>

						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Factura</TableCell>
									<TableCell>Fecha</TableCell>
									<TableCell>Monto</TableCell>
									<TableCell>Accion</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{pendingInvoices.map((invoice) => (
									<TableRow key={invoice.id}>
										<TableCell>{invoice.id}</TableCell>
										<TableCell>{invoice.fecha}</TableCell>
										<TableCell>{money(invoice.monto)}</TableCell>
										<TableCell>
											<Button size="small" variant="outlined" onClick={() => setSelected(invoice)}>
												Ver detalle
											</Button>
										</TableCell>
									</TableRow>
								))}
								{pendingInvoices.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4}>No hay facturas pendientes.</TableCell>
									</TableRow>
								) : null}
							</TableBody>
						</Table>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 5 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">
							Historial de pagos realizados
						</Typography>
						<Stack spacing={1}>
							{history.map((payment) => (
								<Paper key={payment.id} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
									<Typography sx={{ fontWeight: 800 }}>{payment.id}</Typography>
									<Typography variant="body2">Factura: FEL-{payment.facturaId}</Typography>
									<Typography variant="body2">Fecha: {payment.fecha}</Typography>
									<Typography variant="body2">Metodo: {payment.metodo}</Typography>
									<Typography variant="body2">Monto: {money(payment.monto)}</Typography>
								</Paper>
							))}
							{history.length === 0 ? <Alert severity="info">No hay pagos registrados.</Alert> : null}
						</Stack>
					</Paper>
				</Grid>
			</Grid>

			{intentMessage ? <Alert severity="success" sx={{ mt: 1.5 }}>{intentMessage}</Alert> : null}

			<Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="xs">
				<DialogTitle>Detalle de factura</DialogTitle>
				<DialogContent dividers>
					{selected ? (
						<Stack spacing={1}>
							<Typography>Factura: {selected.id}</Typography>
							<Typography>Fecha: {selected.fecha}</Typography>
							<Typography>Monto: {money(selected.monto)}</Typography>
						</Stack>
					) : null}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setSelected(null)}>Cerrar</Button>
					{selected ? (
						<Button variant="contained" onClick={() => registerIntent(selected)} disabled={isSubmittingIntent}>
							Registrar intencion de pago
						</Button>
					) : null}
				</DialogActions>
			</Dialog>
		</motion.section>
	)
}
