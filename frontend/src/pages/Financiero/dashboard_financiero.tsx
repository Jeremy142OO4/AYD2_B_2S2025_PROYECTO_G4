import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Paper, Stack, Typography, Card, CardActionArea } from '@mui/material'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PaymentIcon from '@mui/icons-material/Payment'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

interface DashboardCard {
	title: string
	description: string
	icon: React.ComponentType<{ sx?: object }>
	path: string
	color: string
}

export default function DashboardFinancieroPage() {
	const navigate = useNavigate()

	const financialCards: DashboardCard[] = [
		{
			title: 'Facturación',
			description: 'Gestionar y visualizar facturas',
			icon: ReceiptIcon,
			path: '/financiero/facturacion',
			color: '#456882',
		},
		{
			title: 'Pagos',
			description: 'Registrar y monitorear pagos',
			icon: PaymentIcon,
			path: '/financiero/pagos',
			color: '#D2C1B6',
		},
		{
			title: 'Estado de Cuenta',
			description: 'Consultar estado de cuentas',
			icon: AccountBalanceIcon,
			path: '/financiero/estado-cuenta',
			color: '#1B3C53',
		},
	]

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<Typography variant="h5" className="op-title">
                <br />
                Dashboard Financiero
            </Typography>

			<Grid container spacing={2} sx={{ mt: 1 }}>
				{financialCards.map((card) => {
					const IconComponent = card.icon
					return (
						<Grid size={{ xs: 12, md: 4 }} key={card.path}>
							<Card
								sx={{
									height: '100%',
									background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}08 100%)`,
									border: `2px solid ${card.color}40`,
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-8px)',
										boxShadow: `0 12px 24px ${card.color}30`,
										border: `2px solid ${card.color}`,
									},
								}}
								elevation={0}
							>
								<CardActionArea onClick={() => navigate(card.path)} sx={{ height: '100%', p: 3 }}>
									<Stack spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 200 }}>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												width: 80,
												height: 80,
												borderRadius: '50%',
												backgroundColor: card.color,
												color: '#FFFFFF',
											}}
										>
											<IconComponent sx={{ fontSize: 48 }} />
										</Box>
										<Stack spacing={0.5} alignItems="center">
											<Typography variant="h6" sx={{ fontWeight: 700, color: card.color }}>
												{card.title}
											</Typography>
											<Typography variant="body2" sx={{ color: '#456882', textAlign: 'center' }}>
												{card.description}
											</Typography>
										</Stack>
									</Stack>
								</CardActionArea>
							</Card>
						</Grid>
					)
				})}
			</Grid>

			<Paper
				className="op-panel"
				elevation={0}
				sx={{
					p: 2,
					mt: 4,
					background: 'linear-gradient(135deg, #F9F3EF 0%, #FFFFFF 100%)',
					border: '1px solid #D2C1B6',
				}}
			>
				<Typography variant="body2" color="text.secondary">
					Selecciona una opción para gestionar tus operaciones financieras. Aquí puedes administrar facturas, registrar
					pagos y consultar el estado de cuentas de la empresa.
				</Typography>
			</Paper>
		</motion.section>
	)
}
