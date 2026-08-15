import { Controller, Get, Query } from '@nestjs/common';
import { UsersController } from '../controller/users.controller';

@Controller('users')
export class UsersRoutes {
    constructor(private readonly usersController: UsersController) {}

    @Get()
    searchByEmail(@Query('email') email: string) {
        return this.usersController.searchByEmail(email ?? '');
    }
}
