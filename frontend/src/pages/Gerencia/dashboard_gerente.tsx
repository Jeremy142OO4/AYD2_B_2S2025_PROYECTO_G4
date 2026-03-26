import { useEffect, useState, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'

type DashboardGerentePageProps = {
	activeSection?: string
}

type OperacionesDiariasApi = {
	total_ordenes: number
	total_facturado: number
	total_costos: number
	utilidad: number
}

type IngresosVsCostosApi = {
	ingresos: number
	costos: number
	utilidad: number
}

type CumplimientoTiemposApi = {
	total_contratos: number
	contratos_en_tiempo: number
	contratos_fuera_de_tiempo: number
	porcentaje_cumplimiento: number
	promedio_tiempo_pactado_dias: number
	promedio_tiempo_real_dias: number
}

type AlertaDesviacionClienteApi = {
	cliente_id: number
	nombre_cliente: string
	total_ordenes: number
	peso_promedio_real: number
	peso_promedio_pactado: number
	desviacion_porcentaje: number
	severidad: string
}

type AlertaDesviacionRutaApi = {
	ruta_id: number
	origen: string
	destino: string
	distancia_km: number
	total_ordenes: number
	peso_total_consumido: number
	consumo_promedio: number
	severidad: string
}

type AlertasDesviacionApi = {
	clientes_baja_carga: AlertaDesviacionClienteApi[]
	rutas_alto_consumo: AlertaDesviacionRutaApi[]
	total_alertas_clientes: number
	total_alertas_rutas: number
}

type CorteDiarioRow = {
	sede: string
	servicios: number
	facturacion: number
	costoOperativo: number
	utilidad: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const sedesCorteDiario = ['Guatemala', 'Xela', 'Puerto Barrios'] as const

const corteDiarioInicial: CorteDiarioRow[] = sedesCorteDiario.map((sede) => ({
	sede,
	servicios: 0,
	facturacion: 0,
	costoOperativo: 0,
	utilidad: 0,
}))

const rentabilidadContratos = [
	{ contrato: 'CTR-2026-014', cliente: 'Comercial Alfa', ingresos: 368000, costos: 292000 },
	{ contrato: 'CTR-2026-021', cliente: 'Logistica Regional', ingresos: 314000, costos: 301000 },
	{ contrato: 'CTR-2026-033', cliente: 'Agro Export SA', ingresos: 289000, costos: 305000 },
	{ contrato: 'CTR-2026-041', cliente: 'Industria Nova', ingresos: 242000, costos: 224000 },
]

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

function formatMoney(value: number): string {
	return `Q ${value.toLocaleString('es-GT')}`
}

function getGuatemalaIsoDate(date = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Guatemala',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date)

	const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
	const month = parts.find((part) => part.type === 'month')?.value ?? '01'
	const day = parts.find((part) => part.type === 'day')?.value ?? '01'

	return `${year}-${month}-${day}`
}

function getMonthStartGuatemalaIsoDate(date = new Date()): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Guatemala',
		year: 'numeric',
		month: '2-digit',
	}).formatToParts(date)

	const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
	const month = parts.find((part) => part.type === 'month')?.value ?? '01'

	return `${year}-${month}-01`
}

function getGuatemalaTimeLabel(date = new Date()): string {
	return new Intl.DateTimeFormat('es-GT', {
		timeZone: 'America/Guatemala',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).format(date)
}

function getDeviationTone(level: string): string {
	const normalized = level.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

	switch (normalized) {
		case 'critica':
			return 'gm-deviationCard--high'
		case 'alta':
			return 'gm-deviationCard--high'
		case 'media':
			return 'gm-deviationCard--medium'
		default:
			return 'gm-deviationCard--low'
	}
}

export default function DashboardGerentePage({ activeSection = 'dashboard' }: DashboardGerentePageProps) {
	const [corteDiario, setCorteDiario] = useState<CorteDiarioRow[]>(corteDiarioInicial)
	const [loadingCorteDiario, setLoadingCorteDiario] = useState(true)
	const [generandoCorteDiario, setGenerandoCorteDiario] = useState(false)
	const [mensajeCorteDiario, setMensajeCorteDiario] = useState('')
	const [fechaConsulta, setFechaConsulta] = useState(getGuatemalaIsoDate())
	const [fechaInicioRentabilidad, setFechaInicioRentabilidad] = useState(getMonthStartGuatemalaIsoDate())
	const [fechaFinRentabilidad, setFechaFinRentabilidad] = useState(getGuatemalaIsoDate())
	const [loadingRentabilidad, setLoadingRentabilidad] = useState(true)
	const [ingresosVsCostos, setIngresosVsCostos] = useState<IngresosVsCostosApi>({
		ingresos: 0,
		costos: 0,
		utilidad: 0,
	})
	const [cumplimientoTiempos, setCumplimientoTiempos] = useState<CumplimientoTiemposApi>({
		total_contratos: 0,
		contratos_en_tiempo: 0,
		contratos_fuera_de_tiempo: 0,
		porcentaje_cumplimiento: 0,
		promedio_tiempo_pactado_dias: 0,
		promedio_tiempo_real_dias: 0,
	})
	const [loadingAlertas, setLoadingAlertas] = useState(true)
	const [alertasDesviacion, setAlertasDesviacion] = useState<AlertasDesviacionApi>({
		clientes_baja_carga: [],
		rutas_alto_consumo: [],
		total_alertas_clientes: 0,
		total_alertas_rutas: 0,
	})
	const [horaGuatemala, setHoraGuatemala] = useState(getGuatemalaTimeLabel())

	useEffect(() => {
		const timer = setInterval(() => {
			setHoraGuatemala(getGuatemalaTimeLabel())
		}, 60000)

		return () => {
			clearInterval(timer)
		}
	}, [])

	useEffect(() => {
		const controller = new AbortController()

		const fetchCorteDiario = async () => {
			setLoadingCorteDiario(true)

			try {
				const results = await Promise.all(
					sedesCorteDiario.map(async (sede) => {
						const params = new URLSearchParams({ sede, fecha: fechaConsulta })
						const response = await fetch(`${API_BASE_URL}/gerencia/operaciones-diarias?${params.toString()}`, {
							signal: controller.signal,
						})

						if (!response.ok) {
							throw new Error('No se pudo cargar operaciones diarias por sede')
						}

						const data = (await response.json()) as OperacionesDiariasApi

						return {
							sede,
							servicios: data.total_ordenes,
							facturacion: Math.round(data.total_facturado),
							costoOperativo: Math.round(data.total_costos),
							utilidad: Math.round(data.utilidad),
						}
					})
				)

				setCorteDiario(results)
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					setCorteDiario(corteDiarioInicial)
				}
			} finally {
				setLoadingCorteDiario(false)
			}
		}

		void fetchCorteDiario()

		return () => {
			controller.abort()
		}
	}, [fechaConsulta])

	useEffect(() => {
		const controller = new AbortController()

		const fetchIngresosVsCostos = async () => {
			setLoadingRentabilidad(true)

			try {
				const params = new URLSearchParams({
					fecha_inicio: fechaInicioRentabilidad,
					fecha_fin: fechaFinRentabilidad,
				})

				const response = await fetch(`${API_BASE_URL}/gerencia/ingresos-vs-costos?${params.toString()}`, {
					signal: controller.signal,
				})

				if (!response.ok) {
					throw new Error('No se pudo cargar ingresos vs costos')
				}

				const data = (await response.json()) as IngresosVsCostosApi

				setIngresosVsCostos({
					ingresos: Math.round(data.ingresos),
					costos: Math.round(data.costos),
					utilidad: Math.round(data.utilidad),
				})
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					setIngresosVsCostos({ ingresos: 0, costos: 0, utilidad: 0 })
				}
			} finally {
				setLoadingRentabilidad(false)
			}
		}

		void fetchIngresosVsCostos()

		return () => {
			controller.abort()
		}
	}, [fechaInicioRentabilidad, fechaFinRentabilidad])

	useEffect(() => {
		const controller = new AbortController()

		const fetchAlertasDesviacion = async () => {
			setLoadingAlertas(true)

			try {
				const params = new URLSearchParams({
					fecha_inicio: fechaInicioRentabilidad,
					fecha_fin: fechaFinRentabilidad,
				})

				const response = await fetch(`${API_BASE_URL}/gerencia/alertas-desviacion?${params.toString()}`, {
					signal: controller.signal,
				})

				if (!response.ok) {
					throw new Error('No se pudo cargar alertas de desviacion')
				}

				const data = (await response.json()) as AlertasDesviacionApi
				setAlertasDesviacion(data)
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					setAlertasDesviacion({
						clientes_baja_carga: [],
						rutas_alto_consumo: [],
						total_alertas_clientes: 0,
						total_alertas_rutas: 0,
					})
				}
			} finally {
				setLoadingAlertas(false)
			}
		}

		void fetchAlertasDesviacion()

		return () => {
			controller.abort()
		}
	}, [fechaInicioRentabilidad, fechaFinRentabilidad])

	useEffect(() => {
		const controller = new AbortController()

		const fetchCumplimientoTiempos = async () => {
			try {
				const params = new URLSearchParams({
					fecha_inicio: fechaInicioRentabilidad,
					fecha_fin: fechaFinRentabilidad,
				})

				const response = await fetch(`${API_BASE_URL}/gerencia/cumplimiento-tiempos?${params.toString()}`, {
					signal: controller.signal,
				})

				if (!response.ok) {
					throw new Error('No se pudo cargar cumplimiento de tiempos')
				}

				const data = (await response.json()) as CumplimientoTiemposApi

				setCumplimientoTiempos({
					total_contratos: data.total_contratos,
					contratos_en_tiempo: data.contratos_en_tiempo,
					contratos_fuera_de_tiempo: data.contratos_fuera_de_tiempo,
					porcentaje_cumplimiento: Number(data.porcentaje_cumplimiento ?? 0),
					promedio_tiempo_pactado_dias: Number(data.promedio_tiempo_pactado_dias ?? 0),
					promedio_tiempo_real_dias: Number(data.promedio_tiempo_real_dias ?? 0),
				})
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					setCumplimientoTiempos({
						total_contratos: 0,
						contratos_en_tiempo: 0,
						contratos_fuera_de_tiempo: 0,
						porcentaje_cumplimiento: 0,
						promedio_tiempo_pactado_dias: 0,
						promedio_tiempo_real_dias: 0,
					})
				}
			}
		}

		void fetchCumplimientoTiempos()

		return () => {
			controller.abort()
		}
	}, [fechaInicioRentabilidad, fechaFinRentabilidad])

	const handleGenerarCorteDiario = async () => {
		setGenerandoCorteDiario(true)
		setMensajeCorteDiario('')

		try {
			await Promise.all(
				sedesCorteDiario.map(async (sede) => {
					const response = await fetch(`${API_BASE_URL}/gerencia/corte-diario`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							fecha: fechaConsulta,
							sede,
							observaciones: `Cierre automatico desde dashboard (${sede})`,
						}),
					})

					if (!response.ok) {
						throw new Error('No se pudo generar el corte diario')
					}
				})
			)

			setMensajeCorteDiario('Corte diario generado para Guatemala, Xela y Puerto Barrios.')

			// Refresca vista consolidada luego de persistir el corte.
			setLoadingCorteDiario(true)
			const results = await Promise.all(
				sedesCorteDiario.map(async (sede) => {
					const params = new URLSearchParams({ sede, fecha: fechaConsulta })
					const response = await fetch(`${API_BASE_URL}/gerencia/operaciones-diarias?${params.toString()}`)

					if (!response.ok) {
						throw new Error('No se pudo recargar operaciones diarias')
					}

					const data = (await response.json()) as OperacionesDiariasApi

					return {
						sede,
						servicios: data.total_ordenes,
						facturacion: Math.round(data.total_facturado),
						costoOperativo: Math.round(data.total_costos),
						utilidad: Math.round(data.utilidad),
					}
				})
			)

			setCorteDiario(results)
		} catch {
			setMensajeCorteDiario('No se pudo generar el corte diario. Revisa backend y datos del dia.')
		} finally {
			setGenerandoCorteDiario(false)
			setLoadingCorteDiario(false)
		}
	}

	const totalServiciosDia = corteDiario.reduce((total, row) => total + row.servicios, 0)
	const totalFacturacionDia = corteDiario.reduce((total, row) => total + row.facturacion, 0)
	const totalCostosDia = corteDiario.reduce((total, row) => total + row.costoOperativo, 0)
	const rentabilidadNetaDia = corteDiario.reduce((total, row) => total + row.utilidad, 0)

	const animatedIngresosPeriodo = useAnimatedNumber(ingresosVsCostos.ingresos, 980)
	const animatedCostosPeriodo = useAnimatedNumber(ingresosVsCostos.costos, 920)
	const utilidadPeriodo = ingresosVsCostos.utilidad
	const animatedUtilidadPeriodo = useAnimatedNumber(utilidadPeriodo, 940)
	const margenPeriodo = ingresosVsCostos.ingresos > 0
		? (ingresosVsCostos.utilidad / ingresosVsCostos.ingresos) * 100
		: 0
	const animatedMargenPeriodo = useAnimatedNumber(margenPeriodo * 10, 920) / 10
	const cumplimientoPorcentaje = Number(cumplimientoTiempos.porcentaje_cumplimiento ?? 0)
	const animatedCumplimiento = useAnimatedNumber(cumplimientoPorcentaje * 10, 900) / 10
	const promedioPactadoDias = Number(cumplimientoTiempos.promedio_tiempo_pactado_dias ?? 0)
	const promedioRealDias = Number(cumplimientoTiempos.promedio_tiempo_real_dias ?? 0)
	const desviacionTiempoDias = promedioRealDias - promedioPactadoDias
	const animatedTotalContratos = useAnimatedNumber(cumplimientoTiempos.total_contratos, 760)
	const animatedContratosEnTiempo = useAnimatedNumber(cumplimientoTiempos.contratos_en_tiempo, 760)
	const animatedContratosFueraTiempo = useAnimatedNumber(cumplimientoTiempos.contratos_fuera_de_tiempo, 760)
	const animatedPactadoDias = useAnimatedNumber(promedioPactadoDias * 10, 900) / 10
	const animatedRealDias = useAnimatedNumber(promedioRealDias * 10, 900) / 10
	const animatedDesviacionDias = useAnimatedNumber(Math.abs(desviacionTiempoDias) * 10, 900) / 10
	const etiquetaDesviacionTiempo =
		desviacionTiempoDias < 0
			? `Adelanto: ${animatedDesviacionDias.toFixed(1)} días`
			: desviacionTiempoDias > 0
				? `Retraso: ${animatedDesviacionDias.toFixed(1)} días`
				: 'Sin desviación'
	const alertasClientes = alertasDesviacion.clientes_baja_carga.slice(0, 5).map((alerta) => ({
		id: `cliente-${alerta.cliente_id}`,
		nombre: alerta.nombre_cliente,
		tipo: 'Cliente baja carga',
		severidad: alerta.severidad,
	}))

	const alertasRutas = alertasDesviacion.rutas_alto_consumo.slice(0, 5).map((alerta) => ({
		id: `ruta-${alerta.ruta_id}`,
		nombre: `${alerta.origen} - ${alerta.destino}`,
		tipo: 'Ruta alto consumo',
		severidad: alerta.severidad,
	}))

	const alertasGerenciales = [...alertasClientes, ...alertasRutas]
	const contratosEnPerdida = rentabilidadContratos.filter((row) => row.ingresos - row.costos < 0).length

	const rentabilidadKpis = [
		{
			icon: PaidOutlinedIcon,
			title: 'Ingresos (periodo)',
			value: formatMoney(animatedIngresosPeriodo),
			trend: 'Suma facturada en el rango seleccionado',
			trendType: 'positive',
		},
		{
			icon: TrendingUpOutlinedIcon,
			title: 'Costos (periodo)',
			value: formatMoney(animatedCostosPeriodo),
			trend: 'Costo operativo acumulado del periodo',
			trendType: 'negative',
		},
		{
			icon: ReceiptLongOutlinedIcon,
			title: 'Utilidad (periodo)',
			value: formatMoney(animatedUtilidadPeriodo),
			trend: 'Utilidad del periodo = ingresos - costos',
			trendType: contratosEnPerdida > 0 ? 'negative' : 'positive',
		},
		{
			icon: AssessmentOutlinedIcon,
			title: 'Margen sobre ingresos',
			value: `${animatedMargenPeriodo.toFixed(1)}%`,
			trend: 'Margen = (utilidad / ingresos) x 100',
			trendType: margenPeriodo >= 0 ? 'positive' : 'negative',
		},
	] as const

	const cumplimientoKpis = [
		{
			icon: TimerOutlinedIcon,
			title: 'Cumplimiento de tiempos',
			value: `${animatedCumplimiento.toFixed(1)}%`,
			trend: `Real ${promedioRealDias.toFixed(1)}d vs pactado ${promedioPactadoDias.toFixed(1)}d`,
			trendType: cumplimientoPorcentaje >= 80 ? 'positive' : 'negative',
		},
		{
			icon: AssessmentOutlinedIcon,
			title: 'Total contratos',
			value: animatedTotalContratos.toLocaleString('es-GT'),
			trend: `${animatedContratosEnTiempo.toLocaleString('es-GT')} en tiempo`,
			trendType: 'positive',
		},
		{
			icon: AssessmentOutlinedIcon,
			title: 'Contratos fuera de tiempo',
			value: animatedContratosFueraTiempo.toLocaleString('es-GT'),
			trend: 'Contratos con retraso vs fecha pactada',
			trendType: cumplimientoTiempos.contratos_fuera_de_tiempo > 0 ? 'negative' : 'positive',
		},
		{
			icon: TimerOutlinedIcon,
			title: 'Tiempo pactado promedio',
			value: `${animatedPactadoDias.toFixed(1)} dias`,
			trend: 'Promedio comprometido en contrato',
			trendType: 'positive',
		},
		{
			icon: TimerOutlinedIcon,
			title: 'Tiempo real promedio',
			value: `${animatedRealDias.toFixed(1)} dias`,
			trend: 'Promedio real ejecutado',
			trendType: promedioRealDias <= promedioPactadoDias ? 'positive' : 'negative',
		},
		{
			icon: TrendingUpOutlinedIcon,
			title: 'Desviacion (real - pactado)',
			value: etiquetaDesviacionTiempo,
			trend: 'Meta: <= 0 dias',
			trendType: desviacionTiempoDias <= 0 ? 'positive' : 'negative',
		},
	] as const

	return (
		<motion.section className="gm-dashboard" variants={containerAnim} initial="hidden" animate="show">
			<motion.div className="gm-heading" variants={cardAnim}>
				<Typography variant="h4" component="h1" className="gm-title">
					Dashboard Ejecutivo
				</Typography>
				<Typography className="gm-subtitle">
					{activeSection === 'dashboard'
						? 'Corte diario, KPIs estrategicos, alertas de desviacion y rentabilidad de contratos.'
						: 'Vista consolidada para toma de decisiones gerenciales.'}
				</Typography>
			</motion.div>

			<motion.div variants={cardAnim}>
				<Paper elevation={0} sx={{ border: '1px solid rgba(69, 104, 130, 0.2)', borderRadius: '14px', p: 1.2 }}>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'space-between', gap: 1 }}>
						<Typography sx={{ color: 'var(--color-primary-dark)', fontWeight: 800 }}>
							Periodo de consulta
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
							<Box
								component="input"
								type="date"
								value={fechaInicioRentabilidad}
								onChange={(event: ChangeEvent<HTMLInputElement>) => setFechaInicioRentabilidad(event.target.value)}
								sx={{
									border: '1px solid rgba(69, 104, 130, 0.35)',
									backgroundColor: '#fff',
									color: 'var(--color-primary-dark)',
									fontWeight: 700,
									borderRadius: '8px',
									padding: '0.3rem 0.5rem',
								}}
							/>
							<Box
								component="input"
								type="date"
								value={fechaFinRentabilidad}
								onChange={(event: ChangeEvent<HTMLInputElement>) => setFechaFinRentabilidad(event.target.value)}
								sx={{
									border: '1px solid rgba(69, 104, 130, 0.35)',
									backgroundColor: '#fff',
									color: 'var(--color-primary-dark)',
									fontWeight: 700,
									borderRadius: '8px',
									padding: '0.3rem 0.5rem',
								}}
							/>
							<Box className="gm-dotLegend">{loadingRentabilidad ? 'Consultando...' : `${fechaInicioRentabilidad} a ${fechaFinRentabilidad}`}</Box>
						</Stack>
					</Stack>
				</Paper>
			</motion.div>

			<Typography sx={{ color: 'var(--color-primary-dark)', fontWeight: 800, mt: 0.4 }}>
				Rentabilidad: ingresos vs costos operativos
			</Typography>

			<motion.div className="gm-kpiGrid" variants={cardAnim}>
				{rentabilidadKpis.map((item) => (
					<Paper key={item.title} className="gm-kpiCard" elevation={0}>
						<item.icon className="gm-kpiIcon" />
						<Typography className="gm-kpiLabel">{item.title}</Typography>
						<Typography className="gm-kpiValue">{item.value}</Typography>
						<Typography className={`gm-kpiTrend gm-kpiTrend--${item.trendType}`}>{item.trend}</Typography>
					</Paper>
				))}
			</motion.div>

			<Box sx={{ borderTop: '1px solid rgba(69, 104, 130, 0.22)', my: 0.2 }} />

			<Typography sx={{ color: 'var(--color-primary-dark)', fontWeight: 800, mt: 0.1 }}>
				Cumplimiento: tiempo real vs tiempo pactado
			</Typography>

			<motion.div className="gm-kpiGrid" variants={cardAnim}>
				{cumplimientoKpis.map((item) => (
					<Paper key={item.title} className="gm-kpiCard" elevation={0}>
						<item.icon className="gm-kpiIcon" />
						<Typography className="gm-kpiLabel">{item.title}</Typography>
						<Typography className="gm-kpiValue">{item.value}</Typography>
						<Typography className={`gm-kpiTrend gm-kpiTrend--${item.trendType}`}>{item.trend}</Typography>
					</Paper>
				))}
			</motion.div>

			<div className="gm-mainGrid">
				<motion.div variants={cardAnim}>
					<Paper className="gm-panel gm-panel--sede" elevation={0}>
						<Stack className="gm-chartHeader" direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="h6" className="gm-panelTitle">
								Corte diario de operaciones
							</Typography>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
								<Box
									component="input"
									type="date"
									value={fechaConsulta}
									onChange={(event: ChangeEvent<HTMLInputElement>) => setFechaConsulta(event.target.value)}
									sx={{
										border: '1px solid rgba(69, 104, 130, 0.35)',
										backgroundColor: '#fff',
										color: 'var(--color-primary-dark)',
										fontWeight: 700,
										borderRadius: '8px',
										padding: '0.3rem 0.5rem',
									}}
								/>
								<Box className="gm-dotLegend">Hora GT {horaGuatemala}</Box>
								<Box className="gm-dotLegend">{loadingCorteDiario ? 'Actualizando...' : fechaConsulta}</Box>
								<Button
									size="small"
									variant="contained"
									disableElevation
									onClick={() => void handleGenerarCorteDiario()}
									disabled={generandoCorteDiario}
									sx={{
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: '8px',
										backgroundColor: 'var(--color-primary-dark)',
									}}
								>
									{generandoCorteDiario ? 'Generando...' : 'Generar corte diario'}
								</Button>
							</Stack>
						</Stack>

						{mensajeCorteDiario ? (
							<Typography sx={{ mt: 0.4, color: 'var(--color-primary-light)', fontSize: '0.85rem', fontWeight: 700 }}>
								{mensajeCorteDiario}
							</Typography>
						) : null}

						<Stack spacing={1.4} sx={{ mt: 1 }}>
							{corteDiario.map((row) => (
								<Box key={row.sede} sx={{ display: 'grid', gap: 0.4 }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography sx={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>
											{row.sede}
										</Typography>
										<Typography sx={{ color: 'var(--color-text-light)', fontSize: '0.92rem', fontWeight: 700 }}>
											{formatMoney(row.utilidad)} utilidad
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
										<Typography sx={{ color: 'var(--color-text-light)', fontSize: '0.92rem' }}>
											{row.servicios} servicios
										</Typography>
										<Typography sx={{ color: 'var(--color-text-light)', fontSize: '0.92rem' }}>
											{formatMoney(row.facturacion)} facturado
										</Typography>
										<Typography sx={{ color: 'var(--color-text-light)', fontSize: '0.92rem' }}>
											{formatMoney(row.costoOperativo)} costo operativo
										</Typography>
									</Stack>
								</Box>
							))}
						</Stack>

						<Box sx={{ mt: 1.6, p: 1.4, borderRadius: 2, backgroundColor: 'rgba(69, 104, 130, 0.08)' }}>
							<Typography sx={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>
								Resumen del endpoint diario
							</Typography>
							<Box className="gm-summaryGrid">
								<Box className="gm-summaryItem">
									<Typography className="gm-summaryLabel">Total ordenes</Typography>
									<Typography className="gm-summaryValue">{totalServiciosDia}</Typography>
								</Box>
								<Box className="gm-summaryItem">
									<Typography className="gm-summaryLabel">Total facturado</Typography>
									<Typography className="gm-summaryValue">{formatMoney(totalFacturacionDia)}</Typography>
								</Box>
								<Box className="gm-summaryItem">
									<Typography className="gm-summaryLabel">Total costos</Typography>
									<Typography className="gm-summaryValue">{formatMoney(totalCostosDia)}</Typography>
								</Box>
								<Box className="gm-summaryItem">
									<Typography className="gm-summaryLabel">Utilidad total</Typography>
									<Typography className="gm-summaryValue">{formatMoney(rentabilidadNetaDia)}</Typography>
								</Box>
							</Box>
						</Box>

					</Paper>
				</motion.div>

				<motion.div variants={cardAnim}>
					<Paper className="gm-panel gm-panel--alerts" elevation={0}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="h6" className="gm-panelTitle gm-panelTitle--alert">
							Alertas de desviacion
							</Typography>
							<Box className="gm-dotLegend">
								{loadingAlertas
									? 'Consultando...'
									: `${alertasDesviacion.total_alertas_clientes + alertasDesviacion.total_alertas_rutas} alertas`}
							</Box>
						</Stack>

						<Stack spacing={1.3} sx={{ mt: 1.2 }}>
							{alertasGerenciales.map((alerta) => (
								<Box key={alerta.id} className={`gm-alertItem ${getDeviationTone(alerta.severidad)}`}>
									<WarningAmberOutlinedIcon fontSize="small" />
									<Box>
										<Typography sx={{ fontWeight: 800 }}>{alerta.nombre}</Typography>
										<Typography sx={{ fontSize: '0.92rem', color: 'var(--color-text-light)' }}>
											Tipo: {alerta.tipo}
										</Typography>
										<Typography sx={{ fontSize: '0.92rem', color: 'var(--color-text-light)' }}>
											Severidad: {alerta.severidad}
										</Typography>
									</Box>
								</Box>
							))}

							{!loadingAlertas && alertasGerenciales.length === 0 ? (
								<Box className="gm-alertItem">
									<WarningAmberOutlinedIcon fontSize="small" />
									<Box>
										<Typography sx={{ fontWeight: 800 }}>Sin alertas críticas en el periodo</Typography>
										<Typography sx={{ fontSize: '0.92rem', color: 'var(--color-text-light)' }}>
											No se detectaron desviaciones relevantes para clientes o rutas.
										</Typography>
									</Box>
								</Box>
							) : null}

							<Box className="gm-alertItem" sx={{ alignItems: 'center' }}>
								<AssessmentOutlinedIcon fontSize="small" />
								<Box>
									<Typography sx={{ fontWeight: 800 }}>Lectura gerencial</Typography>
									<Typography sx={{ fontSize: '0.92rem', color: 'var(--color-text-light)' }}>
										Con esta vista se puede renegociar contratos, ajustar precios o rediseñar rutas de baja rentabilidad.
									</Typography>
								</Box>
							</Box>
						</Stack>
					</Paper>
				</motion.div>
			</div>
		</motion.section>
	)
}
