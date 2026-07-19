import { ObjectId } from 'mongodb'

interface FollowerType {
  _id: ObjectId
  createdAt: Date
  user_id: ObjectId
  followed_user_id: ObjectId
}

export default class Follower {
  _id: ObjectId
  createdAt: Date
  user_id: ObjectId
  followed_user_id: ObjectId

  constructor(data: FollowerType) {
    this._id = data._id
    this.createdAt = data.createdAt || new Date()
    this.user_id = data.user_id
    this.followed_user_id = data.followed_user_id
  }
}
