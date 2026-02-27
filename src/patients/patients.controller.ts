import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequiredPermission } from 'src/decorators/permission.decorator';

@Controller('patients')
@UseGuards(AuthGuard(), PermissionGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @RequiredPermission('patient_create')
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @RequiredPermission('patient_read')
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @RequiredPermission('patient_read')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermission('patient_update')
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @RequiredPermission('patient_delete')
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
