import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { AppointmentStatus } from "../entities/appointment.entity";

export class UpdateAppointmentDto {
	@IsOptional()
	@IsString()
	doctor_id?: string;

	@IsOptional()
	@IsString()
	patient_id?: string;

	@IsOptional()
	@IsDateString()
	scheduled_at?: string;

	@IsOptional()
	@IsDateString()
	estimated_end_at?: string;

	@IsOptional()
	@IsEnum(AppointmentStatus)
	status?: AppointmentStatus;

	@IsOptional()
	@IsString()
	notes?: string;
}
