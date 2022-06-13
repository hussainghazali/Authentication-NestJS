import {
    Injectable,
    UnauthorizedException,
    HttpStatus,
    HttpException,
    Logger,
  } from '@nestjs/common';
  import { UsersService } from '../users/users.service';
  import { LoginUserDto } from '../users/dtos/login-user.dto';
  import * as bcrypt from 'bcrypt';
  import { JwtPayloadService } from '../shared/jwt.payload.service';
  import { JwtPayload } from './interfaces/jwt-payload.interface';
  import { Repository } from 'typeorm';
  import { EmailVerificationEntity } from './entities/emailverification.entity';
  import { InjectRepository } from '@nestjs/typeorm';
  import { transporter } from '../shared/email-constants';
  import 'dotenv/config';
  import { UserEntity } from '../users/user.entity';
  import { CreateUserDto } from '../users/dtos/create-user.dto';
import { UpdateUserDto } from '../users/dtos/update-user.dto';
  
  @Injectable()
  export class AuthService {
    constructor(
      private usersService: UsersService,
      private readonly jwtPayloadService: JwtPayloadService,
      @InjectRepository(EmailVerificationEntity)
      private readonly emailVerificationRepository: Repository<
        EmailVerificationEntity
      >,
      @InjectRepository(UserEntity)
      private readonly userRepository: Repository<UserEntity>,
    ) {}
  
    async create(createUserDto: CreateUserDto) {
      const user = await this.usersService.findOneByEmail(createUserDto.email);
  
      if (user) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }
  
      const newUser = new UserEntity();
      newUser.email = createUserDto.email;
      newUser.password = createUserDto.password;
      newUser.username = createUserDto.username;
  
      const userResponse = await this.userRepository.save(newUser);
      const token = await this.jwtPayloadService.createJwtPayload(newUser);
  
      return { userResponse, token };
    }
  
    async validateUserByPassword(loginUserDto: LoginUserDto) {
      const user = await this.usersService.findOneByEmail(loginUserDto.email);
      if (!user) {
        throw new UnauthorizedException('User does not exist');
      }
  
      const promise: any = await new Promise(async resolve => {
        const state = await this.checkPassword(loginUserDto.password, user);
        if (state) {
          resolve(this.jwtPayloadService.createJwtPayload(user));
        } else {
          resolve({ status: 401 });
        }
      });
  
      if (promise.status !== 401) {
        return promise;
      } else {
        throw new HttpException('Wrong credentials', HttpStatus.UNAUTHORIZED);
      }
    }
  
    async checkPassword(password: string, user): Promise<boolean> {
      return new Promise(async resolve => {
        await bcrypt.compare(password, user.password, async (err, isMatch) => {
          if (err) {
            return err;
          }
          resolve(isMatch);
        });
      });
    }
  
    async validateUserByJwt(payload: JwtPayload) {
      const user = await this.usersService.findOneByEmail(payload.email);
  
      if (user) {
        return this.jwtPayloadService.createJwtPayload(user);
      } else {
        throw new UnauthorizedException();
      }
    }
  
    async createEmailToken(email: string) {
      const emailVerification = await this.emailVerificationRepository.findOne({
        email,
      });
  
      if (!emailVerification) {
        const emailVerificationToken = await this.emailVerificationRepository.save(
          {
            email,
            emailToken: (
              Math.floor(Math.random() * 9000000) + 1000000
            ).toString(),
            timestamp: new Date(),
          },
        );
        return emailVerificationToken;
      }
      return false;
    }
  
    async verifyEmail(token: string): Promise<boolean> {
      const emailVerif = await this.emailVerificationRepository.findOne({
        emailToken: token,
      });
      if (emailVerif && emailVerif.email) {
        const userFromDb = await this.usersService.findOneByEmail(
          emailVerif.email,
        );
        if (userFromDb) {
          await this.usersService.update(userFromDb.id, {
            verified: true,
          });
  
          await this.emailVerificationRepository.delete({ emailToken: token });
          return true;
        }
      } else {
        throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
      }
    }
  
    async sendEmailVerification(email: string) {
      const repository = await this.emailVerificationRepository.findOne({
        email,
      });
  
      if (repository && repository.emailToken) {
        const mailOptions = {
          from: '"Company" <' + process.env.EMAIL_USER + '>',
          to: email,
          subject: 'Verify Email',
          text: 'Verify Email',
          html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
          <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
           <head>
            <title>Robust Designs</title>
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta content="yes" name="apple-mobile-web-app-capable" />
            <meta name="x-apple-disable-message-reformatting"/>
            <meta content="black" name="apple-mobile-web-app-status-bar-style" />
            <meta content="telephone=no" name="format-detection" />
          
            <!--[if !mso]><!-->
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <!--<![endif]-->
          
          <!--[if (gte mso 9)|(IE)]>
          <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
          
          <style type="text/css">
          @media screen {
            @font-face {
              font-family: 'Montserrat';
              font-style: normal;
              font-weight: 400;
              src: local('Montserrat Regular'), local('Montserrat-Regular'), url(https://fonts.gstatic.com/s/montserrat/v12/zhcz-_WihjSQC0oHJ9TCYBsxEYwM7FgeyaSgU71cLG0.woff) format('woff');
            }
            @font-face {
              font-family: 'Montserrat';
              font-style: normal;
              font-weight: bold;
              src: local('Montserrat SemiBold'), local('Montserrat-SemiBold'), url(https://fonts.gstatic.com/s/montserrat/v12/q2OIMsAtXEkOulLQVdSl024H_cQCpNmkmj7HsMzmiiM.woff) format('woff');
            }
          
            @font-face {
              font-family: 'Open Sans';
              font-style: normal;
              font-weight: 400;
              src: local('Open Sans Regular'), local('OpenSans-Regular'), url(https://fonts.gstatic.com/s/opensans/v15/cJZKeOuBrn4kERxqtaUH3T8E0i7KZn-EPnyo3HZu7kw.woff) format('woff');
            }
            @font-face {
              font-family: 'Quicksand';
              font-style: normal;
              font-weight: 400;
              src: local('Quicksand Regular'), local('Quicksand-Regular'), url(https://fonts.gstatic.com/s/quicksand/v7/6xKtdSZaM9iE8KbpRA_hK1QL.woff) format('woff');
            }
            @font-face {
              font-family: 'Quicksand';
              font-style: normal;
              font-weight: 500;
              src: local('Quicksand Medium'), local('Quicksand-Medium'), url(https://fonts.gstatic.com/s/quicksand/v7/6xKodSZaM9iE8KbpRA_p2HcYT8L5.woff) format('woff');
            }
            @font-face {
              font-family: 'Quicksand';
              font-style: normal;
              font-weight: 700;
              src: local('Quicksand Bold'), local('Quicksand-Bold'), url(https://fonts.gstatic.com/s/quicksand/v7/6xKodSZaM9iE8KbpRA_pkHEYT8L5.woff) format('woff');
            }
            @font-face {
              font-family: 'Cabin';
              font-style: normal;
              font-weight: 400;
              src: local('Cabin'), local('Cabin-Regular'), url(https://fonts.gstatic.com/s/cabin/v14/u-4x0qWljRw-Pd8w__s.woff) format('woff');
            }
            @font-face {
            font-family: 'Soleil';
            font-style: normal;
            font-weight: 400;
            src: local('Soleil Regular'), local('Soleil-Regular'), url(https://robust.email/documentation/assets/fonts/Soleil-Regular.woff) format('woff');
            }
            @font-face {
              font-family: 'Poppins';
              font-style: italic;
              font-weight: 700;
              font-display: swap;
              src: url(https://fonts.gstatic.com/s/poppins/v20/pxiDyp8kv8JHgFVrJJLmy15lEw.woff) format('woff');
            }
            @font-face {
              font-family: 'Poppins';
              font-style: normal;
              font-weight: 400;
              font-display: swap;
              src: url(https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJM.woff) format('woff');
            }
            @font-face {
              font-family: 'Roboto';
              font-style: normal;
              font-weight: 300;
              src: local('Roboto Light'), local('Roboto-Light'), url(https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmSU5fBBc-.woff) format('woff');
            }
            @font-face {
              font-family: 'Roboto';
              font-style: normal;
              font-weight: 600;
              src: local('Roboto Bold'), local('Roboto-Bold'), url(https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmWUlfBBc-.woff) format('woff');
            }
          }
          
          .ReadMsgBody {width: 100%; background-color: #eaeaea;}
          .ExternalClass {width: 100%; background-color: #eaeaea;}
          body { background-color: #eaeaea; -webkit-font-smoothing: antialiased; }
          table { border-collapse:collapse !important; mso-table-lspace:0pt; mso-table-rspace:0pt; }
          img{-ms-interpolation-mode:bicubic;}
          p {margin-bottom:0; margin:0}
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
          }
          
          @media screen and (min-width: 601px) {
            .mainCont,
            *[lang="x-main"] {
              width: 600px !important;
              table-layout: fixed;
            }
            .contenttable,
            *[lang="x-content"] {
              width: 550px !important;
              table-layout: fixed;
            }
          }
          
          @media only screen and (max-width: 480px), (max-device-width: 480px) {
            body[yahoo] .center {
              text-align: center !important;
            }
          
            .two-to-three {
              width: 100%;
              max-width: 300px !important;
            }
            .two-to-two8e {
              width: 100%;
              max-width: 280px !important;
            }
            .textCenter,
            td[lang=x-textCenter] {
              text-align: center !important;
            }
            .hide,
            *[lang=x-hide] {
              height: 0px !important;
              width: 0px !important;
              overflow: hidden;
              visibility: hidden;
              opacity: 0;
              line-height: 0px;
              display: none !important;
              mso-hide:all;
            }
          
          }
          
          font {
            font-family: 'Poppins', 'Montserrat', 'Open Sans', 'Segoe UI','Segoe UI Web Regular','Segoe UI Symbol','Helvetica Neue', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif;
            -webkit-text-size-adjust:100% !important;
            -ms-text-size-adjust:100% !important;
            text-size-adjust:100% !important;
          }
          
          </style>
          </head>
          <body bgcolor="#eaeaea" yahoo="fix" leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" style="background-color:#eaeaea;font-family:'Quicksand', 'Montserrat', 'Noto Sans', 'Open Sans', 'Segoe UI','Segoe UI Web Regular','Segoe UI Symbol','Helvetica Neue', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif;margin-top:0px;margin-bottom:0px;margin-right:0px;margin-left:0px;padding-top:0px;padding-bottom:0px;padding-right:0px;padding-left:0px;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" >
          
          <div editable="preheader" style="display:none !important;height:0px;line-height:0px;mso-hide:all;visibility:hidden;opacity:0;" >He's a lumberjack and he's okay, he sleeps all night and he works all day!</div>
          
          <div class="center" style="background-color:#eaeaea;width:100%;" >
          <!--[if gte mso 9]>
          <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false">
          <v:fill type="tile" color="#eaeaea"/>
          </v:background>
          <![endif]-->
          <table align="center" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" style="border-collapse:collapse !important;min-width:100% !important;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;table-layout:fixed;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" >
          <tbody>
          <tr>
          <td align="center" bgcolor="eaeaea" valign="top" style="background-color:#eaeaea;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" >
          <!--BackgroundColor Fix Start-->
           
          <table align="center" border="0" cellpadding="0" cellspacing="0" class="contenttable" lang="x-content" width="600" style="border-collapse:collapse !important;max-width:500px;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" >
          <tbody>
          <tr>
          <td align="center" summary="hide" style="color:#777777;font-size:13px;font-weight:600;line-height:18px;padding-top:30px;padding-bottom:20px;padding-left:0px;padding-right:0px;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" >
          <font color="777777" size="2" style="font-weight:600;text-size-adjust:100% !important;-webkit-text-size-adjust:100% !important;-ms-text-size-adjust:100% !important;font-family:'Quicksand', 'Montserrat', 'Open Sans', 'Segoe UI','Segoe UI Web Regular','Segoe UI Symbol','Helvetica Neue', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif;" >Having trouble viewing? <a href="robustview" style="text-decoration:none;color:blueviolet;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" >View&nbsp;this&nbsp;email&nbsp;in&nbsp;your&nbsp;<span style="border-bottom-width:2px;border-bottom-style:solid;border-bottom-color:blueviolet;" >browser.</span></a></font>
          </td>
          </tr>
          </tbody>
          </table>
          
          <!--[if !mso]><!-->
          <table bgcolor='1B182B' border='0' width='100%' cellpadding='0' cellspacing='0' align='center' lang='x-main' class='mainCont' style='border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;background-color:#1B182B;max-width:600px;min-width:280px;table-layout: fixed; border-top-left-radius: 20px; border-top-right-radius: 20px;' >
          <!--<![endif]-->
          <!--[if (gte mso 9)|(IE)]>
          <table bgcolor='1B182B' border='0' width='600' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;' >
          <![endif]-->
          <tbody>
          <tr>
          <td valign='middle' align='left' style='padding-top: 30px; padding-bottom: 0px; padding-left: 50px; padding-right: 50px; line-height: 100%;'>
          <a href="#" style="text-decoration: none;">
          <img src="images/logo.png" width="150" height="auto" border="0" style="width: 150px; height: auto; max-width: 150px; min-width: 150px; display: block; border: none;" alt="" />
          </a>
          </td>
          </tr>
          </tbody>
          </table>
          
          <!--[if !mso]><!-->
          <table bgcolor='1B182B' border='0' width='100%' cellpadding='0' cellspacing='0' align='center' lang='x-main' class='mainCont' style='border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;background-color:#1B182B;max-width:600px;min-width:280px;table-layout: fixed;' >
          <!--<![endif]-->
          <!--[if (gte mso 9)|(IE)]>
          <table bgcolor='1B182B' border='0' width='600' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;' >
          <![endif]-->
          <tbody>
          <tr>
          <td valign='middle' align='left' style="padding-top: 40px; padding-bottom: 20px; padding-left: 50px; padding-right: 0px;">
          <table border='0' width="100%" cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <tbody>
          <tr>
          <td valign='middle' align='left' style="font-family: 'Poppins', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 18px; line-height: 30px; color: #ffffff; padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;">
          <font size="5" color="#ffffff" style="color: #ffffff; font-weight: 700;">Hello Ahsan</font><br/>
          <font size="3" color="#ffffff" style="color: #ffffff;">Your booking ID #STAY1234 is accepted by host!</font>
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
          
          <!--[if !mso]><!-->
          <table bgcolor='1B182B' border='0' width='100%' cellpadding='0' cellspacing='0' align='center' lang='x-main' class='mainCont' style='border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;background-color:#1B182B;max-width:600px;min-width:280px;table-layout: fixed;' >
          <!--<![endif]-->
          <!--[if (gte mso 9)|(IE)]>
          <table bgcolor='1B182B' border='0' width='600' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;' >
          <![endif]-->
          <tbody>
          <tr>
          <td valign='middle' align='left' style='padding-top: 20px; padding-bottom: 0px; padding-left: 20px; padding-right: 20px; line-height: 100%;'>
          <!--[if (gte mso 9)|(IE)]>
          <table bgcolor='323041' border='0' width='550' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;width: 550px;'>
          <![endif]-->
          <!--[if !mso]><!-->
          <table border='0' bgcolor='323041' width='100%' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;max-width: 550px; border-radius: 20px;'>
          <!--<![endif]-->
          <tbody>
          <tr>
          <td valign='top' align='center' style='padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px;vertical-align:top;font-size:0px;text-align:center;'>
          
          <table border='0' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <tbody>
          <tr>
          <td background="images/signup-hero-bg.jpg" bgcolor="#323041" valign="top" align="center" style="padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px; background-image: url(images/signup-hero-bg.jpg); background-repeat: no-repeat; background-position: center; border-radius: 20px;">
          <!--[if gte mso 9]>
          <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:500px;height:300px;">
          <v:fill type="tile" src="images/signup-hero-bg.jpg" color="#323041" />
          <v:textbox inset="0,0,0,0">
          <![endif]-->
          <div>
          
          <table border='0' width='100%' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <!--<![endif]-->
          <tbody>
          <tr>
          <td valign='middle' align='center' style="font-family: 'Montserrat', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 14px; line-height: 30px; color: #ffffff; padding-top: 30px; padding-bottom: 0px; padding-left: 20px; padding-right: 20px;">
          <font size="5" color="#ffffff" style="font-family: 'Montserrat', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-weight: 800;">
          <strong>Thanks for Successful <br/>Signup Link</strong>
          </font>
          </td>
          </tr>
          <tr>
          <td valign='middle' align='center' style="font-family: 'Montserrat', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 14px; line-height: 22px; color: #ffffff; padding-top: 10px; padding-bottom: 20px; padding-left: 20px; padding-right: 20px;">
          <font size="2" color="#ffffff" style="font-family: 'Montserrat', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 14px;">
          Sign up on Staywo app, you can <br>
          get credit toward iPhone 11 Pro <br>
          <a href='${process.env.URL}:${process.env.PORT}/auth/email/verify/${repository.emailToken}'>Click here to activate your account</a>
          </font>
          </td>
          </tr>
          <tr>
          <td valign='middle' align='left' style="padding-top: 80px; padding-bottom: 30px; padding-left: 0px; padding-right: 0px;">
          <table border='0' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <tbody>
          <tr>
          <td valign='middle' align='left' style="font-family: 'Poppins', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 18px; line-height: 26px; color: #ffffff; padding-top: 10px; padding-bottom: 10px; padding-left: 20px; padding-right: 20px; border-radius: 20px; border: 1px solid #ffffff">
          <a href="#" style="text-decoration: none;">
          <font size="3" color="#ffffff" style="color: #ffffff;">
          Search Properties
          </font>
          </a>
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
          
          </div>
          <!--[if gte mso 9]>
          </v:textbox>
          </v:rect>
          <![endif]-->
          </td>
          </tr>
          </tbody>
          </table>
          
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
          
          <!--[if !mso]><!-->
          <table bgcolor='1B182B' border='0' width='100%' cellpadding='0' cellspacing='0' align='center' lang='x-main' class='mainCont' style='border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;background-color:#1B182B;max-width:600px;min-width:280px;table-layout: fixed;' >
          <!--<![endif]-->
          <!--[if (gte mso 9)|(IE)]>
          <table bgcolor='1B182B' border='0' width='600' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:600px;' >
          <![endif]-->
          <tbody>
          <tr>
          <td background="images/background-bottom.png" bgcolor="#1B182B" valign="top" style="padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px; background-image: url(images/background-bottom.png); background-repeat: no-repeat;">
          <!--[if gte mso 9]>
          <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:100px;">
          <v:fill type="tile" src="images/background-bottom.png" color="#1B182B" />
          <v:textbox inset="0,0,0,0">
          <![endif]-->
          <div>
          
          <table border='0' width='100%' cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <!--<![endif]-->
          <tbody>
          <tr>
          <td align='left' style="padding-top: 20px; padding-bottom: 30px; padding-left: 30px; padding-right: 30px;">
          <table border='0' width="100%" cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <tbody>
          <tr>
          <td align='center' style='padding-top: 0px; padding-bottom: 20px; padding-left: 0px; padding-right: 0px;'>
          <table border='0' width="100%" cellpadding='0' cellspacing='0' align='center' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <tbody>
          <tr>
          <td valign='top' align='center' style='padding-top:0px;padding-bottom:0px;padding-left:0px;padding-right:0px;vertical-align:top;font-size:0px;text-align:center;'>
          
          <div class="two-to-three" style='width:100%;max-width:340px;display:inline-block;vertical-align:top;direction:ltr;'>
          <table border='0' cellpadding='0' cellspacing='0' align='left' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <tbody>
          <tr>
          <td valign='middle' align='left' style="font-family: 'Poppins', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 18px; line-height: 20px; color: #ffffff; padding-top: 20px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;">
          <font size="3" color="#ffffff" style="color: #ffffff; font-weight: 700;">Staywo.com</font><br/><br/>
          <font size="2" color="#ffffff" style="color: #ffffff;">
          88 Brannan St.<br/>
          San Francisco, CA 94103, USA
          </font>
          </td>
          </tr>
          <tr>
          <td valign='middle' align='left' style="line-height: 22px; color: #ffffff; padding-top: 20px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;">
          <table border='0' cellpadding='0' cellspacing='0' align='left' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt; border-radius: 50px;'>
          <tbody>
          <tr>
          <td valign='middle' align='left' style="padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;">
          <table border='0' bgcolor="0095FF" cellpadding='0' cellspacing='0' align='left' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt; border-radius: 50px;'>
          <tbody>
          <tr>
          <td valign='middle' align='left' style="line-height: 26px; color: #ffffff; padding-top: 10px; padding-bottom: 10px; padding-left: 20px; padding-right: 0px;">
          <img src="images/icons8-google-play-50.png" style="width: 22px; height: auto; max-width: 2px; min-width: 22px; border: none;" border="0" alt=""/>
          </td>
          <td valign='middle' align='left' style="font-family: 'Poppins', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 18px; font-weight: 700; line-height: 26px; color: #ffffff; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 20px;">
          <a href="#" style="text-decoration: none;">
          <font size="3" color="#ffffff" style="color: #ffffff; font-weight: 700;">
          Google Play
          </font>
          </a>
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          <td valign='middle' align='left' style="padding-top: 0px; padding-bottom: 0px; padding-left: 10px; padding-right: 0px;">
          <table border='0' bgcolor="0095FF" cellpadding='0' cellspacing='0' align='left' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt; border-radius: 50px;'>
          <tbody>
          <tr>
          <td valign='middle' align='left' style="line-height: 26px; color: #ffffff; padding-top: 10px; padding-bottom: 10px; padding-left: 20px; padding-right: 0px;">
          <img src="images/icons8-apple-logo-50.png" style="width: 22px; height: auto; max-width: 2px; min-width: 22px; border: none;" border="0" alt=""/>
          </td>
          <td valign='middle' align='left' style="font-family: 'Poppins', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 18px; font-weight: 700; line-height: 26px; color: #ffffff; padding-top: 10px; padding-bottom: 10px; padding-left: 10px; padding-right: 20px;">
          <a href="#" style="text-decoration: none;">
          <font size="3" color="#ffffff" style="color: #ffffff; font-weight: 700;">
          App Store
          </font>
          </a>
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
          </div>
          <!--[if (gte mso 9)|(IE)]>
          </td>
          <td align='center' width='200' valign='top' style='padding-top:0px;padding-bottom:0px;padding-right:0px;padding-left:0px;vertical-align:top;'>
          <![endif]-->
          <div class="two-to-three" style='width:100%;max-width:200px;display:inline-block;vertical-align:top;direction:ltr;'>
          <table class="two-to-three" border='0' cellpadding='0' cellspacing='0' align='right' style='table-layout: fixed; border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt;'>
          <tbody>
          <tr>
          <td valign='middle' align='left' style="font-family: 'Poppins', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 18px; line-height: 30px; color: #ffffff; padding-top: 20px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;">
          <a href="#" style="text-decoration: none;">
          <img src="images/icons8-instagram-96.png" style="width: 32px; height: auto; max-width: 32px; min-width: 32px; border: none;" border="0" alt="Instagram"/>
          </a>&nbsp;
          <a href="#" style="text-decoration: none;">
          <img src="images/icons8-facebook-50.png" style="width: 32px; height: auto; max-width: 32px; min-width: 32px; border: none;" border="0" alt="Facebook"/>
          </a>&nbsp;
          <a href="#" style="text-decoration: none;">
          <img src="images/icons8-twitter-60.png" style="width: 32px; height: auto; max-width: 32px; min-width: 32px; border: none;" border="0" alt="Twitter"/>
          </a>
          </td>
          </tr>
          <tr>
          <td valign='middle' align='left' style="font-family: 'Poppins', 'Open Sans', Helvetica, Arial, Verdana, Trebuchet MS, sans-serif; font-size: 14px;line-height: 12px; color: #ffffff; padding-top: 20px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px;">
          <font size="3" color="#ffffff" style="color: #ffffff; font-size: 14px;line-height: 12px;">
          <b><a href="tel:(123) 456-789" style="color: #ffffff; text-decoration: none;">(123) 456-789</a></b><br/><br/>
          <a href="mailto:email@example.com" style="color: #ffffff;text-decoration: none;">email@example.com</a><br/><br/>
          <b><a href="https://www.staywo.com" style="color: #ffffff;text-decoration: none;">www.staywo.com</a></b>
          </font>
          </td>
          </tr>
          </tbody>
          </table>
          </div>
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
          </td>
          </tr>
          </tbody>
          </table>
          
          </div>
          <!--[if gte mso 9]>
            </v:textbox>
          </v:rect>
          <![endif]-->
          </td>
          </tr>
          </tbody>
          </table>
          
          
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" class="contenttable" lang="x-content" width="600" style="border-collapse:collapse !important;max-width:500px;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;" >
          <tbody>
          <tr>
          <td align="center" style="padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px; font-size: 1px; color: transparent; height: 20px; line-height: 20px;" height="20">
          &nbsp;
          </td>
          </tr>
          </tbody>
          </table>
          
          <!--Gmail Font Size Fix Start-->
          <div style="display:none;white-space:nowrap;font-style:normal;font-variant:normal;font-weight:normal;font-size:15px;font-family:courier;line-height:normal;color:#eaeaea;" >
          - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          </div>
          <!--Gmail Font Size Fix End-->
          
          <!--BackgroundColor Fix End-->
          </td>
          </tr>
          </table>
          </div>
          
          </body>
          </html>
            <a href='${process.env.URL}:${process.env.PORT}/auth/email/verify/${repository.emailToken}'>Click here to activate your account</a>`,
        };
  
        return await this.sendEmail(mailOptions);
      } else {
        throw new HttpException('User not found', HttpStatus.FORBIDDEN);
      }
    }

    async sendPasswordResetEmail(email: string) {
      const repository = await this.emailVerificationRepository.findOne({
        email,
      });
  
      if (repository && repository.emailToken) {
        const mailOptions = {
          from: '"Company" <' + process.env.EMAIL_USER + '>',
          to: email,
          subject: 'Password Reset Link',
          text: 'Verify Email',
          html: `Hi! <br><br> Thanks for your cooperation.<br><br>
            <a href='${process.env.URL}:${process.env.PORT}/auth/email/verify/${repository.emailToken}'>Click here to reset your account password</a>`,
        };
  
        return await this.sendEmail(mailOptions);
      } else {
        throw new HttpException('User not found', HttpStatus.FORBIDDEN);
      }
    }

  
    async sendEmail(mailOptions) {
      return await new Promise<{}>(async (resolve, reject) => {
        return await transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            Logger.log(
              `Error while sending message: ${error}`,
              'sendEmailVerification',
            );
            return reject(error);
          }
          Logger.log(`Send message: ${info.messageId}`, 'sendEmailVerification');
          resolve({ message: 'Successfully send email' });
        });
      });
    }
  }