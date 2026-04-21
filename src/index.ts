import express from 'express'
import userRouter from '~/user.route'

const app = express()
const port = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.send('hello')
})

app.use('/user', userRouter)

app.listen(port, () => {
  console.log('server is running on port 3000')
})
