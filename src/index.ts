import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.service'
import { defaultErrorHandler } from './middlewares/errors.middlewares'

const app = express()
const port = 3000

databaseService.connect()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('hello')
})

app.use('/user', usersRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log('server is running on port 3000')
})
