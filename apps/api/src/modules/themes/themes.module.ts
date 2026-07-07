import { Module } from '@nestjs/common';
import {
  CreateCustomThemeUseCase,
  ListAvailableThemesUseCase,
  UpdateCustomThemeUseCase,
} from './application/theme.usecases';
import { AssignThemeToPageUseCase } from './application/assign-theme-to-page.usecase';
import { ThemesController } from './interface/themes.controller';
import { THEME_REPOSITORY } from './domain/ports';
import { PrismaThemeRepository } from './infrastructure/prisma-theme.repository';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [PagesModule], // AssignThemeToPageUseCase depende de PAGE_REPOSITORY, exportado por PagesModule
  controllers: [ThemesController],
  providers: [
    ListAvailableThemesUseCase,
    CreateCustomThemeUseCase,
    UpdateCustomThemeUseCase,
    AssignThemeToPageUseCase,
    { provide: THEME_REPOSITORY, useClass: PrismaThemeRepository },
  ],
})
export class ThemesModule {}
