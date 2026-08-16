import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import type { User } from '../interfaces/auth.interfaces';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UserRepository) {}

    async searchByEmail(email: string): Promise<User[]> {
        const query = email.trim().toLowerCase();
        if (!query) {
            return [];
        }
        const user = await this.userRepository.searchByEmailExact(query);
        return user ? [user] : [];
    }
}
