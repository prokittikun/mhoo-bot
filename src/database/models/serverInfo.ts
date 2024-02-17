import mongoose, { Schema, Document } from 'mongoose';

interface IServerInfo extends Document {
  serverId: string;
  welcomeChannelId: string;
  joinImageName: string;
}

const ServerInfoSchema: Schema = new Schema({
  serverId: { type: String, required: true },
  welcomeChannelId: { type: String, required: true },
  joinImageName: { type: String, required: true },
});

const ServerInfoModel = mongoose.model<IServerInfo>('ServerInfo', ServerInfoSchema);

export default ServerInfoModel;
