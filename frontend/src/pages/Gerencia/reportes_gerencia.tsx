import { motion } from 'framer-motion'
import { Box, Button, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'

type ReportesGerenciaPageProps = {
	activeSection?: string
}

type ReportCardProps = {
	title: string
	description: string
	icon: typeof AssessmentOutlinedIcon
	accent: string
}

const reportCards = [
	{
		title: 'Reporte mensual consolidado',
		description: 'Resumen ejecutivo de operacion, facturacion y tendencia general.',
		icon: AssessmentOutlinedIcon,
		accent: 'var(--color-primary-dark)',
	},
	{
		title: 'Reporte financiero anual',
		description: 'Visibilidad de ingresos, margen y comportamiento de cartera.',
		icon: AttachMoneyOutlinedIcon,
		accent: 'var(--color-primary-light)',
	},
	{
		title: 'Reporte de cumplimiento',
		description: 'Seguimiento de metas, SLA y niveles de servicio por area.',
		icon: FactCheckOutlinedIcon,
		accent: 'var(--color-primary-dark)',
	},
	{
		title: 'Reporte de expansión',
		description: 'Oportunidades de crecimiento, capacidad y nuevos escenarios.',
		icon: RocketLaunchOutlinedIcon,
		accent: 'var(--color-primary-light)',
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
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.38, ease: 'easeOut' as const },
	},
}

function ReportCard({ title, description, icon: Icon, accent }: ReportCardProps) {

	return (
		<Button
			className="rg-reportButton"
			type="button"
			variant="contained"
			endIcon={<ArrowForwardRoundedIcon />}
			sx={{
				background: 'linear-gradient(90deg, #1b3c53 0%, #456882 100%)',
				color: 'var(--color-background)',
				borderRadius: '14px',
				padding: '1rem 1.1rem',
				minHeight: 84,
				textTransform: 'none',
				alignItems: 'stretch',
				justifyContent: 'space-between',
				boxShadow: '0 10px 22px rgba(27, 60, 83, 0.16)',
				'&:hover': {
					background: 'linear-gradient(90deg, #214a66 0%, #547a95 100%)',
					boxShadow: '0 14px 30px rgba(27, 60, 83, 0.2)',
					transform: 'translateY(-2px)',
				},
				'& .MuiButton-endIcon': {
					marginLeft: 0,
					marginTop: 'auto',
					color: 'rgba(249, 243, 239, 0.9)',
				},
			}}
		>
			<Box className="rg-reportButton__content">
				<Box className="rg-reportButton__top">
					<Box className="rg-reportButton__iconWrap" sx={{ bgcolor: accent }}>
						<Icon className="rg-reportButton__icon" />
					</Box>
					<Typography className="rg-reportButton__title">{title}</Typography>
				</Box>
				<Typography className="rg-reportButton__description">{description}</Typography>
			</Box>
		</Button>
	)
}

export default function ReportesGerenciaPage({ activeSection = 'reportes' }: ReportesGerenciaPageProps) {
	return (
		<motion.section className="rg-dashboard" variants={containerAnim} initial="hidden" animate="show">
			<motion.div className="rg-heading" variants={cardAnim}>
				<Typography variant="h4" component="h1" className="rg-title">
					Reportes Estrategicos
				</Typography>
				<Typography className="rg-subtitle">
					{activeSection === 'reportes'
						? 'Acceso rapido a los informes ejecutivos de Gerencia.'
						: 'Panel de reportes ejecutivos.'}
				</Typography>
			</motion.div>

			<motion.div className="rg-grid" variants={cardAnim}>
				{reportCards.map((card) => (
					<Box key={card.title} className="rg-reportAction">
						<ReportCard
							title={card.title}
							description={card.description}
							icon={card.icon}
							accent={card.accent}
						/>
					</Box>
				))}
			</motion.div>
		</motion.section>
	)
}
