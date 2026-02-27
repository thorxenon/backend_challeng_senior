import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AppointmentStatus } from "../entities/appointment.entity";

export class CreateAppointmentDto {
	@IsString()
	@IsNotEmpty()
	doctor_id: string;

	@IsString()
	@IsNotEmpty()
	patient_id: string;

	@IsDateString()
	@IsNotEmpty()
	scheduled_at: string;

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
