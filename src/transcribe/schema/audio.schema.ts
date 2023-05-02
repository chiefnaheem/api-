import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SpeechDocument = Speech & Document;

@Schema({
  timestamps: true,
  _id: true,
})
export class Speech {
  @Prop({ required: true })
  text: string;

  @Prop()
  summary: string;
}

export const SpeechSchema = SchemaFactory.createForClass(Speech);
