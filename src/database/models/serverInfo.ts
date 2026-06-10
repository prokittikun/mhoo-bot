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
  antispamEnabled: boolean;
  antispamThreshold: number;
  antispamWindow: number;
  antispamAction: 'warn' | 'timeout' | 'kick';
  antispamTimeoutMin: number;
  antispamLogChannelId?: string;
  threatEnabled: boolean;
  threatBlockInvites: boolean;
  threatAction: 'delete' | 'delete_warn' | 'delete_timeout';
  threatTimeoutMin: number;
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
  antispamEnabled: { type: Boolean, default: false },
  antispamThreshold: { type: Number, default: 5 },
  antispamWindow: { type: Number, default: 5 },
  antispamAction: { type: String, enum: ['warn', 'timeout', 'kick'], default: 'timeout' },
  antispamTimeoutMin: { type: Number, default: 5 },
  antispamLogChannelId: { type: String, required: false },
  threatEnabled: { type: Boolean, default: false },
  threatBlockInvites: { type: Boolean, default: false },
  threatAction: { type: String, enum: ['delete', 'delete_warn', 'delete_timeout'], default: 'delete_warn' },
  threatTimeoutMin: { type: Number, default: 10 },
});

const ServerInfoModel = mongoose.model<IServerInfo>('ServerInfo', ServerInfoSchema);

export default ServerInfoModel;
