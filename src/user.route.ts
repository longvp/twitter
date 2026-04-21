import { Router, Request, Response } from 'express'

interface User {
  id: number
  name: string
  email: string
}

const router = Router()
const users: User[] = []
let nextId = 1

router.get('/', (_req: Request, res: Response) => {
  res.json(users)
})

router.get('/:id', (req: Request, res: Response) => {
  const user = users.find((u) => u.id === Number(req.params.id))
  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  res.json(user)
})

router.post('/', (req: Request, res: Response) => {
  const { name, email } = req.body
  if (!name || !email) {
    res.status(400).json({ message: 'name and email are required' })
    return
  }
  const user: User = { id: nextId++, name, email }
  users.push(user)
  res.status(201).json(user)
})

router.put('/:id', (req: Request, res: Response) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id))
  if (index === -1) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  const { name, email } = req.body
  if (!name || !email) {
    res.status(400).json({ message: 'name and email are required' })
    return
  }
  users[index] = { ...users[index], name, email }
  res.json(users[index])
})

router.delete('/:id', (req: Request, res: Response) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id))
  if (index === -1) {
    res.status(404).json({ message: 'User not found' })
    return
  }
  users.splice(index, 1)
  res.status(204).send()
})

export default router
