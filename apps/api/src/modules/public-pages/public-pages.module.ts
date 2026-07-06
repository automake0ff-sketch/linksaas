import { Module } from '@nestjs/common';
import { PublicPagesController } from './interface/public-pages.controller';

@Module({
  controllers: [PublicPagesController],
})
export class PublicPagesModule {}
