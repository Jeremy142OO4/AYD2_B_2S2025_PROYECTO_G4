export type UserRole =
	| 'Cliente'
	| 'Encargado del Patio'
	| 'Agente Operativo'
	| 'Agente Logistico'
	| 'Piloto'
	| 'Agente Financiero'
	| 'Gerencia'

export interface SessionUser {
	userId?: number
	clienteId?: number
	pilotoId?: number
	name: string
	email: string
	role: UserRole
}

interface StoredSession {
	user: SessionUser
}

interface DemoAccount extends SessionUser {
	password: string
}

export interface CustomerRegistrationData {
	companyName: string
	email: string
	password: string
	nit: string
	address: string
	phone: string
}

type BackendLoginResponse = {
	message?: string
	error?: string
	data?: {
		user?: {
			user_id?: number
			cliente_id?: number
			piloto_id?: number
			nombre?: string
			correo?: string
			role?: string
		}
	}
}

type BackendRegisterResponse = {
	message?: string
	error?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

const STORAGE_KEY = 'logitrans.session'

const demoAccounts: DemoAccount[] = [
	{
		name: 'Encargado del Patio Demo',
		email: 'patio@logitrans.com',
		role: 'Encargado del Patio',
		password: '123',
	},
	{
		name: 'Agente Operativo Demo',
		email: 'operativo@logitrans.com',
		role: 'Agente Operativo',
		password: '123',
	},
	{
		name: 'Agente Logistico Demo',
		email: 'logistico@logitrans.com',
		role: 'Agente Logistico',
		password: '123',
	},
	{ name: 'Piloto Demo', email: 'piloto@logitrans.com', role: 'Piloto', password: '123' },
	{
		name: 'Agente Financiero Demo',
		email: 'financiero@logitrans.com',
		role: 'Agente Financiero',
		password: '123',
	},
	{ name: 'Gerencia Demo', email: 'gerencia@logitrans.com', role: 'Gerencia', password: '123' },
]

function normalizeRole(role?: string): UserRole | null {
	const cleanRole = role?.trim()

	if (!cleanRole) {
		return null
	}

	switch (cleanRole) {
		case 'Cliente':
		case 'Piloto':
		case 'Agente Operativo':
		case 'Agente Logistico':
		case 'Agente Financiero':
		case 'Gerencia':
			return cleanRole
		case 'Encargado de Patio':
		case 'Encargado del Patio':
			return 'Encargado del Patio'
		default:
			return null
	}
}

function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function buildToken(user: SessionUser): string {
	return btoa(`${user.email}:${user.role}:${Date.now()}`)
}

function readStoredSession(): StoredSession | null {
	if (!isBrowser()) {
		return null
	}

	const rawSession = window.localStorage.getItem(STORAGE_KEY)

	if (!rawSession) {
		return null
	}

	try {
		return JSON.parse(rawSession) as StoredSession
	} catch {
		window.localStorage.removeItem(STORAGE_KEY)
		return null
	}
}

function persistSession(user: SessionUser, token?: string): SessionUser {
	if (!isBrowser()) {
		return user
	}

	const session: StoredSession = {
		user,
	}

	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
	return user
}

export function getDemoAccounts(): DemoAccount[] {
	return demoAccounts
}

export function getCurrentUser(): SessionUser | null {
	return readStoredSession()?.user ?? null
}

async function signInClient(email: string, password: string): Promise<SessionUser | null> {
	const response = await fetch(`${API_BASE_URL}/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ correo: email.trim(), password: password.trim() }),
	})

	const responseData = (await response.json().catch(() => ({}))) as BackendLoginResponse

	if (!response.ok) {
		return null
	}

	const backendUser = responseData.data?.user
	const normalizedRole = normalizeRole(backendUser?.role)

	if (!backendUser || !normalizedRole || !backendUser.correo || !backendUser.nombre) {
		return null
	}

	return persistSession({
		userId: backendUser.user_id,
		clienteId: backendUser.cliente_id,
		pilotoId: backendUser.piloto_id,
		name: backendUser.nombre,
		email: backendUser.correo,
		role: normalizedRole,
	})
}

export async function signIn(email: string, password: string): Promise<SessionUser | null> {
	const backendSession = await signInClient(email, password)
	if (backendSession) {
		return backendSession
	}

	const normalizedEmail = email.trim().toLowerCase()

	const matchedAccount = demoAccounts.find(
		(account) => account.email.toLowerCase() === normalizedEmail && account.password === password,
	)

	if (matchedAccount) {
		const { password: _password, ...user } = matchedAccount
		return persistSession(user)
	}

	return null
}

export async function registerCustomerAccount(data: CustomerRegistrationData): Promise<{ ok: boolean; message: string }> {
	const normalizedEmail = data.email.trim().toLowerCase()
	const cleanPassword = data.password.trim()

	if (!normalizedEmail || !cleanPassword) {
		return { ok: false, message: 'Completa el correo y la contrasena para continuar.' }
	}

	const backendPayload = {
		nombre: data.companyName.trim(),
		correo: normalizedEmail,
		password: cleanPassword,
		nit: data.nit.trim(),
		direccion: data.address.trim(),
		telefono: data.phone.trim(),
		limite_credito: 0,
		dias_credito: 0,
		capacidad_pago: 'BAJO',
		lavado_dinero: 'BAJO',
		aduanas: 'BAJO',
		cliente_activo: true,
		usuario_eliminado: false,
		foto_perfil: null,
	}

	try {
		const response = await fetch(`${API_BASE_URL}/clientes/empresas`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(backendPayload),
		})

		const responseData = (await response.json().catch(() => ({}))) as BackendRegisterResponse

		if (!response.ok) {
			return {
				ok: false,
				message: responseData.error ?? responseData.message ?? 'No se pudo completar el registro en el backend.',
			}
		}

		return {
			ok: true,
			message: responseData.message ?? 'Registro exitoso. Ya puedes iniciar sesion.',
		}
	} catch {
		return {
			ok: false,
			message: 'No se pudo conectar con el backend. Verifica que la API esté activa.',
		}
	}
}

export function signOut(): void {
	if (!isBrowser()) {
		return
	}

	window.localStorage.removeItem(STORAGE_KEY)
}

export function isAuthenticated(): boolean {
	return getCurrentUser() !== null
}
