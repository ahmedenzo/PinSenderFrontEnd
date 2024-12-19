import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation, inject, ViewChild, ElementRef } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FuseAlertComponent, FuseAlertService } from '@fuse/components/alert';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BankServiceService } from 'app/core/services/bank-service.service'; 
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { FuseConfirmationService } from '@fuse/services/confirmation';
export function passwordComplexityValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const password = control.value;

        // Regular expression for password validation
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Validate the password
        const valid = passwordPattern.test(password);
        return valid ? null : { passwordComplexity: true };
    };
}


@Component({
    selector       : 'settings-account',
    templateUrl    : './account.component.html',
    styleUrls: ['./account.component.css'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatTooltipModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatTableModule,
        MatButtonModule,
        MatExpansionModule,
        FuseAlertComponent,
        CommonModule,
        MatSlideToggleModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsAccountComponent implements OnInit {
    private _fuseAlertService = inject(FuseAlertService);
    private _bankService = inject(BankServiceService);  

@ViewChild('accountFormRef') accountFormRef!: ElementRef;



    accountForm: UntypedFormGroup;
    adminForm: UntypedFormGroup;
    AssoAdminForm: UntypedFormGroup;
    logoPreview: string | ArrayBuffer | null = null;

    logoFile: File | null = null; // Store the logo file
    errorMessage: string | null = null; //
    successMessage: string | null = null;
    errorMessageu: string | null = null; //
    successMessageu: string | null = null;
    errorMessagea: string | null = null; //
    successMessagea: string | null = null;
    successMessageadmin: string | null = null;
    errorMessageadmin: string | null = null;
    showPassword: boolean = false; // Add this line
    isEditMode: boolean = false; // Flag to check if we are in edit mode
    selectedBankId: any; // To keep track of which bank is being edited
    selectedBank:any;
    banks: any[] = [];   
    admins : any [] =[]
    private _fuseConfirmationService = inject(FuseConfirmationService);

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.accountForm = this._formBuilder.group({
            name: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]], // Only characters allowed
            bankCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]], // Only 5 digits allowed
            libelleBanque: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z\s]+$/)]], // Max 50 characters, alphabet and spaces allowed
            enseigneBanque: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Za-z\s]+$/)]], // Max 10 characters, alphabet and spaces allowed
            banqueEtrangere: [false],
            logo: [null]
        });
        
        

        this.adminForm = this._formBuilder.group({
            username: ['', Validators.required],
            password: ['',passwordComplexityValidator()],
            email: ['', Validators.email],
            phoneNumber: [''], // Removed Validators.required to make it optional
            
          
        });

        this.AssoAdminForm = this._formBuilder.group({
            AdminId: ['', Validators.required],
            bankId: ['', Validators.required],
            
        });
        this.autoUppercaseFields(['name', 'libelleBanque', 'enseigneBanque']);
        this.loadBanks()
        this.getadmins()
    }

    autoUppercaseFields(fields: string[]): void {
        fields.forEach(field => {
            this.accountForm.get(field)?.valueChanges.subscribe(value => {
                if (value) {
                    this.accountForm.get(field)?.setValue(value.toUpperCase(), { emitEvent: false });
                }
            });
        });
    }
    get f() {
        return this.accountForm.controls;
    }

    onEdit(bank: any) {
        // Patch form values with bank details
        this.accountForm.patchValue({
            name: bank.name,
            bankCode: bank.bankCode,
            libelleBanque: bank.libelleBanque,
            enseigneBanque: bank.enseigneBanque,
            banqueEtrangere: bank.banqueEtrangere,
        });
    
        // Set selected bank ID and logo content
        this.selectedBankId = bank.id;
        this.selectedBank = bank.logoContent; // Ensure we're using logoContent as base64
    
        // Preview the logo if it exists
        this.isEditMode = true;
        this.logoPreview = this.selectedBank ? `data:image/png;base64,${this.selectedBank}` : null;
        this.scrollToForm();
        console.log('logo', this.logoPreview);
    }
    
    onFileSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files[0];
    
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                this.logoPreview = reader.result; // Show preview
                this.logoFile = file;  // Store file for upload
                this.cdr.markForCheck();
            };
            reader.readAsDataURL(file);
            this.accountForm.patchValue({ logo: file });
        }
    }
    
    onUpdate(): void {
        if (this.accountForm.valid) {
            const formData = new FormData();
            const bankRequest = { ...this.accountForm.value };
            delete bankRequest.logo; // Remove logo from bankRequest as it is handled separately
    
            formData.append('bankRequest', JSON.stringify(bankRequest));
    
            // Check if a new logo file was selected
            if (this.logoFile) {
                formData.append('logo', this.logoFile);
            } else if (this.selectedBank) {
                // If no new file, use existing logoContent as Blob
                const existingLogoBlob = this.base64ToBlob(this.selectedBank, 'image/png');
                formData.append('logo', existingLogoBlob, 'existing-logo.png');
            }
    
            if (this.selectedBankId) {
                // Optionally disable the form to prevent multiple submissions
                this.accountForm.disable();
    
                this._bankService.updateBank(this.selectedBankId, formData).subscribe({
                    next: (response) => {
                        this.successMessageu = 'Bank updated successfully!';
                        this.cdr.markForCheck();
                        this.errorMessageu = null;
    
                        // Reset the form and other states
                        this.accountForm.reset();
                        this.logoPreview = null;
                        this.logoFile = null;
                        this.isEditMode = false;
                        this.selectedBankId = null;
    
                        // Load banks and admins
                        this.loadBanks();
                        this.getadmins();
    
                        // Set success message timeout
                        setTimeout(() => {
                            this.successMessageu = null;
                            // Optionally re-enable the form
                            this.accountForm.enable();
                        }, 2000); // Adjust duration as needed
                    },
                    error: (error) => {
                        console.error('Error updating bank:', error); // Log error for debugging
                        this.errorMessageu = 'Failed to update bank. Please try again.';
                        this.cdr.markForCheck();
                        this.successMessageu = null;
    
                        // Set error message timeout
                        setTimeout(() => {
                            this.errorMessageu = null;
                            // Optionally re-enable the form
                            this.accountForm.enable();
                        }, 2000); // Adjust duration as needed
                    }
                });
            } else {
                this.errorMessageu = 'No bank selected for update';
                this.cdr.markForCheck();
            }
        } else {
            this.errorMessageu = 'Form is invalid';
            this.cdr.markForCheck();
        }
    }
    
    

    base64ToBlob(base64: string, type: string): Blob {
        const byteCharacters = atob(base64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        return new Blob([byteNumbers], { type });
    }


    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword; 
    }
    displayedColumns: string[] = ['logo','name', 'bank_code','BankAdmin' ,'actions'];
    
    loadBanks(): void {
        this._bankService.getAllBanks().subscribe({
            next: (response) => {
                if (response && response.banks && Array.isArray(response.banks)) {
                    this.banks = [...response.banks];  
                    this.cdr.detectChanges();  
                }
            },
            error: (error) => {
                console.error('Error fetching banks:', error);
            }
        });
    }
    
    scrollToForm() {
        this.accountFormRef.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }



    getadmins(): void {
        this._bankService.GetAdmins().subscribe({
            next: (response) => {
                console.log('Fetched Admins data:', response);
            
                if (Array.isArray(response) && response.length > 0) {
                    // Add 'logoPreview' to each admin object with the base64 format
                    this.admins = response.map(admin => ({
                        ...admin,
                        logoPreview: admin.logoContent ? `data:image/png;base64,${admin.logoContent}` : null
                    }));
                    console.log('Admins data with logo preview:', this.admins);
                    this.cdr.detectChanges(); 
                } else {
                    console.warn('No valid admins data found. Response structure:', response);
                }
            },
            error: (error) => {
                console.error('Error fetching admins:', error);
            }
        });
    }
    
    

    onSave(): void {
        if (this.accountForm.valid && this.logoFile) {
            const formData = new FormData();
            const bankRequest = { ...this.accountForm.value };
            delete bankRequest.logo;
    
            formData.append('bankRequest', JSON.stringify(bankRequest));
            formData.append('logo', this.logoFile);
    
            this._bankService.createBank(formData).subscribe({
                next: (response) => {
                    console.log('Bank created successfully:', response);
                    this.successMessage = 'Bank created successfully!';
                    this.errorMessage = null;
                    this.accountForm.reset();
                    this.cdr.markForCheck();
                    this.logoPreview = null;
                    this.logoFile = null;
                    this.loadBanks();
                    this.getadmins();
                  
    
                    setTimeout(() => {
                        this.successMessage = null;
                        this.cdr.markForCheck();
                    }, 1000);
                },
                error: (error) => {
                    this.errorMessage = error.message || 'Error occurred while creating Bin';
    
                    console.error('Failed to create bank:', error);
                    this.successMessage = null;
                    this.cdr.markForCheck();
                    
                    setTimeout(() => {
                        this.errorMessage = null;
                        this.cdr.markForCheck();
                    }, 1000);
                }
            });
        } else {
            console.error('Form is invalid or logo file is missing');
            this.errorMessage = 'Form is invalid or logo file is missing';
            setTimeout(() => {
                this.errorMessage = null;
                this.cdr.markForCheck();
            }, 4000);
        }
    }
    
    generatePassword() {
        const length = 12; // Ensure length is >= 8
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const specialChars = "@$!%*?&";  // Use only allowed special characters
        const allChars = lowercase + uppercase + numbers + specialChars;
    
        // Ensure at least one of each required character type
        let password = '';
        password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
        password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
        password += numbers.charAt(Math.floor(Math.random() * numbers.length));
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
        // Generate the remaining characters from the complete character set
        for (let i = 4; i < length; i++) {
          password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }
    
        // Shuffle the password to avoid a predictable pattern
        password = this.shufflePassword(password);
    
        // Set the generated password to the form control
        this.adminForm.get('password')?.setValue(password);
      }
    
      // Utility function to shuffle the password characters
      shufflePassword(password: string): string {
        return password
          .split('')
          .sort(() => 0.5 - Math.random())
          .join('');
      }
    
      associateAdmin(): void {
        if (this.AssoAdminForm.valid) {
            // Get the selected admin and bank IDs
            const adminId = this.AssoAdminForm.get('AdminId')?.value;
            const bankId = this.AssoAdminForm.get('bankId')?.value;
    
            // Find the admin and bank names based on the selected IDs
            const selectedAdmin = this.admins.find(admin => admin.id === adminId);
            const selectedBank = this.banks.find(bank => bank.id === bankId);
    
            // Get names from the selected admin and bank
            const adminName = selectedAdmin ? selectedAdmin.username : 'Unknown Admin';
            const bankName = selectedBank ? selectedBank.name : 'Unknown Bank';
    
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title: 'Association Confirmation',
                message: 
                    `You are about to associate Admin: ${adminName}.\n` + 
                    `With Bank: ${bankName}.\n` + 
                    `Are you sure you want to confirm?`,
                icon: {
                    show: true,
                    name: 'link',
                    color: 'primary'
                },
                actions: {
                    confirm: {
                        show: true,
                        label: 'Confirm',
                        color: 'primary'
                    },
                    cancel: {
                        show: true,
                        label: 'Cancel'
                    }
                },
                dismissible: true
            });
    
            // Subscribe to the afterClosed observable to get the user's decision
            confirmation.afterClosed().subscribe((result) => {
                if (result === 'confirmed') {
                    // Proceed with associating admin to bank if confirmed
                    this._bankService.associateAdminToBank(adminId, bankId).subscribe({
                        next: (response) => {
                            console.log('Admin associated to bank successfully:', response);
                            this.successMessagea = 'Admin associated to bank successfully!';
                            this.errorMessagea = null;
                            this.AssoAdminForm.reset();
                            this.cdr.markForCheck();
                            this.loadBanks();
                            this.getadmins();
    
                            setTimeout(() => {
                                this.successMessagea = null;
                                this.cdr.markForCheck();
                            }, 4000);
                        },
                        error: (error) => {
                            console.error('Failed to associate admin to bank:', error);
                        
                            // Check for specific error message structure
                            if (error.error && error.error.message) {
                                // Use the specific error message from the server if it exists
                                this.errorMessagea = error.error.message;
                            } else if (error.message) {
                                // Check if error has a message property directly
                                this.errorMessagea = error.message;
                            } else {
                                // Fallback to a generic message if none is available
                                this.errorMessagea = 'Failed to associate admin to bank';
                            }
                            
                            this.successMessagea = null;
                            this.cdr.markForCheck();
    
                            setTimeout(() => {
                                this.errorMessagea = null;
                                this.cdr.markForCheck();
                            }, 4000);
                        }
                    });
                } else {
                    // User cancelled the association
                    console.log('Association cancelled');
                }
            });
        }
    }
    
    
    
    

    refreshPage(): void {
        window.location.reload();
    }
    
    registerAdmin(): void {
        if (this.adminForm.valid) {
           
            const user = this.adminForm.value;
    
          
            user.role = ['admin']; 
    
            this._bankService.registerAdmin(user).subscribe({
                next: (response) => {
                    console.log('Admin registered successfully:', response);
                    this.successMessageadmin = 'Admin registered successfully!';
                    this.errorMessageadmin = null;  
                    this.adminForm.reset();  
                    this.cdr.markForCheck();
                    this.loadBanks()
                    this.getadmins()
    
                    setTimeout(() => {
                        this.successMessageadmin = null;
                        this.cdr.markForCheck();
                    }, 4000);
                },
                error: (error) => {
                    console.error('Failed to register admin:', error);
                    
                    // Extract the specific error message from the response
                    if (error.error && error.error.message) {
                        this.errorMessageadmin = error.error.message; // Display the exact error message
                    } else {
                        this.errorMessageadmin = 'Failed to register admin'; // Fallback message
                    }
                    this.successMessageadmin = null;  
                    this.cdr.markForCheck();
                    setTimeout(() => {
                        this.errorMessageadmin = null;
                        this.cdr.markForCheck();
                    }, 4000);
                }
            });
        }
    }
    
    onCancel(): void {
        this.accountForm.reset(); 
        this.logoPreview = null; 
        this.logoFile = null; 
        this.cdr.markForCheck(); 
        this.isEditMode = false; 
    }
    onCanceladmin(): void {
        this.adminForm.reset(); 
        this.cdr.markForCheck(); 
    }
    onCancelass(): void {
        this.AssoAdminForm.reset(); 
        this.cdr.markForCheck(); 
    }
    showAlert(): void {
        this._fuseAlertService.show('myAlertName'); 
    }

    dismissAlert(): void {
        this._fuseAlertService.dismiss('myAlertName'); 
    }

  
}
