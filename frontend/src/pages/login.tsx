import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { getCurrentUser, signIn, type SessionUser } from '../util/auth'
import undrawLogin from '../assets/undraw_logistics_login.svg'

function getRouteByRole(user: SessionUser): string {
  switch (user.role) {
    case 'Agente Logistico':
      return '/agente_logistico'
    case 'Agente Operativo':
			return '/operativo/dashboard'
    case 'Cliente':
			return '/cliente/dashboard'
    case 'Piloto':
      return '/Viajes'
    case 'Encargado del Patio':
      return '/dashboard_patio'
    case 'Agente Financiero':
			return '/financiero/dashboard'
    case 'Gerencia':
			return '/gerencia/dashboard'
    default:
			return '/login'
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessTransition, setShowSuccessTransition] = useState(false)

  useEffect(() => {
    if (currentUser) {
      navigate(getRouteByRole(currentUser), { replace: true })
    }
  }, [currentUser, navigate])

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

		await new Promise((resolve) => setTimeout(resolve, 800))

		const sessionUser = await signIn(email, password)

		if (!sessionUser) {
			setError('Credenciales no válidas. Verifique su acceso.')
			setIsSubmitting(false)
			return
		}

		setShowSuccessTransition(true)

		setTimeout(() => {
			navigate(getRouteByRole(sessionUser), { replace: true })
		}, 1250)
  }


	return (
		<Box
			component="section"
			sx={{
				minHeight: '100vh',
				display: 'grid',
				placeItems: 'center',
				backgroundColor: 'var(--color-background)',
				backgroundImage:
					'linear-gradient(145deg, rgba(27, 60, 83, 0.16) 0%, rgba(69, 104, 130, 0.12) 38%, rgba(210, 193, 182, 0.2) 72%, rgba(249, 243, 239, 0.85) 100%), radial-gradient(circle at 12% 18%, rgba(69, 104, 130, 0.14) 0%, rgba(69, 104, 130, 0) 52%), radial-gradient(circle at 88% 85%, rgba(210, 193, 182, 0.26) 0%, rgba(210, 193, 182, 0) 55%)',
				px: 2,
			}}
		>
			{showSuccessTransition ? (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.32 }}
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 20,
						display: 'grid',
						placeItems: 'center',
						background:
							'linear-gradient(145deg, rgba(27, 60, 83, 0.26) 0%, rgba(69, 104, 130, 0.2) 56%, rgba(210, 193, 182, 0.32) 100%)',
						backdropFilter: 'blur(5px)',
					}}
				>
					<motion.div
						initial={{ opacity: 0, y: 18, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{
							duration: 0.55,
							ease: [0.22, 1, 0.36, 1],
						}}
						style={{
							width: 'min(560px, 92vw)',
							background: 'var(--color-background)',
							border: '1px solid rgba(27, 60, 83, 0.14)',
							borderRadius: '16px',
							padding: '1rem 1rem 1.2rem',
							boxShadow: '0 18px 40px rgba(27, 60, 83, 0.18)',
						}}
					>
						<motion.img
							src={undrawLogin}
							alt="Ilustracion de inicio de sesion"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45, delay: 0.12 }}
							style={{ width: '100%', height: 'auto', display: 'block' }}
						/>
						<Typography
							variant="body1"
							sx={{
								textAlign: 'center',
								fontWeight: 700,
								color: 'var(--color-primary-dark)',
								mt: 0.4,
								letterSpacing: '0.02em',
							}}
						>
							Acceso concedido. Preparando tu portal...
						</Typography>
					</motion.div>
				</motion.div>
			) : null}

			<motion.div
				initial={{ opacity: 0, y: 34, scale: 0.992 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
				style={{ width: '100%', maxWidth: '430px' }}
			>
				<Paper
					elevation={0}
					sx={{
						p: { xs: 2.8, sm: 3.4 },
						borderRadius: 3,
						border: '1px solid rgba(27, 60, 83, 0.12)',
						backgroundColor: 'var(--color-background)',
						backgroundImage:
							'linear-gradient(160deg, rgba(249, 243, 239, 0.98) 0%, rgba(210, 193, 182, 0.34) 100%), radial-gradient(circle at 10% 10%, rgba(69, 104, 130, 0.14) 0%, rgba(69, 104, 130, 0) 42%)',
						boxShadow: '0 14px 34px rgba(27, 60, 83, 0.1)',
					}}
				>
					<Stack
						spacing={2.6}
						component={motion.div}
						initial="hidden"
						animate="visible"
						variants={{
							hidden: {},
							visible: {
								transition: {
									staggerChildren: 0.08,
									delayChildren: 0.08,
								},
							},
						}}
					>
						<Box sx={{ textAlign: 'center' }}>
							<Typography
								variant="h4"
								component="h1"
								sx={{
									color: 'var(--color-primary-dark)',
									fontWeight: 800,
									letterSpacing: '-0.02em',
									lineHeight: 1.05,
								}}
							>
								LogiTrans
							</Typography>
							<Typography
								variant="body1"
								sx={{ color: 'var(--color-primary-light)', mt: 0.7 }}
							>
								Acceso seguro al sistema de gestión
							</Typography>
						</Box>

						<Stack component="form" spacing={1.7} onSubmit={handleSubmit} className="login-form">
							<TextField
								className="login-field"
								label="Correo Corporativo"
								type="email"
								variant="outlined"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								fullWidth
								required
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<EmailOutlinedIcon
												fontSize="small"
												sx={{ color: 'var(--color-primary-light)' }}
											/>
										</InputAdornment>
									),
								}}
							/>

							<TextField
								className="login-field"
								label="Clave de Acceso"
								type={showPassword ? 'text' : 'password'}
								variant="outlined"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								fullWidth
								required
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<LockOutlinedIcon
												fontSize="small"
												sx={{ color: 'var(--color-primary-light)' }}
											/>
										</InputAdornment>
									),
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												aria-label="toggle password visibility"
												onClick={() => setShowPassword(!showPassword)}
												edge="end"
												size="small"
												sx={{ color: 'var(--color-primary-light)' }}
											>
												{showPassword ? (
													<VisibilityOffOutlinedIcon fontSize="small" />
												) : (
													<VisibilityOutlinedIcon fontSize="small" />
												)}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>

							{error ? (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
								>
									<Box
										role="alert"
										sx={{
											backgroundColor: 'rgba(211, 47, 47, 0.12)',
											border: '1px solid rgba(211, 47, 47, 0.36)',
											borderLeft: '4px solid #d32f2f',
											borderRadius: 2,
											px: 1.25,
											py: 0.9,
										}}
									>
											<Typography variant="body2" sx={{ color: '#b71c1c', fontWeight: 600 }}>
												{error}
											</Typography>
									</Box>
								</motion.div>
							) : null}

							<Button
								type="submit"
								variant="contained"
								disabled={isSubmitting}
								fullWidth
								disableElevation
								sx={{
									height: 52,
									borderRadius: 2,
									textTransform: 'uppercase',
									letterSpacing: '0.11em',
									fontWeight: 700,
									backgroundImage:
										'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-light) 100%)',
									color: 'var(--color-background)',
									transition: 'all 0.2s ease',
									'&:hover': {
										backgroundImage:
											'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary-dark) 100%)',
										transform: 'translateY(-1px)',
									},
								}}
							>
								{isSubmitting ? 'Verificando credenciales...' : 'Ingresar al Sistema'}
							</Button>
						</Stack>

						<Typography
							variant="caption"
							sx={{ textAlign: 'center', color: 'var(--color-primary-light)', letterSpacing: '0.04em' }}
						>
							El registro de nuevos clientes se gestiona desde el modulo Operativo.
						</Typography>
					</Stack>
				</Paper>

				<Typography
					variant="caption"
					sx={{
						display: 'block',
						textAlign: 'center',
						mt: 1.5,
						color: 'var(--color-primary-light)',
					}}
				>
					© 2026 LogiTrans Corp. Todos los derechos reservados.
				</Typography>
			</motion.div>
		</Box>
	)
}
