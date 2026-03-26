import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Alert, Chip, CircularProgress, Grid, Paper, Stack, Typography } from '@mui/material'

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const defaultData = {
	total: 18,
	registradas: 7,
	listasDespacho: 11,
	clientesBloqueados: ['Logisur', 'NeoFleet'],
	contratosVencidos: ['CTR-2026-004', 'CTR-2026-011'],
}

type DashboardOperativoResponse = {
	ordenes_del_dia?: number
	estados?: {
		registradas?: number
		listas_para_despacho?: number
	}
	alertas?: {
		clientes_bloqueados?: Array<{ nombre?: string }>
		contratos_vencidos?: Array<{ contrato_id?: number }>
	}
}

export default function DashboardOperativoPage() {
	const [data, setData] = useState(defaultData)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		let cancelled = false

		const fetchDashboard = async () => {
			try {
				setLoading(true)
				setError('')

				const response = await fetch(`${API_BASE_URL}/api/operativo/dashboard`)
				if (!response.ok) {
					throw new Error('No se pudo cargar el dashboard operativo.')
				}

				const payload = (await response.json()) as DashboardOperativoResponse

				if (!cancelled) {
					setData({
						total: payload.ordenes_del_dia ?? 0,
						registradas: payload.estados?.registradas ?? 0,
						listasDespacho: payload.estados?.listas_para_despacho ?? 0,
						clientesBloqueados: (payload.alertas?.clientes_bloqueados ?? []).map((item) => item.nombre ?? 'Cliente'),
						contratosVencidos: (payload.alertas?.contratos_vencidos ?? []).map((item) => `CTR-${item.contrato_id ?? '-'}`),
					})
				}
			} catch (fetchError) {
				if (!cancelled) {
					setError(fetchError instanceof Error ? fetchError.message : 'Error inesperado al cargar dashboard.')
					setData(defaultData)
				}
			} finally {
				if (!cancelled) {
					setLoading(false)
				}
			}
		}

		void fetchDashboard()

		return () => {
			cancelled = true
		}
	}, [])

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Typography variant="h5" className="op-title">
					Dashboard Operativo
				</Typography>
			</div>

			<Alert severity="info" sx={{ mb: 1 }}>
				Vista MVP: ordenes del dia, estados y alertas operativas.
			</Alert>

			{loading ? (
				<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<CircularProgress size={20} />
						<Typography variant="body2">Cargando dashboard operativo...</Typography>
					</Stack>
				</Paper>
			) : null}

			{error ? <Alert severity="warning">{error}</Alert> : null}

			<Grid container spacing={1.5}>
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="caption" color="text.secondary">Ordenes del dia</Typography>
						<Typography variant="h4" sx={{ fontWeight: 800 }}>{data.total}</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="caption" color="text.secondary">Registradas</Typography>
						<Typography variant="h4" sx={{ fontWeight: 800 }}>{data.registradas}</Typography>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="caption" color="text.secondary">Listas para despacho</Typography>
						<Typography variant="h4" sx={{ fontWeight: 800 }}>{data.listasDespacho}</Typography>
					</Paper>
				</Grid>
			</Grid>

			<Grid container spacing={1.5}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">Alertas: clientes bloqueados</Typography>
						<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
							{data.clientesBloqueados.map((cliente) => (
								<Chip key={cliente} label={cliente} color="warning" />
							))}
							{data.clientesBloqueados.length === 0 ? <Chip label="Sin clientes bloqueados" color="success" /> : null}
						</Stack>
					</Paper>
				</Grid>

				<Grid size={{ xs: 12, md: 6 }}>
					<Paper className="op-panel" elevation={0} sx={{ p: 2 }}>
						<Typography variant="h6" className="op-title">Alertas: contratos vencidos</Typography>
						<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
							{data.contratosVencidos.map((contrato) => (
								<Chip key={contrato} label={contrato} color="error" />
							))}
							{data.contratosVencidos.length === 0 ? <Chip label="Sin contratos vencidos" color="success" /> : null}
						</Stack>
					</Paper>
				</Grid>
			</Grid>
		</motion.section>
	)
}

