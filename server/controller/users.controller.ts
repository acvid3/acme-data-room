import { Injectable } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import type { User } from '../interfaces/auth.interfaces';

@Injectable()
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    searchByEmail(email: string): Promise<User[]> {
        return this.usersService.searchByEmail(email);
    }
}
