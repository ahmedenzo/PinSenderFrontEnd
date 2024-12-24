import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../../../environment.prod';
import { Client, Message } from '@stomp/stompjs';
import { MessageResponse } from './MessageResponse';

@Injectable({
  providedIn: 'root'
})
export class CrudService {


  private apiUrl = environment.apiUrl;
  private stompClient: Client;
  private verificationStatusSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    // Create STOMP client for WebSocket communication
    this.stompClient = new Client({
      brokerURL: environment.brokerURL,
      reconnectDelay: 5000, // Automatically attempt reconnect
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Subscribe to the topic once connected
        this.stompClient.subscribe('/topic/verification-status', (message: Message) => {
          const response = JSON.parse(message.body);
          this.verificationStatusSubject.next(response);
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    // Activate the STOMP client for WebSocket connection
    this.stompClient.activate();
  }

  /**
   * Verifies cardholder details and sends OTP.
   * This method only sends the request to initiate verification and waits for WebSocket updates for the actual status.
   *
   * @param cardNumber The card number of the user
   * @param nationalId The national ID of the user
   * @param gsm The phone number of the user
   * @param finalDate The expiration date of the card (MM/YY)
   * @returns Observable<any> - Response from the backend
   */
  verifyCardholder(cardNumber: string, nationalId: string, gsm: string, finalDate: string): Observable<any> {
    const url = `${this.apiUrl}/api/cardholders/verify`;
    const body = { cardNumber, nationalId, gsm, finalDate };

    // Send HTTP request to initiate cardholder verification
    return this.http.post(url, body, { responseType: 'text' })
      .pipe(
        catchError(this.handleError<any>('verifyCardholder'))
      );
  }

  /**
   * Get real-time verification status updates via WebSocket.
   * 
   * @returns Observable<any> - Real-time verification status updates
   */
  getVerificationStatusUpdates(): Observable<any> {
    return this.verificationStatusSubject.asObservable();
  }


  // Error handling (optional)

  /**
   * Validates the OTP entered by the user.
   *
   * @param phoneNumber The phone number of the user
   * @param cardNumber The phone number of the user
   * @param otp The OTP entered by the user
   * @returns Observable<any> - Response from the backend
   */
  validateOtp(phoneNumber: string, otp: string, cardNumber: string): Observable<MessageResponse> {
    const url = `${this.apiUrl}/api/otp/validate`;
    const body = { phoneNumber, otp, cardNumber };

    // Ensure that you're expecting a structured response matching MessageResponse
    return this.http.post<MessageResponse>(url, body)
      .pipe(
        catchError(this.handleErrorotp<MessageResponse>('validateOtp'))
      );
  }

    /** Resends the OTP to the specified phone number.
/**
 * Resend OTP to the specified phone number.
 * @param gsmNumber The phone number to resend the OTP to.
 * @returns Observable<any> - Response from the backend.
 */
resendOtp(gsmNumber: string): Observable<any> {
  const url = `${this.apiUrl}/api/otp/resend`;
  const headers = new HttpHeaders({
      'Content-Type': 'text/plain'
  });

  return this.http.post(url, gsmNumber, { headers, responseType: 'text' })
      .pipe(
          catchError(this.handleError<any>('resendOtp'))
      );
}


  /**
   * Handles HTTP operation errors.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleErrorotp<T>(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<T> => {
      let errorMessage: string;

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Error ${error.status}: ${error.error.message || error.message}`;
      }

      console.error(`${operation} failed: ${errorMessage}`); // Log the error to console
      return throwError(() => new Error(errorMessage)); // Return a user-facing error message
    };
  }



private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed:`, error);
    return of(result as T);
  };
}
}