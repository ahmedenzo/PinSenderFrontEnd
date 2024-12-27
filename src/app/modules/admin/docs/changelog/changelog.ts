/* eslint-disable max-len */
import { ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Component, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgClass, CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CardNumberFormatDirective } from './card-number-format.directive';
import { NgOtpInputModule } from 'ng-otp-input';
import { CrudService } from './crud.service';
import { OtpInputDirective } from './otp-input.directive';
import { AlertComponent } from '../alert/alert/alert.component';
import { FuseAlertComponent, FuseAlertService } from '@fuse/components/alert';

import { interval, Subscription, take } from 'rxjs';
import { MessageResponse } from './MessageResponse';




@Component({
    selector       : 'changelog',
    templateUrl    : './changelog.html',
    styleUrls: ['./crud.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports: [
        CommonModule,
        MatIconModule,
        FormsModule,
        MatFormFieldModule,
        NgClass,
        CardNumberFormatDirective,
        MatInputModule,
        TextFieldModule,
        ReactiveFormsModule,
        MatButtonToggleModule,
        NgOtpInputModule,
        MatButtonModule,
        MatSelectModule,
        MatOptionModule,
        MatChipsModule,
        MatDatepickerModule,
        OtpInputDirective,
        FuseAlertComponent,
        AlertComponent,
      ],

      
})
export class ChangelogComponent
{
  private _fuseAlertService = inject(FuseAlertService);
    firstFormGroup: FormGroup;
    otpFormGroup: FormGroup;
    otpSent = false;
    verificationSubscription: Subscription | null = null;
    errorMessage: string | null = null; //
    successMessage: string | null = null;
    errorMessage1: string | null = null; //
    successMessage1: string | null = null;
    errorMessage2: string | null = null; //
    successMessage2: string | null = null;
    gsm: string = '';
    card: string = '';
    showSnackbar = false;
    isSuccess = false;
    snackbarMessage = '';
    otpVerified = false;
    countend: boolean = false;
    verificationStatus: string | null = null;
    isResendEnabled = false;
    hasResentOnce = false;  
    countdown: number = 90;
    countdownSubscription: Subscription | null = null;
    alertType: 'success' | 'warning' | 'error' = 'success';
    alertMessage = '';
    currentYear: number = new Date().getFullYear() % 100; 
  
    months = [
      { value: '01', viewValue: '01' },
      { value: '02', viewValue: '02' },
      { value: '03', viewValue: '03' },
      { value: '04', viewValue: '04' },
      { value: '05', viewValue: '05' },
      { value: '06', viewValue: '06' },
      { value: '07', viewValue: '07' },
      { value: '08', viewValue: '08' },
      { value: '09', viewValue: '09' },
      { value: '10', viewValue: '10' },
      { value: '11', viewValue: '11' },
      { value: '12', viewValue: '12' },
    ];
   
    years = Array.from({ length: 10 }, (_, i) => {
      const year = (this.currentYear + i).toString().padStart(2, '0');
      return { value: year, viewValue: `20${year}` };
    });
    constructor(
      private _formBuilder: FormBuilder,
      private crudService: CrudService,
      private cdr: ChangeDetectorRef
    ) {
      this.firstFormGroup = this._formBuilder.group({
        cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
        nationalId: ['', [Validators.required, this.nationalIdValidator()]],  // Custom validator
        gsm: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
        finalDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      });
  
      this.otpFormGroup = this._formBuilder.group({
        otp1: ['', [Validators.required, Validators.maxLength(1)]],
        otp2: ['', [Validators.required, Validators.maxLength(1)]],
        otp3: ['', [Validators.required, Validators.maxLength(1)]],
        otp4: ['', [Validators.required, Validators.maxLength(1)]],
        otp5: ['', [Validators.required, Validators.maxLength(1)]],
        otp6: ['', [Validators.required, Validators.maxLength(1)]],

      });
      this.cdr.markForCheck();
    }
    nationalIdValidator(): ValidatorFn {
      return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
          return { required: true };
        }
  
        const cinPattern = /^\d{8}$/;  // CIN pattern: 8 digits
        const passportPattern = /^[A-Za-z0-9]{6,9}$/;  // Passport pattern: 6-9 alphanumeric
  
        // Check if the value matches either the CIN or Passport pattern
        if (cinPattern.test(control.value) || passportPattern.test(control.value)) {
          return null;  // Valid
        }
  
        return { pattern: true };  // Invalid
      };
    }
    cardNumberValidator(control: AbstractControl): { [key: string]: any } | null {
      const value = control.value ? control.value.replace(/\D/g, '') : '';
      if (!value) {
        return { 'required': true };
      }
      if (value.length !== 16 || !this.isValidCardNumber(value)) {
        return { 'pattern': true };
      }
      return null;
    }
  
    private isValidCardNumber(cardNumber: string): boolean {
      let sum = 0;
      let shouldDouble = false;
  
      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
  
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
  
        sum += digit;
        shouldDouble = !shouldDouble;
      }
  
      return (sum % 10 === 0);
    }
    formatExpiration(event: any) {
      const input = event.target;
      let value = input.value.replace(/\D/g, ''); // Remove non-digit characters
    
      if (value.length > 4) {
        value = value.slice(0, 4); // Limit to 4 digits
      }
    
      if (value.length <= 2) {
        input.value = value;
      } else {
        input.value = `${value.slice(0, 2)}/${value.slice(2)}`;
      }

      this.firstFormGroup.get('finalDate')?.setValue(input.value, { emitEvent: false });
    

      this.validateExpiration(value);
    }
    
    validateExpiration(value: string) {
      const month = parseInt(value.slice(0, 2), 10);
      const year = parseInt(value.slice(2, 4), 10);
    
      // Get the current year in two-digit format (e.g., 24 for 2024)
      const currentYear = new Date().getFullYear() % 100;
    
      if (month < 1 || month > 12) {
        this.firstFormGroup.get('finalDate')?.setErrors({ invalidMonth: true });
      } else if (year < currentYear) {
        this.firstFormGroup.get('finalDate')?.setErrors({ invalidYear: true });
      } else {
        this.firstFormGroup.get('finalDate')?.setErrors(null);
      }
    }

    verifyCardholder(): void {
      if (this.firstFormGroup.valid) {
          const { cardNumber, nationalId, gsm, finalDate } = this.firstFormGroup.value;
          const formattedExpiration = finalDate.replace('/', '');
          this.gsm = '00216' + gsm;
          this.card = cardNumber; // Assign cardNumber to this.card
       
          // Send the cardholder verification request
          this.crudService.verifyCardholder(cardNumber, nationalId, this.gsm, formattedExpiration).subscribe(
              (response) => {
                  console.log('Verification initiated:', response);
  
                  // Clear any existing alerts
                  this.successMessage = null;
                  this.errorMessage = null;
  
                  this.successMessage = 'Verification initiated successfully. Waiting for status...';
  
                  // Automatically hide the alert after 3 seconds
                  setTimeout(() => {
                      this.successMessage = null;
                      this.cdr.markForCheck(); // Trigger change detection
                  }, 3000);
  
                  // DO NOT set otpSent to true yet, only after WebSocket confirmation
                  // Subscribe to WebSocket for status updates
                  this.verificationSubscription = this.crudService.getVerificationStatusUpdates()
                      .subscribe(status => {
                          if (status) {
                              // Clear any previous messages when new status is received
                              this.successMessage = null;
                              this.errorMessage = null;
  
                              // Show the real-time verification status from WebSocket
                              this.verificationStatus = status.message;
                              console.log('Received verification status:', status);
  
                              // Show the status in an alert or some UI element
                              if (status.message === 'OTP sent successfully to Cardholder phone') {
                                  this.successMessage = `Verification : ${status.message}`;
                                  this.startCountdown();
                               
                                  this.isResendEnabled = true;
                                  this.otpSent = true;  // Move to OTP form only if successful
                              } else {
                                  // Show failure message
                                  this.errorMessage = `Verification : ${status.message}`;
                                  this.otpSent = false;
                                  this.otpVerified=false
                              }
  
                              // Automatically hide the alert after 3 seconds
                              setTimeout(() => {
                                  this.successMessage = null;
                                  this.errorMessage = null;
                                  this.cdr.markForCheck(); // Trigger change detection
                              }, 5000);
  
                              this.cdr.markForCheck(); // Trigger change detection
                          }
                      });
  
                  this.cdr.markForCheck();
              },
              (error) => {
                  console.error('Verification :', error.error.message);
  
                  // Clear any existing alerts
                  this.successMessage = null;
                  this.errorMessage = 'Failed to initiate verification: Check Information';
  
                  // Automatically hide the alert after 3 seconds
                  setTimeout(() => {
                      this.errorMessage = null;
                      this.cdr.markForCheck(); // Trigger change detection
                  }, 3000);
  
                  this.otpSent = false;
                  this.cdr.markForCheck();
              }
          );
      }
  }
  
  
  

    // Cleanup WebSocket subscription
    ngOnDestroy(): void {
      this.clearCountdown();
      this.otpSent = false;
      this.otpVerified= false;
      if (this.verificationSubscription) {
          this.verificationSubscription.unsubscribe();
      }
  }
    
  verifyOtp(): void {
    if (this.otpFormGroup.valid) {
      const otp = Object.values(this.otpFormGroup.value).join('');
      this.crudService.validateOtp(this.gsm, otp, this.card).subscribe(
        (response: MessageResponse) => {
          if (response.message === 'Phone number validated successfully.') {
            this.successMessage1 = response.message;    
            this.otpVerified = true;
            this.isResendEnabled = false; 
            this.clearCountdown();
            this.resetToCardholderForm(true);
            setTimeout(() => {
              this.successMessage1 = null; 
              this.cdr.markForCheck();
            }, 2000);
          } else {
            this.handleOtpFailure(response.message);
          }
          this.cdr.markForCheck();
        },
        () => {
          this.handleOtpFailure('OTP validation failed. Please try again.');
          this.cdr.markForCheck();
        }
      );
    }
  }


  resendOtp(): void {
    if (!this.hasResentOnce) { // Allow only one resend
        this.hasResentOnce = true;
        this.isResendEnabled = false;
  
        this.crudService.resendOtp(this.gsm).subscribe(
            () => {
                console.log('OTP resent successfully');
                this.successMessage2 = 'OTP resent successfully. Please check your phone.';
                this.startCountdown(); 
                this.cdr.markForCheck();
  
               
                setTimeout(() => {
                    this.successMessage2 = null;
                    this.cdr.markForCheck();
                }, 2000); 
            },
            (error) => {
                console.error('Failed to resend OTP:', error);
                this.errorMessage2 = 'Failed to resend OTP. Returning to cardholder form.';
                this.resetToCardholderForm();
         
                this.cdr.markForCheck();
            }
        );
    } else {
        this.errorMessage2 = 'Resend OTP can only be attempted once.';
        setTimeout(() => {
            this.errorMessage = null;
            this.cdr.markForCheck();
        }, 2000); // 4000ms = 4 seconds
    }
  }
  


handleOtpFailure(errorMessage: string): void {
  this.errorMessage1 = errorMessage;
  this.successMessage = null;
  this.otpFormGroup.reset();

  // Enable resend button if countdown has ended and no resend attempt has been made
  this.isResendEnabled = this.countdown === 0 && !this.hasResentOnce;

  // Clear error message after 4 seconds
  setTimeout(() => {
      this.errorMessage1 = null;
      this.cdr.markForCheck();
  }, 2000);

  this.cdr.markForCheck();
}




private resetToCardholderForm(resetOtpState: boolean = false): void {
  this.otpSent = false;
  this.isResendEnabled = true;
  this.countdown = 0;
  this.otpVerified = false;
  this.hasResentOnce = false;

  console.log(this.otpSent)
  // Clear OTP state if specified
  if (resetOtpState) {
     
  }
  console.log(this.otpVerified)
  // Display the message for 2 seconds before clearing the form
 this.resetOtpForm();
  this.cdr.markForCheck();

  setTimeout(() => {
      // Clear the error message and reset the cardholder form
      this.errorMessage = null;
      this.clearCardholderForm(); // Ensure you clear the form
      this.cdr.markForCheck();
  }, 3000); // Display message for 2 seconds

  this.clearCountdown();
  this.cdr.markForCheck();
}




private clearCardholderForm(): void {
  // Reset cardholder form fields
  this.firstFormGroup.reset();
}




clearCountdown(): void {
  if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
  }
  this.countdown = 90;
}

    cancelOtp(): void {
      this.otpSent = false; 
      this.otpVerified = false;
      this.resetOtpForm()
      this.resetCardholderForm();
    }
    resetCardholderForm(): void {
      // Reset cardholder form fields
      this.firstFormGroup.reset();
    }
    resetOtpForm(): void {
      // Reset OTP form fields
      this.otpFormGroup.reset();
    }
    showAlert(): void {
      this._fuseAlertService.show('myAlertName'); 
  }

  dismissAlert(): void {
      this._fuseAlertService.dismiss('myAlertName'); 
  }



  private startCountdown(): void {
    
    this.clearCountdown();
    this.countdown = 90;
    this.countend = false;
    this.countdownSubscription = interval(1000).pipe(take(90)).subscribe({
        next: () => {
            this.countdown--;
            this.cdr.markForCheck();
        },
        complete: () => {
          this.countend = true;
            // Only reset if the user has already attempted a resend and OTP is still not verified
            if (this.hasResentOnce && !this.otpVerified) {
                this.errorMessage2 = 'Maximum attempts reached.';
                this.resetToCardholderForm();
                this.resetOtpForm();
                setTimeout(() => {
                  this.errorMessage2 = null;
                  this.cdr.markForCheck();
              }, 2000);
            }
            this.cdr.markForCheck();
        },
    });
}


 
  }

  