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
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'

type OperativoGerenciaPageProps = {
	activeSection?: string
}

type PilotRow = {
	nombre: string
	entregas: number
	incidentes: number
	puntualidad: number
}

type RouteRow = {
	ruta: string
	percent: number
}

type KpiCardProps = {
	icon: typeof TaskAltOutlinedIcon
	label: string
	value: number
	suffix?: string
	duration: number
}

const kpis = [
	{ icon: TaskAltOutlinedIcon, label: 'Puntualidad', value: 93, suffix: '%' },
	{ icon: ReportProblemOutlinedIcon, label: 'Incidentes por mes', value: 27 },
	{ icon: AccessTimeOutlinedIcon, label: 'Tiempo promedio entrega', value: 18.4, suffix: ' h' },
	{ icon: LocalShippingOutlinedIcon, label: 'Órdenes activas', value: 412 },
] as const

const pilots: PilotRow[] = [
	{ nombre: 'Juan Pérez', entregas: 98, incidentes: 2, puntualidad: 96 },
	{ nombre: 'Ana López', entregas: 87, incidentes: 1, puntualidad: 97 },
	{ nombre: 'Luis García', entregas: 91, incidentes: 4, puntualidad: 90 },
	{ nombre: 'María Solís', entregas: 84, incidentes: 2, puntualidad: 94 },
]

const routes: RouteRow[] = [
	{ ruta: 'Guatemala-México', percent: 92 },
	{ ruta: 'Guatemala-El Salvador', percent: 78 },
	{ ruta: 'Guatemala-Honduras', percent: 71 },
	{ ruta: 'Guatemala-Costa Rica', percent: 49 },
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

function useAnimatedNumber(target: number, duration = 900): number {
	const [value, setValue] = useState(0)

	useEffect(() => {
		let animationFrame = 0
		const start = performance.now()

		const animate = (now: number) => {
			const progress = Math.min((now - start) / duration, 1)
			const eased = 1 - Math.pow(1 - progress, 4)
			setValue(Math.round(target * eased * 10) / 10)

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

function KpiCard({ icon: Icon, label, value, suffix, duration }: KpiCardProps) {
	const animatedValue = useAnimatedNumber(Number(value), duration)
	const displayValue = typeof value === 'number' && Number.isInteger(value)
		? Math.round(animatedValue).toLocaleString('es-GT')
		: animatedValue.toFixed(1).replace('.0', '')

	return (
		<Paper className="og-kpiCard" elevation={0}>
			<Icon className="og-kpiIcon" />
			<Typography className="og-kpiLabel">{label}</Typography>
			<Typography className="og-kpiValue">
				{displayValue}
				{suffix ?? ''}
			</Typography>
		</Paper>
	)
}

function RouteBar({ ruta, percent, delay = 0 }: RouteRow & { delay?: number }) {
	const animatedPercent = useAnimatedNumber(percent, 850 + delay)

	return (
		<Box className="og-routeRow">
			<Typography className="og-routeLabel">{ruta}</Typography>
			<LinearProgress
				variant="determinate"
				value={animatedPercent}
				className="og-routeProgress"
			/>
			<Typography className="og-routeValue">{Math.round(animatedPercent)}%</Typography>
		</Box>
	)
}

export default function OperativoGerenciaPage({ activeSection = 'operativo' }: OperativoGerenciaPageProps) {
	return (
		<motion.section className="og-dashboard" variants={containerAnim} initial="hidden" animate="show">
			<motion.div className="og-heading" variants={cardAnim}>
				<Typography variant="h4" component="h1" className="og-title">
					Análisis Operativo
				</Typography>
				<Typography className="og-subtitle">
					{activeSection === 'operativo'
						? 'Vista ejecutiva para supervisar puntualidad, incidentes y rendimiento de rutas.'
						: 'Resumen operativo consolidado del negocio.'}
				</Typography>
			</motion.div>

			<motion.div className="og-kpiGrid" variants={cardAnim}>
				<KpiCard {...kpis[0]} duration={760} />
				<KpiCard {...kpis[1]} duration={690} />
				<KpiCard {...kpis[2]} duration={810} />
				<KpiCard {...kpis[3]} duration={720} />
			</motion.div>

			<motion.div variants={cardAnim}>
				<Paper className="og-panel" elevation={0}>
					<Typography variant="h6" className="og-panelTitle">
						Desempeño de pilotos
					</Typography>

					<Box className="og-tableWrap">
						<Table className="og-table">
							<TableHead>
								<TableRow>
									<TableCell>Piloto</TableCell>
									<TableCell>Entregas</TableCell>
									<TableCell>Incidentes</TableCell>
									<TableCell>Puntualidad</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{pilots.map((pilot) => (
									<TableRow key={pilot.nombre}>
										<TableCell>{pilot.nombre}</TableCell>
										<TableCell>{pilot.entregas}</TableCell>
										<TableCell>{pilot.incidentes}</TableCell>
										<TableCell>{pilot.puntualidad}%</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
				</Paper>
			</motion.div>

			<motion.div variants={cardAnim}>
				<Paper className="og-panel" elevation={0}>
					<Typography variant="h6" className="og-panelTitle">
						Rutas más utilizadas
					</Typography>

					<Stack spacing={1.4} sx={{ mt: 1.2 }}>
						{routes.map((route, index) => (
							<RouteBar key={route.ruta} {...route} delay={index * 120} />
						))}
					</Stack>
				</Paper>
			</motion.div>
		</motion.section>
	)
}
