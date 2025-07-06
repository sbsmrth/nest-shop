import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';

@Entity({ name: 'products' }) // Explicitly set the table name to 'products'
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  title: string;

  @Column('float', { default: 0 })
  price: number;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('int', { default: 0 })
  stock: number;

  @Column('text', { array: true, default: [] })
  sizes: string[];

  @Column('text')
  gender: string;

  // tags

  @Column('text', { array: true, default: [] })
  tags: string[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true, // Works for updates on instances of Product, not with repository methods, onDelete: 'CASCADE is necessary in ProductImage
    eager: true, // Retrieves images automatically when fetching a product using find*
  })
  images?: ProductImage[];
  // One product can have many images
  // {cascade: true} if a product is deleted, its images are also deleted
  // Indeed is preferred to avoid deleting products because of referential integrity issues

  @BeforeInsert()
  checkSlugBeforeInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugBeforeUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
