import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
	Box,
	Card,
	CardContent,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material'

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

function formatMoney(value: number): string {
	return `Q ${value.toLocaleString('es-GT', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`
}

const datosReportes = {
	pagos: {
		totalCobrado: 15250,
		numeroPagos: 8,
		metodos: {
			transferencia: 5,
			cheque: 2,
			efectivo: 1,
			tarjeta: 0,
		},
	},
	facturacion: {
		totalFacturas: 18,
		pagadas: 8,
		pendientes: 7,
		vencidas: 3,
	},
	clientesDeuda: [
		{ empresa: 'Logisur', nit: '9988775-9', saldoPendiente: 3550 },
		{ empresa: 'Rutas del Norte', nit: '5512441-0', saldoPendiente: 2600 },
		{ empresa: 'NeoFleet', nit: '8899123-4', saldoPendiente: 1200 },
	],
	ingresosPorFecha: [
		{ fecha: '2026-03-01', monto: 1200, cantidad: 2 },
		{ fecha: '2026-03-05', monto: 2400, cantidad: 3 },
		{ fecha: '2026-03-10', monto: 3100, cantidad: 2 },
		{ fecha: '2026-03-15', monto: 4550, cantidad: 5 },
		{ fecha: '2026-03-20', monto: 4000, cantidad: 4 },
	],
}

export default function ReportesFinancieroPage() {
	const totalDeuda = useMemo(
		() => datosReportes.clientesDeuda.reduce((sum, cliente) => sum + cliente.saldoPendiente, 0),
		[],
	)

	const ingresoTotal = useMemo(
		() => datosReportes.ingresosPorFecha.reduce((sum, fecha) => sum + fecha.monto, 0),
		[],
	)

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Reportes Financieros
				</Typography>
			</div>

			{/* SECCIÓN 1: RESUMEN GENERAL */}
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', mb: 3 }}>
				<Card elevation={0} sx={{ background: 'linear-gradient(135deg, #1b3c53 0%, #456882 100%)', color: '#f9f3ef', borderRadius: '12px' }}>
					<CardContent>
						<Typography sx={{ fontSize: 14, opacity: 0.9, mb: 1 }}>Total Cobrado</Typography>
						<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{formatMoney(datosReportes.pagos.totalCobrado)}</Typography>
						<Typography variant="caption" sx={{ opacity: 0.8 }}>Período actual</Typography>
					</CardContent>
				</Card>

				<Card elevation={0} sx={{ background: 'linear-gradient(135deg, #2d5f40 0%, #4c8c64 100%)', color: '#f9f3ef', borderRadius: '12px' }}>
					<CardContent>
						<Typography sx={{ fontSize: 14, opacity: 0.9, mb: 1 }}>Pagos Realizados</Typography>
						<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{datosReportes.pagos.numeroPagos}</Typography>
						<Typography variant="caption" sx={{ opacity: 0.8 }}>transacciones registradas</Typography>
					</CardContent>
				</Card>

				<Card elevation={0} sx={{ background: 'linear-gradient(135deg, #c2512d 0%, #d87a54 100%)', color: '#f9f3ef', borderRadius: '12px' }}>
					<CardContent>
						<Typography sx={{ fontSize: 14, opacity: 0.9, mb: 1 }}>Deuda Total</Typography>
						<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{formatMoney(totalDeuda)}</Typography>
						<Typography variant="caption" sx={{ opacity: 0.8 }}>por cobrar</Typography>
					</CardContent>
				</Card>

				<Card elevation={0} sx={{ background: 'linear-gradient(135deg, #d2c1b6 0%, #ddd0c5 100%)', color: '#1b3c53', borderRadius: '12px' }}>
					<CardContent>
						<Typography sx={{ fontSize: 14, opacity: 0.8, mb: 1 }}>Ingresos (Período)</Typography>
						<Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{formatMoney(ingresoTotal)}</Typography>
						<Typography variant="caption" sx={{ opacity: 0.7 }}>últimos 20 días</Typography>
					</CardContent>
				</Card>
			</Box>

			{/* SECCIÓN 2: REPORTES */}
			<Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: '12px', backgroundColor: '#fafafa' }}>
				<Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1b3c53' }}>Reportes</Typography>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 600 }}>Métrica</TableCell>
								<TableCell align="right" sx={{ fontWeight: 600 }}>Valor</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							<TableRow>
								<TableCell>Total Cobrado</TableCell>
								<TableCell align="right">{formatMoney(datosReportes.pagos.totalCobrado)}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Número de Pagos</TableCell>
								<TableCell align="right">{datosReportes.pagos.numeroPagos}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Deuda Total</TableCell>
								<TableCell align="right">{formatMoney(totalDeuda)}</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</motion.section>
	)
}
