import { BadRequestException, Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AuthGuard } from '@nestjs/passport';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequiredPermission } from 'src/decorators/permission.decorator';

@Controller('appointments')
@UseGuards(AuthGuard(), PermissionGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @RequiredPermission('appointment_create')
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @RequiredPermission('appointment_read')
  findAll(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('day') day?: string,
  ) {
    const parsedYear = year ? Number(year) : undefined;
    const parsedMonth = month ? Number(month) : undefined;
    const parsedDay = day ? Number(day) : undefined;

    if ((year && Number.isNaN(parsedYear)) || (month && Number.isNaN(parsedMonth)) || (day && Number.isNaN(parsedDay))) {
      throw new BadRequestException('Parâmetros year, month e day devem ser numéricos');
    }

    if (parsedMonth !== undefined && (parsedMonth < 1 || parsedMonth > 12)) {
      throw new BadRequestException('month deve estar entre 1 e 12');
    }

    if (parsedDay !== undefined && (parsedDay < 1 || parsedDay > 31)) {
      throw new BadRequestException('day deve estar entre 1 e 31');
    }

    if (parsedYear !== undefined && parsedYear < 1900) {
      throw new BadRequestException('year inválido');
    }

    return this.appointmentsService.findAll({
      year: parsedYear,
      month: parsedMonth,
      day: parsedDay,
    });
  }

  @Get(':id')
  @RequiredPermission('appointment_read')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermission('appointment_update')
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @RequiredPermission('appointment_delete')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
