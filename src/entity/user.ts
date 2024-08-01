import { LOG_IN_STATUS_ENUM } from '../lib/enum';

export interface IUser {
    username: string,
    password: string,
    logInStatus?: LOG_IN_STATUS_ENUM
}
