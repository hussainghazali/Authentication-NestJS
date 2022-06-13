import { IsString, IsEmail, IsNotEmpty, IsDate } from 'class-validator';
import { Column, ObjectIdColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EmailVerificationEntity {
    
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @IsString()
  @IsEmail()
  @Column()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Column()
  emailToken: string;

  @IsDate()
  @Column()
  timestamp: Date;
}