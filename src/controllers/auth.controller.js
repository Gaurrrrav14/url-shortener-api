import { register, login } from '../services/auth.service.js';


export async function registerUser(req, res) {
  const { email, password } = req.body;

  const user = await register(email, password);

  res.status(201).json(user);
}

export async function loginUser(req, res) {
  const { email, password } = req.body;

  const { token } = await login(email, password);

  res.status(200).json({ token });
}