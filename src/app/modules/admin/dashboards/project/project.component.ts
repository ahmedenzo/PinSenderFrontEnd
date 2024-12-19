import { CurrencyPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { ProjectService } from 'app/modules/admin/dashboards/project/project.service';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatPaginatorModule,MatPaginator} from '@angular/material/paginator';
import { ApiRequestLog } from 'app/core/Model/ApiRequestLog.model';
import { TrackingService } from 'app/core/services/tracking.service';
import { CommonModule } from '@angular/common';
import { UserService } from 'app/core/user/user.service';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

import { MatSort, MatSortModule } from '@angular/material/sort';

import { DecimalPipe } from '@angular/common';

import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
export interface PeriodicElement {

    requestBody?: string;   
    responseBody?: string;  
}


interface BudgetDetail {
    bank: string;
    totalPinSend: number;
    totalOtpSend: number;
    averageOtpSend: number;
    averagePinSend: number;
  }
  
  interface BudgetDetailAdmin {
    agency: string;
    totalPinSend: number;
    totalOtpSend: number;
    averageOtpSend: number;
    averagePinSend: number;
  }

@Component({
    selector       : 'project',
    templateUrl    : './project.component.html',
    styleUrl: './project.css.component.scss',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('detailExpand', [
          state('collapsed,void', style({height: '0px', minHeight: '0'})),
          state('expanded', style({height: '*'})),
          transition('expanded <=> collapsed', animate('100ms cubic-bezier(0.6, 0.0, 0.8, 1)')),
        ]),
      ],
    standalone     : true,
    imports        : [     MatDatepickerModule,    MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatNativeDateModule,TranslocoModule,DatePipe,CommonModule, MatIconModule, MatButtonModule, MatRippleModule, MatMenuModule, MatTabsModule, MatButtonToggleModule, NgApexchartsModule, NgFor, NgIf, MatTableModule, NgClass, CurrencyPipe,MatPaginatorModule],
        providers: [DecimalPipe], 
})
export class ProjectComponent implements OnInit, OnDestroy
{
    paginatorAdminInitialized = false;
    paginatorAdmineInitialized = false;
    pageSizee = 10;  // Default page size
    pageIndex = 0;  // Default page index
    pageSizeee = 10;  // Default page size
    filteredbank = [];
    filteredagent = [];
    sortOrder: 'pins' | 'otps' | null = null;
    isDescending: boolean = true;
    pageSize = 50; // Default page size
    totalLogs = 0; // Total number of logs
    @ViewChild('paginator') paginator!: MatPaginator;
    @ViewChild('paginatoradmin') paginatoradmin!: MatPaginator;
    @ViewChild('paginatoradmine') paginatoradmine!: MatPaginator;




    private _trackingService = inject(TrackingService); 
    dataSourceBudgetDetails = new MatTableDataSource<BudgetDetail>();
    dataSourceBudgetDetailsAdmin = new MatTableDataSource<BudgetDetailAdmin>(); 
    
    private decimalPipe = inject(DecimalPipe);
    chartGithubIssues: ApexOptions = {};
    chartTaskDistribution: ApexOptions = {};
    chartBudgetDistribution: ApexOptions = {};
    chartWeeklyExpenses: ApexOptions = {};
    chartMonthlyExpenses: ApexOptions = {};
    chartYearlyExpenses: ApexOptions = {};
    data: any;;
    displayedColumns: string[] = ['bank', 'totalPinSend', 'totalOtpSend', 'averageOtpSend', 'averagePinSend'];
    dateControl = new FormControl(); 
    displayedColumnss: string[] = ['agency', 'totalPinSend', 'totalOtpSend', 'averageOtpSend', 'averagePinSend'];

    chartAgencyIssues: ApexOptions = {};
    dateValueAgency: Date | null = null;
    dateControlAgency = new FormControl();
    pinsByDate: [string, number][] = [];
    otpsByDate: [string, number][] = [];
    overallPinsAgent: number = 0;
    overallOtpsAgent: number = 0;
    todayPinsAgent: number = 0;
    todayOtpsAgent: number = 0;
    
    pinsByDateAgent: [string, number][] = [];
    otpsByDateAgent: [string, number][] = [];
    
    chartAgentIssues: ApexOptions = {};
    dateValueAgent: Date | null = null;
    dateControlAgent = new FormControl();
    // Data for the table (Banks, Total Pin Send, Total OTP Send, Remaining %)
    budgetDetails: Array<{
        bank: string;
        totalPinSend: number;
        totalOtpSend: number;
        averageOtpSend: number;
        averagePinSend: number;
    }> = [];
    
    budgetDetailsadmin: Array<{
        agency: string;
        totalPinSend: number;
        totalOtpSend: number;
        averageOtpSend: number;
        averagePinSend: number;
    }> = [];
    // Color map to store unique colors for each bank
    colorMap: { [key: string]: string } = {};

    // Generate a random color for a bank
    private generateRandomColor(): string {
        const colors = [
            'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-amber-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
            'bg-teal-500', 'bg-orange-500', 'bg-lime-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-rose-500', 'bg-gray-500',
            'bg-blue-700', 'bg-red-700', 'bg-green-700', 'bg-amber-700', 'bg-indigo-700', 'bg-purple-700'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    

    activeSessionCount:any
    averageResponseTime:any
    showDatePicker: boolean = false;  // Controls the visibility of the date picker
    selectedDate: Date | null = null; // Holds the selected date
    errorCount: number 
    activeSessions: any = [];
    logs: ApiRequestLog[] = [];
    columnsToDisplay: string[] = [
        'timestamp',
        'username',
        'sessionId',
        'requestPath',
        'method',
        'statusCode',
   
    ];
    isSuperAdmin: boolean = false;
    isAdmin: boolean = false;
    isUser: boolean = false;
    dataSource: MatTableDataSource<ApiRequestLog>;
    columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
    paginatorInitialized: boolean = false;
    filterUsername: string = '';
    filterDate: Date | null = null;
    expandedElement: PeriodicElement | null;
    selectedProject: string = 'ACME Corp. Backend App';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    overallPins: number = 0;
    overallOtps: number = 0;
    todayPins: number = 0; // To hold today's PIN count
    todayOtps: number = 0; // To hold today's OTP count

    overallPinsad: number = 0;
    overallOtpsad: number = 0;
    todayPinsad: number = 0; // To hold today's PIN count
    todayOtpsad: number = 0; // To hold today's OTP count

    dateValue: Date | null = null;
    bankId: number | null = null;
    agentId: string | null = null;
    /**
     * Constructor
     */
    constructor(
        private _projectService: ProjectService,
        private _router: Router,
        private cdr: ChangeDetectorRef ,
        private _userService: UserService,
        private _formBuilder: UntypedFormBuilder,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to the user service to get user roles and bank ID if admin
        this._userService.user$.subscribe(user => {
            if (user && user.roles) {
                // Determine roles
                this.isSuperAdmin = user.roles.includes('ROLE_SUPER_ADMIN');
                this.isAdmin = user.roles.includes('ROLE_ADMIN');
                this.isUser = user.roles.includes('ROLE_USER');
    
                // If the user is an Admin, fetch the bank ID
                if (this.isAdmin ) {
                    this.bankId = user.bankId;
                    console.log('Fetched Bank ID:', this.bankId);
               this.paginateadmin()
                    // Call method to fetch bank statistics using the bankId
                    this.loadBankStatistics(this.bankId);
                }

                if (this.isUser) {
                    this.agentId = user.id;
                    console.log('Fetched Agent ID:', this.agentId);
    
                    // Call method to fetch agent statistics using the agentId
                    this.loadAgentStatistics(this.agentId);
                }
    
                // Additional logic for Super Admin
                if (this.isSuperAdmin) {
                    this.loadErrorCount();
                    this.loadActiveSessions();
                    this.loadAverageResponseTime();
                    this.loadOverallStatistics(); 
                    this.getLogs(0, this.pageSize);
                    this.loadSevenDayStatistics();
                    this.paginatesuperadmin()
                }
                 
            
            }
            
        });

        // Get the data
        this._projectService.data$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((data) => {
            // Store the data
            this.data = data;
    
            // Extract last 7 days, pin data, and otp data from `data`
            const last7Days = this.getLast7Days();
            const pinData = last7Days.map((day) =>
                data.pinsGroupedByBankAndDate
                    .filter((item) => item[0] === day)
                    .reduce((sum, item) => sum + item[3], 0)
            );
    
            const otpData = last7Days.map((day) =>
                data.otpsGroupedByBankAndDate
                    .filter((item) => item[0] === day)
                    .reduce((sum, item) => sum + item[3], 0)
            );
    
            // Call _prepareChartData with the 3 required arguments
            this._prepareChartData(last7Days, pinData, otpData);
        });
    
      
        // Attach SVG fill fixer to all ApexCharts
        window['Apex'] = {
            chart: {
                events: {
                    mounted: (chart: any, options?: any): void =>
                    {
                        this._fixSvgFill(chart.el);
                    },
                    updated: (chart: any, options?: any): void =>
                    {
                        this._fixSvgFill(chart.el);
                    },
                },
            },
        };
      
 
     
    }

/**
 * Load bank statistics for the Admin role based on bankId
 */
loadBankStatistics(bankId: number): void {
  this._projectService.getStatisticsForBank(bankId).subscribe(
    response => {
      console.log('Bank statistics response:', response);

      // Set overall totals for this specific bank
      this.overallPinsad = response.totalPins;
      this.overallOtpsad = response.totalOtps;

      // Get yesterday's date in the format 'YYYY-MM-DD'
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      this.cdr.detectChanges();

      // Calculate yesterday's total PIN and OTP sends
      this.todayPinsad = response.pinsByDate
        .filter(item => item[0] === yesterdayDate)  // Filter by yesterday's date
        .reduce((sum, item) => sum + item[1], 0);   // Sum up the PIN counts for yesterday

      this.todayOtpsad = response.otpsByDate
        .filter(item => item[0] === yesterdayDate)  // Filter by yesterday's date
        .reduce((sum, item) => sum + item[1], 0);   // Sum up the OTP counts for yesterday

      console.log("Yesterday’s total Pins for Admin:", this.todayPinsad);
      console.log("Yesterday’s total OTPs for Admin:", this.todayOtpsad);

      // Process pins and OTPs grouped by branch (agency)
      const pinsByAgency = response.pinsByBranch;
      const otpsByAgency = response.otpsByBranch;

      // Store pinsByDate and otpsByDate for chart data
      this.pinsByDate = response.pinsByDate;
      this.otpsByDate = response.otpsByDate;

      // Load chart data for the last seven days
      this.loadChartDataForLastSevenDays();

      // Calculate total OTPs and PINs for all agencies for percentage calculations
      const totalOtps = otpsByAgency.reduce((sum, agency) => sum + agency[1], 0);
      const totalPins = pinsByAgency.reduce((sum, agency) => sum + agency[1], 0);

      // Create dynamic agency details array with colors for each unique agency
      this.budgetDetailsadmin = pinsByAgency.map((pinAgencyData) => {
        const agencyName = pinAgencyData[0];
        const totalPinSend = pinAgencyData[1];

        // Find matching OTP data for the same agency
        const otpData = otpsByAgency.find((otpAgencyData) => otpAgencyData[0] === agencyName);
        const totalOtpSend = otpData ? otpData[1] : 0;

        // Calculate average OTP and PIN percentages
        const averageOtpSend = totalOtps ? ((totalOtpSend / totalOtps) * 100).toFixed(2) : 0;
        const averagePinSend = totalPins ? ((totalPinSend / totalPins) * 100).toFixed(2) : 0;

        // Assign a color to each unique agency, if not already set
        if (!this.colorMap[agencyName]) {
          this.colorMap[agencyName] = this.generateRandomColor();
        }

        return {
          agency: agencyName,
          totalPinSend: totalPinSend,
          totalOtpSend: totalOtpSend,
          averageOtpSend: +averageOtpSend, // Convert to number
          averagePinSend: +averagePinSend  // Convert to number
        };
      });

      // Sort the agencies by totalPinSend in descending order
      this.budgetDetailsadmin.sort((a, b) => b.totalPinSend - a.totalPinSend);

      // Store the sorted array for pagination
      this.filteredagent = [...this.budgetDetailsadmin];

      // Paginate the sorted results
      this.paginateadmin();

      console.log("Sorted Agency Budget Details for Admin (Most OTPs First):", this.budgetDetailsadmin);
      console.log("Color Map:", this.colorMap);

      // Trigger change detection manually if using OnPush strategy
      this.cdr.markForCheck();
    },
    error => console.error("Error fetching bank statistics:", error)
  );
}



  onDateChangeAgency(event: any): void {
    this.dateValueAgency = new Date(Date.UTC(
      event.value.getFullYear(),
      event.value.getMonth(),
      event.value.getDate()
    ));
    const formattedDate = this.dateValueAgency.toISOString().split('T')[0];
    this.loadChartDataForDateAgency(formattedDate);
  }

  // Method to clear the date selection for Admin
  clearDateAgency(): void {
    this.dateValueAgency = null;
    this.dateControlAgency.reset();
    // Reload data for the last 7 days
    this.loadChartDataForLastSevenDays();
  }

  // Load chart data for a specific date for Admin
  loadChartDataForDateAgency(date: string): void {
    const pinItem = this.pinsByDate.find((item) => item[0] === date);
    const otpItem = this.otpsByDate.find((item) => item[0] === date);
    const pinData = [pinItem ? pinItem[1] : 0];
    const otpData = [otpItem ? otpItem[1] : 0];
    this._prepareAgencyChartData([date], pinData, otpData);
  }

  // Load chart data for the last seven days for Admin
  loadChartDataForLastSevenDays(): void {
    const last7Days = this.getLast7Days();
    const pinData = last7Days.map((day) => {
      const pinItem = this.pinsByDate.find((item) => item[0] === day);
      return pinItem ? pinItem[1] : 0;
    });
    const otpData = last7Days.map((day) => {
      const otpItem = this.otpsByDate.find((item) => item[0] === day);
      return otpItem ? otpItem[1] : 0;
    });
    this._prepareAgencyChartData(last7Days, pinData, otpData);
  }
  private _prepareAgencyChartData(dates: string[], pinData: number[], otpData: number[]): void {
    this.chartAgencyIssues = {
      chart: {
        type: 'line',
        height: '100%',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
        toolbar: {
          show: false,
        },
      },
      colors: ['#1E88E5', '#F4511E'],
      dataLabels: {
        enabled: true,
        background: {
          enabled: true,
          borderRadius: 2,
          dropShadow: {
            enabled: true,
          },
        },
        style: {
          colors: ['#1E88E5', '#F4511E'],
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      series: [
        {
          name: 'Pin',
          type: 'line',
          data: pinData,
        },
        {
          name: 'OTP',
          type: 'column',
          data: otpData,
        },
      ],
      xaxis: {
        categories: dates,
        labels: {
          style: {
            colors: '#9E9E9E',
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#9E9E9E',
            fontSize: '12px',
          },
          formatter: (val: number) => val.toLocaleString(),
        },
      },
      tooltip: {
        theme: 'dark',
        x: {
          show: true,
          formatter: (value) => `Date: ${value}`,
        },
        y: {
          formatter: (val: number) => val.toLocaleString(),
        },
        marker: {
          show: true,
        },
      },
      grid: {
        borderColor: '#E0E0E0',
        strokeDashArray: 4,
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        labels: {
          colors: '#424242',
        },
      },
    };
  }

  // Helper method to get the last 7 days in 'YYYY-MM-DD' format

  loadOverallStatistics(): void {
    this._projectService.getOverallStatistics().subscribe(response => {
        console.log('Overall statistics response:', response);

        // Set overall total values
        this.overallPins = response.overallPins;
        this.overallOtps = response.overallOtps;

        // Get today's date in the format 'YYYY-MM-DD'
      
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];
        // Calculate today's total PIN sends
        this.todayPins = response.pinsGroupedByBankAndDate
            .filter(item => item[0] === yesterdayDate)  // Filter by today's date
            .reduce((sum, item) => sum + item[3], 0);  // Sum up the PIN counts for today

        // Calculate today's total OTP sends
        this.todayOtps = response.otpsGroupedByBankAndDate
            .filter(item => item[0] === yesterdayDate)  // Filter by today's date
            .reduce((sum, item) => sum + item[3], 0);  // Sum up the OTP counts for today

        console.log('lastday’s total Pins:', this.todayPins);
        console.log('lastday’s total OTPs:', this.todayOtps);

        // Process pins and OTPs grouped by bank
        const pinsByBank = response.pinsGroupedByBank;
        const otpsByBank = response.otpsGroupedByBank;

        // Calculate total OTPs and PINs for all banks for average percentage calculations
        const totalOtps = otpsByBank.reduce((sum, bank) => sum + bank[2], 0);
        const totalPins = pinsByBank.reduce((sum, bank) => sum + bank[2], 0);

        // Create dynamic budgetDetails array with random colors for each unique bank
        this.budgetDetails = pinsByBank.map((pinBankData) => {
            const bankName = pinBankData[0];
            const bankId = pinBankData[1];
            const totalPinSend = pinBankData[2];

            // Find matching OTP data for the same bank
            const otpData = otpsByBank.find((otpBankData) => otpBankData[1] === bankId);
            const totalOtpSend = otpData ? otpData[2] : 0;

            // Calculate average OTP and PIN percentages
            const averageOtpSend = totalOtps ? ((totalOtpSend / totalOtps) * 100).toFixed(2) : 0;
            const averagePinSend = totalPins ? ((totalPinSend / totalPins) * 100).toFixed(2) : 0;

            // Assign a color to each unique bank, if not already set
            if (!this.colorMap[bankName]) {
                this.colorMap[bankName] = this.generateRandomColor();
            }

            return {
                bank: bankName,
                totalPinSend: totalPinSend,
                totalOtpSend: totalOtpSend,
                averageOtpSend: +averageOtpSend, // Convert to number
                averagePinSend: +averagePinSend  // Convert to number
            };
        });

        // Sort the budget details by the totalPinSend in descending order
        this.budgetDetails.sort((a, b) => b.totalPinSend - a.totalPinSend);

        // Set filteredbank after sorting
        this.filteredbank = [...this.budgetDetails];
        this.paginatesuperadmin();

        console.log('Dynamic Budget Details:', this.budgetDetails);
        console.log('Color Map:', this.colorMap);

        // Trigger change detection manually if using OnPush strategy
        this.cdr.markForCheck();
    });
}



    
    dateForm = new FormGroup({
        dateValue: new FormControl(null),
      });
      clearDate(): void {
        this.dateValue = null;
        this.dateControl.reset(); // Reset the date picker control
        this.loadSevenDayStatistics(); // Reload data for the last 7 days or default range
    }
      // Method to handle date change from the date picker
      onDateChange(event: any): void {
        // Ensure the selected date is in UTC
        this.dateValue = new Date(Date.UTC(
            event.value.getFullYear(),
            event.value.getMonth(),
            event.value.getDate()
        ));
        
        // Trigger the data update based on selected date
        const formattedDate = this.dateValue.toISOString().split('T')[0];
        this.loadChartDataForDate(formattedDate);
    }
    
    
    loadChartDataForDate(date: string): void {
        this._projectService.getOverallStatistics().subscribe((response) => {
            // Filter and sum data for the selected date
            const pinData = response.pinsGroupedByBankAndDate
                .filter((item) => item[0] === date)
                .reduce((sum, item) => sum + item[3], 0);
            
            const otpData = response.otpsGroupedByBankAndDate
                .filter((item) => item[0] === date)
                .reduce((sum, item) => sum + item[3], 0);
            
            // Prepare chart data
            this._prepareChartData([date], [pinData], [otpData]);
        });
    }
    
    loadErrorCount(): void {
        this._trackingService.getErrorCount().subscribe(
            (response: string) => {
                console.log('Raw response:', response); // Log the raw response
    
                // Use a regular expression to extract the number from the string
                const match = response.match(/(\d+)/); // This will match any sequence of digits
    
                if (match) {
                    this.errorCount = Number(match[0]); // Convert the matched string to a number
                } else {
                    console.error('No number found in response:', response);
                    this.errorCount = 0; // Handle the case where no number is found
                }
    
                console.log('Error count:', this.errorCount); // Log the final error count
            },
            (error) => {
                console.error('Error fetching error count:', error);
            }
        );
    }
    
    
    loadAverageResponseTime(): void {
        this._trackingService.getAverageResponseTime().subscribe(
            (response: string) => {
                console.log('Raw response:', response); // Log the raw response
    
                // Use a regular expression to extract the numeric part from the string
                const match = response.match(/(\d+(\.\d+)?)/); // Match digits, including decimal
    
                if (match) {
                    // Convert the matched string to a number and round to three decimal places
                    this.averageResponseTime = Number(match[0]).toFixed(3); // Keeps three decimal places
                } else {
                    console.error('No valid number found in response:', response);
                    this.averageResponseTime = '0.000'; // Handle the case where no number is found
                }
    
                console.log('Average Response Time:', this.averageResponseTime); // Log the final average response time
            },
            (error) => {
                console.error('Error fetching average response time:', error);
            }
        );
    }

      loadActiveSessions(): void {
        this._trackingService.getActiveSessions().subscribe(
          (response: any[]) => {  // Assuming the response is an array of active sessions
            this.activeSessions = response;
            this.activeSessionCount = this.activeSessions.length;  // Count the number of active sessions
            console.log('Active sessions:', this.activeSessions);
            console.log('Number of active sessions:', this.activeSessionCount);
          },
          (error) => {
            console.error('Error fetching active sessions:', error);
          }
        );
      }
      ngAfterViewInit(): void {
        this.paginatoradmin.page.subscribe(() => {
          this.pageIndex = this.paginatoradmin.pageIndex;
          this.pageSizee = this.paginatoradmin.pageSize;
          this.paginatesuperadmin()
        });
        this.paginator.page.subscribe(() => {
            this.pageIndex = this.paginator.pageIndex;
            this.pageSize = this.paginator.pageSize;
            this.paginatesuperadmin()
          });

          this.paginatoradmine.page.subscribe(() => {
            this.pageIndex = this.paginatoradmine.pageIndex;
            this.pageSizeee = this.paginatoradmine.pageSize;
           this.paginateadmin()
          });
      }

      ngAfterViewChecked() {
        // Initialize the first paginator only once
        if (this.paginator && !this.paginatorInitialized) {
          this.paginator.page.subscribe(() => {
            this.getLogs(this.paginator.pageIndex, this.paginator.pageSize);
      
          });
          this.paginatorInitialized = true;
        }
    
        // Initialize the second paginator (paginatoradmin) only once
        if (this.paginatoradmin && !this.paginatorAdminInitialized) {
          this.paginatoradmin.page.subscribe(() => {
            this.paginatorAdminInitialized = true;
          });
       
        }

        if (this.paginatoradmine && !this.paginatorAdminInitialized) {
            this.paginatoradmine.page.subscribe(() => {
                this.paginatorAdmineInitialized = true;
            });
            
          }
      }


    getLogs(page: number, size: number): void {
        this._trackingService.getAllLogs(page, size).subscribe(
            (response: any) => {
                // Directly use the logs from the backend without sorting on the frontend.
                this.logs = response.content; // Backend should already return sorted data (most recent first)
    
                this.totalLogs = response.totalElements; // Set the total number of logs
                this.dataSource = new MatTableDataSource<ApiRequestLog>(this.logs);
                this.dataSource.paginator = this.paginator; // Assign paginator
    
                this.cdr.markForCheck(); // Manually trigger change detection
            },
            (error) => {
                console.error('Error fetching logs:', error);
            }
        );
    }
    
    
    
    
    
    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Fix the SVG fill references. This fix must be applied to all ApexCharts
     * charts in order to fix 'black color on gradient fills on certain browsers'
     * issue caused by the '<base>' tag.
     *
     * Fix based on https://gist.github.com/Kamshak/c84cdc175209d1a30f711abd6a81d472
     *
     * @param element
     * @private
     */
    private _fixSvgFill(element: Element): void
    {
        // Current URL
        const currentURL = this._router.url;

        // 1. Find all elements with 'fill' attribute within the element
        // 2. Filter out the ones that doesn't have cross reference so we only left with the ones that use the 'url(#id)' syntax
        // 3. Insert the 'currentURL' at the front of the 'fill' attribute value
        Array.from(element.querySelectorAll('*[fill]'))
            .filter(el => el.getAttribute('fill').indexOf('url(') !== -1)
            .forEach((el) =>
            {
                const attrVal = el.getAttribute('fill');
                el.setAttribute('fill', `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`);
            });
    }

    /**
     * Prepare the chart data from the data
     *
     * @private
     */
    loadSevenDayStatistics(): void {
        this._projectService.getOverallStatistics().pipe(takeUntil(this._unsubscribeAll)).subscribe((response) => {
          const last7Days = this.getLast7Days();
          const pinData = [];
          const otpData = [];
    
          last7Days.forEach((day) => {
            const dayDataPin = response.pinsGroupedByBankAndDate
              .filter((item) => item[0] === day)
              .reduce((sum, item) => sum + item[3], 0);
            
            const dayDataOtp = response.otpsGroupedByBankAndDate
              .filter((item) => item[0] === day)
              .reduce((sum, item) => sum + item[3], 0);
    
            pinData.push(dayDataPin);
            otpData.push(dayDataOtp);
          });
    
          this._prepareChartData(last7Days, pinData, otpData);
          this.cdr.markForCheck();
        });
      }
      getLast7Days(): string[] {
        const dates = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }
    
    private _prepareChartData(dates: string[], pinData: number[], otpData: number[]): void {
        this.chartGithubIssues = {
            chart: {
                type: 'line',
                height: '100%',
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800,
                },
                toolbar: {
                    show: false,
                },
            },
            colors: ['#1E88E5', '#F4511E'],
            dataLabels: {
                enabled: true,
                background: {
                    enabled: true,
                    borderRadius: 2,
                    dropShadow: {
                        enabled: true,
                    },
                },
                style: {
                    colors: ['#1E88E5', '#F4511E'],
                },
            },
            stroke: {
                curve: 'smooth',
                width: 3,
            },
            series: [
                {
                    name: 'Pin',
                    type: 'line',
                    data: pinData,
                },
                {
                    name: 'OTP',
                    type: 'column',
                    data: otpData,
                },
            ],
            xaxis: {
                categories: dates,
                labels: {
                    style: {
                        colors: '#9E9E9E',
                        fontSize: '12px',
                    },
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#9E9E9E',
                        fontSize: '12px',
                    },
                    formatter: (val: number) => val.toLocaleString(),
                },
            },
            tooltip: {
                theme: 'dark',
                x: {
                    show: true,
                    formatter: (value) => `Date: ${value}`,
                },
                y: {
                    formatter: (val: number) => val.toLocaleString(),
                },
                marker: {
                    show: true,
                },
            },
            grid: {
                borderColor: '#E0E0E0',
                strokeDashArray: 4,
            },
            legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'right',
                labels: {
                    colors: '#424242',
                },
            },
        };
    }
    formatNumber(value: number): string | null {
        return this.decimalPipe.transform(value, '1.0-0'); // Format with thousands separators
    }
    
    // Method to handle date change from the date picker for Agent
onDateChangeAgent(event: any): void {
    this.dateValueAgent = new Date(Date.UTC(
        event.value.getFullYear(),
        event.value.getMonth(),
        event.value.getDate()
    ));
    const formattedDate = this.dateValueAgent.toISOString().split('T')[0];
    this.loadChartDataForDateAgent(formattedDate);
}

// Method to clear the date selection for Agent
clearDateAgent(): void {
    this.dateValueAgent = null;
    this.dateControlAgent.reset();
    // Reload data for the last 7 days
    this.loadChartDataForLastSevenDaysAgent();
}

// Load chart data for a specific date for Agent
loadChartDataForDateAgent(date: string): void {
    const pinItem = this.pinsByDateAgent.find((item) => item[0] === date);
    const otpItem = this.otpsByDateAgent.find((item) => item[0] === date);
    const pinData = [pinItem ? pinItem[1] : 0];
    const otpData = [otpItem ? otpItem[1] : 0];
    this._prepareAgentChartData([date], pinData, otpData);
}
// Load chart data for the last seven days for Agent
loadChartDataForLastSevenDaysAgent(): void {
    const last7Days = this.getLast7Days();
    const pinData = last7Days.map((day) => {
        const pinItem = this.pinsByDateAgent.find((item) => item[0] === day);
        return pinItem ? pinItem[1] : 0;
    });
    const otpData = last7Days.map((day) => {
        const otpItem = this.otpsByDateAgent.find((item) => item[0] === day);
        return otpItem ? otpItem[1] : 0;
    });
    this._prepareAgentChartData(last7Days, pinData, otpData);
}

// Prepare chart data for the Agent
private _prepareAgentChartData(dates: string[], pinData: number[], otpData: number[]): void {
    this.chartAgentIssues = {
        chart: {
            type: 'line',
            height: '100%',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
            },
            toolbar: {
                show: false,
            },
        },
        colors: ['#1E88E5', '#F4511E'],
        dataLabels: {
            enabled: true,
            background: {
                enabled: true,
                borderRadius: 2,
                dropShadow: {
                    enabled: true,
                },
            },
            style: {
                colors: ['#1E88E5', '#F4511E'],
            },
        },
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        series: [
            {
                name: 'Pin',
                type: 'line',
                data: pinData,
            },
            {
                name: 'OTP',
                type: 'column',
                data: otpData,
            },
        ],
        xaxis: {
            categories: dates,
            labels: {
                style: {
                    colors: '#9E9E9E',
                    fontSize: '12px',
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: '#9E9E9E',
                    fontSize: '12px',
                },
                formatter: (val: number) => val.toLocaleString(),
            },
        },
        tooltip: {
            theme: 'dark',
            x: {
                show: true,
                formatter: (value) => `Date: ${value}`,
            },
            y: {
                formatter: (val: number) => val.toLocaleString(),
            },
            marker: {
                show: true,
            },
        },
        grid: {
            borderColor: '#E0E0E0',
            strokeDashArray: 4,
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            labels: {
                colors: '#424242',
            },
        },
    };
}
loadAgentStatistics(agentId: string): void {
    this._projectService.getAgentStatistics(agentId).subscribe(
        response => {
            console.log('Agent statistics response:', response);

            // Set overall total values
            this.overallPinsAgent = response.totalPins;
            this.overallOtpsAgent = response.totalOtps;

           
        
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = yesterday.toISOString().split('T')[0];
            // Calculate today's total PIN sends
            this.todayPinsAgent = response.pinsByDate
                .filter(item => item[0] === yesterdayDate)
                .reduce((sum, item) => sum + item[1], 0);

            // Calculate today's total OTP sends
            this.todayOtpsAgent = response.otpsByDate
                .filter(item => item[0] === yesterdayDate)
                .reduce((sum, item) => sum + item[1], 0);

            console.log('Today’s total Pins for Agent:', this.todayPinsAgent);
            console.log('Today’s total OTPs for Agent:', this.todayOtpsAgent);

            // Store pinsByDate and otpsByDate for chart data
            this.pinsByDateAgent = response.pinsByDate;
            this.otpsByDateAgent = response.otpsByDate;

            // Load chart data for the last seven days
            this.loadChartDataForLastSevenDaysAgent();

            // Trigger change detection manually if using OnPush strategy
            this.cdr.markForCheck();
        },
        error => console.error('Error fetching agent statistics:', error)
    );
}

paginatesuperadmin(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    
  }

  paginateadmin(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    
  }

}
