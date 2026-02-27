import { IsOptional, IsString } from "class-validator";

export class UpdateDoctorDto {
	@IsOptional()
	@IsString()
	specialty?: string;

	@IsOptional()
	@IsString()
	crm_number?: string;
}
