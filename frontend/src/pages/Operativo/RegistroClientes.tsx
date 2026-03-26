import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import {
	Box,
	Button,
	InputAdornment,
	Paper,
	Stack,
	TextField,
	Typography,
} from '@mui/material'
import { registerCustomerAccount } from '../../util/auth'

export default function RegistroClientesPage() {
	const navigate = useNavigate()
	const [companyName, setCompanyName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [nit, setNit] = useState('')
	const [address, setAddress] = useState('')
	const [phone, setPhone] = useState('')
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')
		setSuccess('')
		setIsSubmitting(true)

		const response = await registerCustomerAccount({
			companyName,
			email,
			password,
			nit,
			address,
			phone,
		})

		if (!response.ok) {
			setError(response.message)
			setIsSubmitting(false)
			return
		}

		setSuccess(response.message)

		setTimeout(() => {
			navigate('/login', { replace: true })
		}, 1200)
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
					'linear-gradient(150deg, rgba(27, 60, 83, 0.15) 0%, rgba(69, 104, 130, 0.12) 40%, rgba(210, 193, 182, 0.22) 75%, rgba(249, 243, 239, 0.95) 100%)',
				px: 2,
				py: 3,
			}}
		>
			<motion.div
				initial={{ opacity: 0, y: 24, scale: 0.995 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
				style={{ width: '100%', maxWidth: '540px' }}
			>
				<Paper
					elevation={0}
					sx={{
						p: { xs: 2.6, sm: 3.2 },
						borderRadius: 3,
						border: '1px solid rgba(27, 60, 83, 0.12)',
						backgroundColor: 'var(--color-background)',
						boxShadow: '0 14px 34px rgba(27, 60, 83, 0.12)',
					}}
				>
					<Stack spacing={2.2}>
						<Box>
							<Typography
								variant="h4"
								component="h1"
								sx={{
									color: 'var(--color-primary-dark)',
									fontWeight: 800,
									letterSpacing: '-0.02em',
								}}
							>
								Registro de Clientes
							</Typography>
							<Typography variant="body1" sx={{ color: 'var(--color-primary-light)', mt: 0.6 }}>
								Crea tu cuenta empresarial para ingresar a LogiTrans.
							</Typography>
						</Box>

						<Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
							<TextField
								label="Nombre de la empresa"
								value={companyName}
								onChange={(event) => setCompanyName(event.target.value)}
								required
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<BusinessOutlinedIcon fontSize="small" sx={{ color: 'var(--color-primary-light)' }} />
										</InputAdornment>
									),
								}}
							/>

							<TextField
								label="Correo"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<EmailOutlinedIcon fontSize="small" sx={{ color: 'var(--color-primary-light)' }} />
										</InputAdornment>
									),
								}}
							/>

							<TextField
								label="Contrasena"
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<LockOutlinedIcon fontSize="small" sx={{ color: 'var(--color-primary-light)' }} />
										</InputAdornment>
									),
								}}
							/>

							<TextField
								label="NIT"
								value={nit}
								onChange={(event) => setNit(event.target.value)}
								required
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<BadgeOutlinedIcon fontSize="small" sx={{ color: 'var(--color-primary-light)' }} />
										</InputAdornment>
									),
								}}
							/>

							<TextField
								label="Direccion"
								value={address}
								onChange={(event) => setAddress(event.target.value)}
								required
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<PlaceOutlinedIcon fontSize="small" sx={{ color: 'var(--color-primary-light)' }} />
										</InputAdornment>
									),
								}}
							/>

							<TextField
								label="Telefono"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								required
								fullWidth
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<PhoneOutlinedIcon fontSize="small" sx={{ color: 'var(--color-primary-light)' }} />
										</InputAdornment>
									),
								}}
							/>

							{error ? (
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
							) : null}

							{success ? (
								<Box
									role="status"
									sx={{
										backgroundColor: 'rgba(46, 125, 50, 0.12)',
										border: '1px solid rgba(46, 125, 50, 0.38)',
										borderLeft: '4px solid #2e7d32',
										borderRadius: 2,
										px: 1.25,
										py: 0.9,
									}}
								>
									<Typography variant="body2" sx={{ color: '#1b5e20', fontWeight: 600 }}>
										{success}
									</Typography>
								</Box>
							) : null}

							<Button
								type="submit"
								variant="contained"
								disabled={isSubmitting}
								fullWidth
								disableElevation
								sx={{
									height: 50,
									borderRadius: 2,
									textTransform: 'uppercase',
									letterSpacing: '0.09em',
									fontWeight: 700,
									backgroundImage:
										'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-light) 100%)',
									color: 'var(--color-background)',
								}}
							>
								{isSubmitting ? 'Procesando...' : 'Crear Cuenta'}
							</Button>
						</Stack>

						<Button
							variant="text"
							onClick={() => navigate('/login')}
							startIcon={<ArrowBackOutlinedIcon />}
							sx={{
								justifyContent: 'flex-start',
								color: 'var(--color-primary-light)',
								fontWeight: 700,
								textTransform: 'none',
							}}
						>
							Regresar al login
						</Button>
					</Stack>
				</Paper>
			</motion.div>
		</Box>
	)
}
