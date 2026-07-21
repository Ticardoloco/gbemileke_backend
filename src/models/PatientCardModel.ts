import mongoose, {Schema, Model, Document, Types} from "mongoose";

export interface IPatient {
    patient: Types.ObjectId;
    age: number;
    
}