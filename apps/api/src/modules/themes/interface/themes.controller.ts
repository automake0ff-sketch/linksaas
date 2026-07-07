import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CreateCustomThemeUseCase,
  ListAvailableThemesUseCase,
  UpdateCustomThemeUseCase,
} from '../application/theme.usecases';
import { AssignThemeToPageUseCase } from '../application/assign-theme-to-page.usecase';
import { AssignThemeDto, CreateThemeDto, UpdateThemeDto } from './themes.dto';
import { RequirePermission, WorkspaceAccessGuard } from '../../../shared/guards/workspace-access.guard';

@ApiTags('themes')
@Controller('workspaces/:workspaceId/themes')
@UseGuards(WorkspaceAccessGuard)
export class ThemesController {
  constructor(
    private readonly listThemes: ListAvailableThemesUseCase,
    private readonly createTheme: CreateCustomThemeUseCase,
    private readonly updateTheme: UpdateCustomThemeUseCase,
    private readonly assignTheme: AssignThemeToPageUseCase,
  ) {}

  @Get()
  @RequirePermission('themes.edit')
  async list(@Param('workspaceId') workspaceId: string) {
    return this.listThemes.execute(workspaceId);
  }

  @Post()
  @RequirePermission('themes.edit')
  async create(@Param('workspaceId') workspaceId: string, @Body() dto: CreateThemeDto) {
    return this.createTheme.execute({ workspaceId, ...dto });
  }

  @Put(':themeId')
  @RequirePermission('themes.edit')
  async update(
    @Param('workspaceId') workspaceId: string,
    @Param('themeId') themeId: string,
    @Body() dto: UpdateThemeDto,
  ) {
    await this.updateTheme.execute({ workspaceId, themeId, tokens: dto.tokens });
    return { updated: true };
  }

  @Post('assign')
  @RequirePermission('themes.edit')
  async assign(@Param('workspaceId') workspaceId: string, @Body() dto: AssignThemeDto) {
    await this.assignTheme.execute({ workspaceId, themeId: dto.themeId });
    return { assigned: true };
  }
}
