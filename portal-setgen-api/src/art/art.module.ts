import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ArtService } from './art.service';
import { ArtController } from './art.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads/art',
    }),
  ],
  controllers: [ArtController],
  providers: [ArtService],
  exports: [ArtService],
})
export class ArtModule {}
