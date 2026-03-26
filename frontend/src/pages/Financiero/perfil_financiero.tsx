import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Paper, Stack, Typography, Avatar, Divider, Grid, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getCurrentUser } from '../../util/auth'

const cardAnim = {
	hidden: { opacity: 0, y: 14 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: 'easeOut' as const },
	},
}

export default function PerfilFinancieroPage() {
	const currentUser = getCurrentUser()
	const navigate = useNavigate()

	return (
		<motion.section className="op-module" variants={cardAnim} initial="hidden" animate="show">
			<div className="op-toolbar">
				<Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
					<Button
						startIcon={<ArrowBackIcon />}
						onClick={() => navigate('/financiero/dashboard')}
						sx={{
							color: '#1B3C53',
							textTransform: 'none',
							fontSize: '0.95rem',
							'&:hover': {
								backgroundColor: 'rgba(69, 104, 130, 0.08)',
							},
						}}
					>
						Volver
					</Button>
					<Typography variant="h5" className="op-title">
						Mi Perfil
					</Typography>
				</Stack>
			</div>

			<Paper
				elevation={0}
				sx={{
					p: 3,
					mt: 2,
					background: 'linear-gradient(135deg, #D2C1B615 0%, #45688215 100%)',
					border: '1px solid #D2C1B6',
					borderRadius: 2,
				}}
			>
				<Stack spacing={3}>
					<Stack direction="row" spacing={2} alignItems="center">
						<Avatar
							sx={{
								width: 80,
								height: 80,
								backgroundColor: '#456882',
								fontSize: '2rem',
								fontWeight: 700,
							}}
						>
							{currentUser?.email?.[0]?.toUpperCase()}
						</Avatar>
						<Stack spacing={0.5}>
							<Typography variant="h5" sx={{ fontWeight: 700, color: '#1B3C53' }}>
								{currentUser?.email}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Agente Financiero
							</Typography>
						</Stack>
					</Stack>

					<Divider />

					<Grid container spacing={3}>
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#456882' }}>
								Información Personal
							</Typography>
							<Stack spacing={2} sx={{ mt: 2 }}>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Email
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#1B3C53', mt: 0.5 }}>
										{currentUser?.email}
									</Typography>
								</Stack>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Rol
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#1B3C53', mt: 0.5 }}>
										{currentUser?.role}
									</Typography>
								</Stack>
							</Stack>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: '#456882' }}>
								Estado de la Cuenta
							</Typography>
							<Stack spacing={2} sx={{ mt: 2 }}>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Estado
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#456882', mt: 0.5 }}>
										Activo
									</Typography>
								</Stack>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Acceso
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, color: '#456882', mt: 0.5 }}>
										Sistema Completo
									</Typography>
								</Stack>
							</Stack>
						</Grid>
					</Grid>
				</Stack>
			</Paper>
		</motion.section>
	)
}
