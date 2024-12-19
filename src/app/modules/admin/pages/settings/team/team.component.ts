import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // <-- Add this import
import { BankServiceService } from 'app/core/services/bank-service.service';
import { AuthService } from 'app/core/auth/auth.service';
@Component({
    selector       : 'settings-team',
    templateUrl    : './team.component.html',
    styleUrls: ['./team.component.css'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule, NgFor, NgIf, MatSelectModule, MatOptionModule, TitleCasePipe, MatSlideToggleModule], // <-- Add MatSlideToggleModule here
})
export class SettingsTeamComponent implements OnInit
{
    private _bankService = inject(BankServiceService);
    private _auth = inject(AuthService);
    
    admins : any [] = [];

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        this.getadmins();
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
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

    toggleActive(member: any): void {
        const newStatus = !member.status; // Toggle the active state
        member.status = newStatus; // Update the local status immediately
        console.log(`Toggling status for user ${member.username} to ${newStatus ? 'active' : 'inactive'}.`);

        // Call the backend to persist the change
        this._auth.deactivateUser(member.id).subscribe({
            next: () => {
                console.log(`User ${member.username} status updated to ${newStatus ? 'active' : 'inactive'}.`);
            },
            error: (error) => {
                console.error(`Error updating status for user ${member.username}:`, error);
                // Revert the change locally if there was an error
                member.status = !newStatus;
                this.cdr.detectChanges();
            }
        });
    }
}