import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { Auth } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Post('signin')
  signIn(@Body() loginUserDto: LoginUserDto) {
    return this.authService.signIn(loginUserDto);
  }

  @Get('private-route')
  // @SetMetadata('roles', ['admin', 'user'])
  // @RoleProtected(ValidRoles.admin)
  // @UseGuards(AuthGuard(), UserRoleGuard) // This will use the JwtStrategy defined in the AuthModule
  // Will look first if the JWT is not just valid but authentic and therefore call the validate method in JwtStrategy

  // replace the previous decorators with decorator composition
  @Auth()
  privateRoute(@GetUser(['fullName', 'email']) user: User) {
    // @GetUser is a property decorator, not generated with nest cli
    console.log('Request data:', user); // This will log the user object returned by the JwtStrategy's validate method
    return {
      ok: true,
      message: 'You have access to this private route',
      user,
    };
  }
}
