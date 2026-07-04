import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  uploadImageMaxFiles,
  uploadImageMaxMb,
  uploadLimits,
} from './upload-limits';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@Controller('admin/uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', { limits: uploadLimits }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: `Upload a single image to Cloudinary (max ${uploadImageMaxMb}MB)`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  uploadOne(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadImage(file);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', uploadImageMaxFiles, { limits: uploadLimits }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: `Upload up to ${uploadImageMaxFiles} images at once (max ${uploadImageMaxMb}MB each)`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  async uploadMany(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('No files provided');
    return this.service.uploadImages(files);
  }

  @Delete(':publicId(*)')
  @ApiOperation({ summary: 'Delete image by Cloudinary public_id' })
  remove(@Param('publicId') publicId: string) {
    return this.service.deleteImage(publicId);
  }
}
