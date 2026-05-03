import { User } from '@angular/fire/auth';
import { AppUser } from '../../models/user/app-user.model';

export interface AuthState {
  user: User | null;
  appUser: AppUser | null;
  ready: boolean;
}
