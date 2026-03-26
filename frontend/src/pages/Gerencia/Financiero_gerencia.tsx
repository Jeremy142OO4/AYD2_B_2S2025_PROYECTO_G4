import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Box,
  LinearProgress,
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
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

type FinancieroGerenciaPageProps = {
	activeSection?: string
}

type ClienteRentabilidad = {
	cliente: string
	ingresos: number
	costos: number
	margin: number
}

type KpiCardProps = {
	icon: typeof AccountBalanceWalletOutlinedIcon
	label: string
	value: number
	duration: number
}

type AgingRowProps = {
	label: string
	value: number
	color: string
	duration: number
}

const kpis = [
	{
		icon: AccountBalanceWalletOutlinedIcon,
		label: 'Total facturado',
	},
	{
		icon: ReceiptLongOutlinedIcon,
		label: 'Total cobrado',
	},
	{
		icon: PendingActionsOutlinedIcon,
		label: 'Total pendiente',
	},
	{
		icon: WarningAmberOutlinedIcon,
		label: 'Total vencido',
	},
] as const

const clientes: ClienteRentabilidad[] = [
	{ cliente: 'Comercial Alfa', ingresos: 1250000, costos: 880000, margin: 370000 },
	{ cliente: 'Logistica Regional', ingresos: 980000, costos: 710000, margin: 270000 },
	{ cliente: 'Agro Export SA', ingresos: 760000, costos: 505000, margin: 255000 },
	{ cliente: 'Industria Nova', ingresos: 680000, costos: 500000, margin: 180000 },
]

const agingRows = [
	{ label: '0-30 dias', value: 220000, color: '#1b3c53' },
	{ label: '31-60 dias', value: 130000, color: '#456882' },
	{ label: '61+ dias', value: 70000, color: '#6f8da1' },
]

const containerAnim = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.04,
		},
	},
}

const cardAnim = {
	hidden: { opacity: 0, y: 16 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.38, ease: 'easeOut' as const },
	},
}

function formatCurrency(value: number): string {
	return `Q ${value.toLocaleString('es-GT')}`
}

function useAnimatedNumber(target: number, duration = 900): number {
	const [value, setValue] = useState(0)

	useEffect(() => {
		let animationFrame = 0
		const start = performance.now()

		const animate = (now: number) => {
			const progress = Math.min((now - start) / duration, 1)
			const eased = 1 - Math.pow(1 - progress, 4)
			setValue(Math.round(target * eased))

			if (progress < 1) {
				animationFrame = requestAnimationFrame(animate)
			}
		}

		animationFrame = requestAnimationFrame(animate)

		return () => {
			cancelAnimationFrame(animationFrame)
		}
	}, [target, duration])

	return value
}

function KpiCard({ icon: Icon, label, value, duration }: KpiCardProps) {
	const animatedValue = useAnimatedNumber(value, duration)

	return (
		<Paper className="fg-kpiCard" elevation={0}>
			<Icon className="fg-kpiIcon" />
			<Typography className="fg-kpiLabel">{label}</Typography>
			<Typography className="fg-kpiValue">{formatCurrency(animatedValue)}</Typography>
		</Paper>
	)
}

function AgingRow({ label, value, color, duration }: AgingRowProps) {
	const animatedValue = useAnimatedNumber(value, duration)
	const progressValue = (animatedValue / 220000) * 100

	return (
		<Box className="fg-agingRow">
			<Typography className="fg-agingLabel">{label}</Typography>
			<LinearProgress
				variant="determinate"
				value={progressValue}
				className="fg-agingProgress"
				sx={{
					backgroundColor: 'rgba(27, 60, 83, 0.12)',
					'& .MuiLinearProgress-bar': {
						backgroundColor: color,
					},
				}}
			/>
			<Typography className="fg-agingValue">{animatedValue.toLocaleString('es-GT')}</Typography>
		</Box>
	)
}

export default function FinancieroGerenciaPage({ activeSection = 'financiero' }: FinancieroGerenciaPageProps) {
	const totalFacturado = 4580000
	const totalCobrado = 3960000
	const totalPendiente = 430000
	const totalVencido = 190000

	return (
		<motion.section className="fg-dashboard" variants={containerAnim} initial="hidden" animate="show">
			<motion.div className="fg-heading" variants={cardAnim}>
				<Typography variant="h4" component="h1" className="fg-title">
					Análisis Financiero
				</Typography>
				<Typography className="fg-subtitle">
					{activeSection === 'financiero'
						? 'Vista ejecutiva para controlar facturacion, recaudo y riesgo de cartera.'
						: 'Resumen financiero consolidado del negocio.'}
				</Typography>
			</motion.div>

			<motion.div className="fg-kpiGrid" variants={cardAnim}>
				<KpiCard icon={kpis[0].icon} label={kpis[0].label} value={totalFacturado} duration={840} />
				<KpiCard icon={kpis[1].icon} label={kpis[1].label} value={totalCobrado} duration={780} />
				<KpiCard icon={kpis[2].icon} label={kpis[2].label} value={totalPendiente} duration={720} />
				<KpiCard icon={kpis[3].icon} label={kpis[3].label} value={totalVencido} duration={760} />
			</motion.div>

			<motion.div variants={cardAnim}>
				<Paper className="fg-panel" elevation={0}>
					<Typography variant="h6" className="fg-panelTitle">
						Rentabilidad por cliente
					</Typography>

					<Box className="fg-tableWrap">
						<Table className="fg-table">
							<TableHead>
								<TableRow>
									<TableCell>Cliente</TableCell>
									<TableCell>Ingresos</TableCell>
									<TableCell>Costos estimados</TableCell>
									<TableCell>Margen</TableCell>
									<TableCell>Acción</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{clientes.map((cliente) => (
									<TableRow key={cliente.cliente}>
										<TableCell>{cliente.cliente}</TableCell>
										<TableCell>{formatCurrency(cliente.ingresos)}</TableCell>
										<TableCell>{formatCurrency(cliente.costos)}</TableCell>
										<TableCell>
											<span className="fg-marginValue">{formatCurrency(cliente.margin)}</span>
										</TableCell>
										<TableCell>
											<button type="button" className="fg-actionButton">
												Ver detalle cliente
											</button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
				</Paper>
			</motion.div>

			<motion.div variants={cardAnim}>
				<Paper className="fg-panel" elevation={0}>
					<Typography variant="h6" className="fg-panelTitle">
						Cuentas por cobrar por antigüedad
					</Typography>

					<Stack spacing={1.4} sx={{ mt: 1.2 }}>
						{agingRows.map((row, index) => (
							<AgingRow
								key={row.label}
								label={row.label}
								value={row.value}
								color={row.color}
								duration={760 + index * 120}
							/>
						))}
					</Stack>
				</Paper>
			</motion.div>
		</motion.section>
	)
}
