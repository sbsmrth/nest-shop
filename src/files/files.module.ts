import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  providers: [FilesService],
  imports: [CloudinaryModule],
  exports: [FilesService],
})
export class FilesModule {}
