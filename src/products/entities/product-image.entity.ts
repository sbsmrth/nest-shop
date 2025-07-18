import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'product_images' })
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  url: string;

  @Column('text')
  public_id: string;

  // Many images can belong to one single product
  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE', // If a product is deleted, its images are also deleted
  })
  product: Product;
  // this is not a field in the database, it is a relation
}
