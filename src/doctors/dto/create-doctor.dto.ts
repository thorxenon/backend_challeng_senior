import { IsNotEmpty, IsString } from "class-validator";

export class CreateDoctorDto {
	@IsString()
	@IsNotEmpty()
	user_id: string;

	@IsString()
	@IsNotEmpty()
	specialty: string;

	@IsString()
	@IsNotEmpty()
	crm_number: string;
}
