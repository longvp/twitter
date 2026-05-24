import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  _id: ObjectId
  token: string
  createdAt: Date
  user_id: ObjectId
}

export default class RefreshToken {
  _id: ObjectId
  token: string
  createdAt: Date
  user_id: ObjectId

  constructor(data: RefreshTokenType) {
    this._id = data._id
    this.token = data.token
    this.createdAt = data.createdAt || new Date()
    this.user_id = data.user_id
  }
}
