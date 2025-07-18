import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { initialData } from './data/seed-data';
// import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(
    private readonly productsService: ProductsService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async runSeed() {
    await this.deleteTables();
    const user = await this.insertUsers();
    await this.insertNewProducts(user);

    return 'Seed executed successfully';
  }

  private async insertUsers() {
    const seedUsers = initialData.users;
    const insertPromises = seedUsers.map((user) =>
      this.userRepository.create(user),
    );

    const savePromises = insertPromises.map((user) =>
      this.userRepository.save(user),
    );

    const users = await Promise.all(savePromises);

    return users[0]; // Return the first user as an example
  }

  private async deleteTables() {
    await this.productsService.deleteAllProducts();

    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertNewProducts(user: User) {
    await this.productsService.deleteAllProducts();

    const initProducts = initialData.products;

    const insertPromises = initProducts.map((product) =>
      this.productsService.create(product, user, []),
    );

    await Promise.all(insertPromises);
  }
}
