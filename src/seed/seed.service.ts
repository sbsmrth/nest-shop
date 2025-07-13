import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(private readonly productsService: ProductsService) {}
  async runSeed() {
    await this.insertNewProducts();

    return 'Seed executed successfully';
  }

  private async insertNewProducts() {
    await this.productsService.deleteAllProducts();

    const initProducts = initialData.products;

    const insertPromises = initProducts.map((product) =>
      this.productsService.create(product, []),
    );

    await Promise.all(insertPromises);
  }
}
