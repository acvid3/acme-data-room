import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import type { User } from '../interfaces/auth.interfaces';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UserRepository) {}

    async searchByEmail(email: string): Promise<User[]> {
        const query = email.trim();
        if (!query) {
            return [];
        }
        return this.userRepository.searchByEmail(query, 20);
    }
}
