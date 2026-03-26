import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Box,
	LinearProgress,
	Paper,
	Stack,
	Typography,
} from '@mui/material'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined'
import { LineChart } from '@mui/x-charts/LineChart'

type ProyeccionGerenciaPageProps = {
	activeSection?: string
}

type CapacityRow = {
	sede: string
	flota: number
	usoActual: number
	ocupacion: number
	color: string
}

type HighlightCardProps = {
	label: string
	value: string
	detail: string
	icon: typeof TrendingUpOutlinedIcon
}

type CapacityRowProps = CapacityRow & {
	duration: number
}

const monthLabels = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep']
const demandProjection = [820, 900, 980, 1080, 1180, 1310]

const capacityRows: CapacityRow[] = [
	{ sede: 'Norte', flota: 80, usoActual: 72, ocupacion: 90, color: '#1b3c53' },
	{ sede: 'Centro', flota: 95, usoActual: 68, ocupacion: 72, color: '#1b3c53' },
	{ sede: 'Sur', flota: 60, usoActual: 44, ocupacion: 73, color: '#456882' },
	{ sede: 'Occidente', flota: 48, usoActual: 33, ocupacion: 69, color: '#6f8da1' },
]

const highlights = [
	{
		label: 'Sede con mayor crecimiento',
		value: 'Sede Norte',
		detail: '+12% frente al trimestre anterior',
		icon: WarehouseOutlinedIcon,
	},
	{
		label: 'Ruta mas rentable',
		value: 'Guatemala-Mexico',
		detail: 'Mayor ocupacion y frecuencia estable',
		icon: LocalShippingOutlinedIcon,
	},
	{
		label: 'Cliente mas rentable',
		value: 'Comercial Alfa',
		detail: 'Mejor margen por volumen y recurrencia',
		icon: StorefrontOutlinedIcon,
	},
] as const

const containerAnim = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.08,
			delayChildren: 0.05,
		},
	},
}

const cardAnim = {
	hidden: { opacity: 0, y: 16 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.42, ease: 'easeOut' as const },
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

function CapacityRowItem({ sede, flota, usoActual, ocupacion, color, duration }: CapacityRowProps) {
	const animatedOccupancy = useAnimatedNumber(ocupacion, duration)

	return (
		<Box className="pg-capacityRow" role="row">
			<Typography className="pg-capacityCell pg-capacityCell--sede">{sede}</Typography>
			<Typography className="pg-capacityCell">{flota}</Typography>
			<Typography className="pg-capacityCell">{usoActual}</Typography>
			<Box className="pg-capacityOccupancy">
				<LinearProgress
					variant="determinate"
					value={animatedOccupancy}
					className="pg-capacityProgress"
					sx={{
						backgroundColor: 'rgba(27, 60, 83, 0.12)',
						'& .MuiLinearProgress-bar': {
							backgroundColor: color,
						},
					}}
				/>
				<Typography className={`pg-capacityPercent ${ocupacion >= 85 ? 'pg-capacityPercent--alert' : ''}`}>
					{animatedOccupancy}%
				</Typography>
			</Box>
		</Box>
	)
}

function HighlightCard({ label, value, detail, icon: Icon }: HighlightCardProps) {
	return (
		<Paper className="pg-highlightCard" elevation={0}>
			<Box className="pg-highlightTop">
				<Typography className="pg-highlightLabel">{label}</Typography>
				<Icon className="pg-highlightIcon" />
			</Box>
			<Typography className="pg-highlightValue">{value}</Typography>
			<Typography className="pg-highlightDetail">{detail}</Typography>
		</Paper>
	)
}

export default function ProyeccionGerenciaPage({ activeSection = 'proyeccion' }: ProyeccionGerenciaPageProps) {
	const totalFlota = 283
	const ocupacionPromedio = 76
	const demandaProyectada = 1310
	const crecimientoEstimado = 14

	const animatedFlota = useAnimatedNumber(totalFlota, 820)
	const animatedOcupacion = useAnimatedNumber(ocupacionPromedio, 860)
	const animatedDemanda = useAnimatedNumber(demandaProyectada, 920)
	const animatedCrecimiento = useAnimatedNumber(crecimientoEstimado, 940)

	return (
		<motion.section className="pg-dashboard" variants={containerAnim} initial="hidden" animate="show">
			<motion.div className="pg-heading" variants={cardAnim}>
				<Typography variant="h4" component="h1" className="pg-title">
					Proyección y Capacidad
				</Typography>
				<Typography className="pg-subtitle">
					{activeSection === 'proyeccion'
						? 'Planeacion estrategica para anticipar demanda, capacidad y oportunidades de crecimiento.'
						: 'Vista ejecutiva de proyeccion y capacidad.'}
				</Typography>
			</motion.div>

			<motion.div className="pg-kpiGrid" variants={cardAnim}>
				<Paper className="pg-kpiCard" elevation={0}>
					<TrendingUpOutlinedIcon className="pg-kpiIcon" />
					<Typography className="pg-kpiLabel">Flota disponible</Typography>
					<Typography className="pg-kpiValue">{animatedFlota}</Typography>
					<Typography className="pg-kpiNote">Unidades activas para planificacion</Typography>
				</Paper>

				<Paper className="pg-kpiCard" elevation={0}>
					<WarehouseOutlinedIcon className="pg-kpiIcon" />
					<Typography className="pg-kpiLabel">Ocupacion promedio</Typography>
					<Typography className="pg-kpiValue">{animatedOcupacion}%</Typography>
					<Typography className="pg-kpiNote">Capacidad consolidada por sede</Typography>
				</Paper>

				<Paper className="pg-kpiCard" elevation={0}>
					<LocalShippingOutlinedIcon className="pg-kpiIcon" />
					<Typography className="pg-kpiLabel">Demanda proyectada</Typography>
					<Typography className="pg-kpiValue">{animatedDemanda}</Typography>
					<Typography className="pg-kpiNote">Carga estimada para el proximo semestre</Typography>
				</Paper>

				<Paper className="pg-kpiCard" elevation={0}>
					<TrendingUpOutlinedIcon className="pg-kpiIcon" />
					<Typography className="pg-kpiLabel">Crecimiento estimado</Typography>
					<Typography className="pg-kpiValue">+{animatedCrecimiento}%</Typography>
					<Typography className="pg-kpiNote">Escenario base de expansion</Typography>
				</Paper>
			</motion.div>

			<motion.div variants={cardAnim}>
				<Paper className="pg-panel" elevation={0}>
					<Typography variant="h6" className="pg-panelTitle">
						Capacidad por sede
					</Typography>

					<Box className="pg-tableWrap">
						<Box className="pg-capacityTable" role="table" aria-label="Capacidad por sede">
							<Box className="pg-capacityHead" role="row">
								<Typography role="columnheader">Sede</Typography>
								<Typography role="columnheader">Flota disponible</Typography>
								<Typography role="columnheader">Uso actual</Typography>
								<Typography role="columnheader">% ocupación</Typography>
							</Box>

							{capacityRows.map((row, index) => (
								<CapacityRowItem
									key={row.sede}
									{...row}
									duration={760 + index * 110}
								/>
							))}
						</Box>
					</Box>
				</Paper>
			</motion.div>

			<motion.div variants={cardAnim}>
				<Paper className="pg-panel" elevation={0}>
					<Stack className="pg-chartHeader" direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="h6" className="pg-panelTitle">
							Proyección de demanda (6 meses)
						</Typography>
						<Box className="pg-chartLegend">Tendencia estimada</Box>
					</Stack>

					<LineChart
						className="pg-linechart"
						height={290}
						xAxis={[
							{
								scaleType: 'point',
								data: monthLabels,
								tickLabelStyle: { fill: 'var(--color-primary-light)', fontSize: 12, fontWeight: 600 },
							},
						]}
						series={[
							{
								data: demandProjection,
								label: 'Demanda proyectada',
								showMark: true,
								curve: 'monotoneX',
								color: 'var(--color-primary-dark)',
							},
						]}
						yAxis={[
							{
								min: 700,
								max: 1400,
								valueFormatter: (value: number) => `${Math.round(Number(value))}`,
								tickLabelStyle: { fill: 'var(--color-primary-light)', fontSize: 11, fontWeight: 600 },
							},
						]}
						margin={{ top: 20, right: 24, left: 30, bottom: 30 }}
						hideLegend
						grid={{ horizontal: true, vertical: false }}
					/>
				</Paper>
			</motion.div>

			<motion.div className="pg-highlightGrid" variants={cardAnim}>
				{highlights.map((item) => (
					<HighlightCard key={item.label} label={item.label} value={item.value} detail={item.detail} icon={item.icon} />
				))}
			</motion.div>
		</motion.section>
	)
}
