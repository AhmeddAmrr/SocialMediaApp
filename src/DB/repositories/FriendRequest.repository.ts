import { Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";
import { IFriendRequest } from "../models/friendRequest.model";



export class FriendRequestRepository extends DatabaseRepository<IFriendRequest> {
    constructor(protected override readonly model: Model<IFriendRequest>) {
        super(model);
    }

}