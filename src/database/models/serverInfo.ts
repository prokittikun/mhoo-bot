import mongoose, { Schema, Document } from 'mongoose';

export interface IServerInfo extends Document {
  serverId: string;
  welcomeChannelId?: string;
  joinImageName?: string;
  words: string[];
  wordMode: 'random' | 'fixed';
  fixedWord?: string;
  mainText?: string;
  afterText?: string;
}

const ServerInfoSchema: Schema = new Schema({
  serverId: { type: String, required: true },
  welcomeChannelId: { type: String, required: false },
  joinImageName: { type: String, required: false },
  words: { type: [String], default: [] },
  wordMode: { type: String, enum: ['random', 'fixed'], default: 'random' },
  fixedWord: { type: String, required: false },
  mainText: { type: String, required: false },
  afterText: { type: String, required: false },
});

const ServerInfoModel = mongoose.model<IServerInfo>('ServerInfo', ServerInfoSchema);

export default ServerInfoModel;
