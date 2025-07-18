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
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
import { ProductImage } from './entities';
import { FilesService } from '../files/files.service';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly filesService: FilesService,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    user: User,
    files?: Array<Express.Multer.File>,
  ) {
    try {
      let productImages: { secureUrl: string; publicId: string }[] = [];

      if (files?.length) {
        productImages = await this.filesService.uploadProductImages(files);
      }

      const { ...productDetails } = createProductDto;

      const product = this.productRepository.create({
        ...productDetails,
        images: productImages.map(({ secureUrl, publicId }) =>
          this.productImageRepository.create({
            url: secureUrl,
            public_id: publicId,
          }),
        ), // it links images to the product automatically
        user,
      }); // Create a new product instance

      await this.productRepository.save(product); // Save the product and its images to the database

      return { ...product, images: productImages }; // Return the product with its images
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Array<Express.Multer.File>,
  ) {
    const { ...productDetails } = updateProductDto;

    const product = await this.findOne(id); // find the product by id

    this.productRepository.merge(product, productDetails); // merge the product with the new data

    /*
    const product = await this.productRepository.preload({
      id,
      ...productDetails,
    }); // find the product by id and update it with the new data, doesn't include relations
    */

    // Query runners are used to manage transactions and execute different queries
    // const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Remove images if they are in the updateProductDto

      const imagesToDelete = updateProductDto.imagesToDelete || [];
      const productImages = product.images || [];

      if (imagesToDelete.length > 0) {
        await this.filesService.removeProductImages(imagesToDelete); // remove images from cloudinary

        const deleteDbImages = imagesToDelete.map((publicId) =>
          this.productImageRepository.delete({ public_id: publicId }),
        ); // delete images from the database

        await Promise.all(deleteDbImages);
      }

      const updatedImages = productImages.filter(
        (image) => !imagesToDelete.includes(image.public_id),
      );

      let newProductImages: { secureUrl: string; publicId: string }[] = [];

      if (files?.length) {
        newProductImages = await this.filesService.uploadProductImages(files);
      }

      product.images =
        updatedImages.concat(
          newProductImages.map(({ secureUrl, publicId }) =>
            this.productImageRepository.create({
              url: secureUrl,
              public_id: publicId,
            }),
          ),
        ) ?? [];

      const updatedProduct = await this.productRepository.save(product); // Save the product and its images to the database

      return updatedProduct;
    } catch (error) {
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
