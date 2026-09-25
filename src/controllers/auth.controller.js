import {createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import prisma from '../config/db.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const hashPassword = async (password) => {
	const salt = randomBytes(16).toString('hex');
	const derivedKey = await scrypt(password, salt, 64);
	return `${salt}:${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, storedHash) => {
	const [salt, key] = storedHash.split(':');
	if (!salt || !key) return false;
	const derivedKey = await scrypt(password, salt, 64);
	const expected = Buffer.from(key, 'hex');
	return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
};

const createSession = async (userId) => {
	const token = randomBytes(32).toString('base64url');
	await prisma.authSession.create({
		data: {userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_TTL_MS)},
	});
	return token;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

export const signup = async (req, res) => {
	const {name, companyName, email, password} = req.body;
	if (!name?.trim() || !companyName?.trim() || !email?.trim() || !password) {
		throw new ApiError(400, 'Name, company name, email, and password are required');
	}
	if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');

	const normalizedEmail = normalizeEmail(email);
	const existingUser = await prisma.authUser.findUnique({where: {email: normalizedEmail}});
	if (existingUser) throw new ApiError(409, 'An account already exists for this email');

	const user = await prisma.authUser.create({
		data: {name: name.trim(), companyName: companyName.trim(), email: normalizedEmail, passwordHash: await hashPassword(password)},
	});
	const token = await createSession(user.id);
	res.status(201).json(new ApiResponse(201, 'Account created', {token, user: {id: user.id, name: user.name, companyName: user.companyName, email: user.email}}));
};

export const login = async (req, res) => {
	const {email, password} = req.body;
	if (!email?.trim() || !password) throw new ApiError(400, 'Email and password are required');

	const user = await prisma.authUser.findUnique({where: {email: normalizeEmail(email)}});
	if (!user || !(await verifyPassword(password, user.passwordHash))) throw new ApiError(401, 'Invalid email or password');

	const token = await createSession(user.id);
	res.status(200).json(new ApiResponse(200, 'Login successful', {token, user: {id: user.id, name: user.name, companyName: user.companyName, email: user.email}}));
};