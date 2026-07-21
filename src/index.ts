import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from '~/services/database.service'
import { defaultErrorHandler } from './middlewares/errors.middlewares'
import mediaRouter from './routes/media.routes'
import { initUploadFolder } from './controllers/media.controllers'

const app = express()
const port = 4000

databaseService.connect()
initUploadFolder()

app.use(express.json())

app.get('/', (req, res) => {
  res.send('hello')
})

app.use('/user', usersRouter)
app.use('/media', mediaRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`server is running on port ${port}`)
})
