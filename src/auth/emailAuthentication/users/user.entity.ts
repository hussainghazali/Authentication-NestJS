import {
    Entity,
    Column,
    BeforeInsert,
    ObjectIdColumn,
    BeforeUpdate,
    PrimaryGeneratedColumn,
    OneToMany,
  } from 'typeorm';
  import { IsEmail } from 'class-validator';
  import * as bcrypt from 'bcrypt';
  import { UserRoles } from '../shared/user-roles';
  
  @Entity('user')
  export class UserEntity {

    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
  
    @Column()
    username: string;
  
    @Column()
    @IsEmail()
    email: string;
  
    @Column()
    password: string;
  
    @Column()
    verified: boolean = false;
  
    @Column()
    role: UserRoles = UserRoles.TEST;
  
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
      try {
        const rounds = bcrypt.getRounds(this.password);
        if (rounds === 0) {
          this.password = await bcrypt.hash(this.password, 5);
        }
      } catch (error) {
        this.password = await bcrypt.hash(this.password, 5);
      }
    }

  }
  
