import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [ProductsModule, AuthModule],
  // AuthModule needs to be imported to use the Auth decorator (it has a dependency on PassportModule)
  // AuthModule alrady exports PassportModule with its default strategy set to 'jwt', just need to import it here
})
export class SeedModule {}
