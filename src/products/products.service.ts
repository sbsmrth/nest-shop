import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}
  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ), // it links images to the product automatically
      }); // Create a new product instance

      await this.productRepository.save(product); // Save the product and its images to the database

      return { ...product, images }; // Return the product with its images
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return products;
  }

  // it should receive either a slug or an id
  async findOne(term: string) {
    let product: Product | null = null;

    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({ id: term });
    } else {
      // When using the query builder, is neccesary to use leftJoinAndSelect to include relations
      const queryBuilder = this.productRepository.createQueryBuilder('prod'); // alias for the table (products)
      product = await queryBuilder
        .where('UPPER(title) = :title or slug = :slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'images') // 'the second parameter is an alias necessary for another join for example
        .getOne();
    }

    if (!product) {
      throw new NotFoundException(`Product with term '${term}' not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...productDetails } = updateProductDto;

    const product = await this.productRepository.preload({
      id,
      ...productDetails,
    }); // find the product by id and update it with the new data, doesn't include relations

    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    // Query runners are used to manage transactions and execute different queries
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect(); // connect to the database

    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } }); // delete all images of the product

        product.images = images.map((image) =>
          this.productImageRepository.create({ url: image }),
        ); // create new images for the product
      }

      await queryRunner.manager.save(product); // try to save the product with the new images (not DB yet)
      await queryRunner.commitTransaction(); // commit the transaction if everything is ok (save to DB)
      await queryRunner.release();

      return this.findOne(id); // to return also the images
    } catch (error) {
      await queryRunner.rollbackTransaction(); // rollback the transaction if something goes wrong
      await queryRunner.release();

      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }

  async deleteAllProducts() {
    // dev only method to delete all products and their images therefore
    const query = this.productRepository.createQueryBuilder('product');
    try {
      return await query.delete().where({}).execute(); // delete all products
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(`Unexpected error`);
  }
}
