import { AppUser } from '../../models/user/app-user.model';

export interface AuthState {
  appUser: AppUser | null;
  ready: boolean;
}
