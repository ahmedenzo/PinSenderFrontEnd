import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { catchError, Observable, throwError, switchMap } from 'rxjs';
import { AuthUtils } from './auth.utils';
import { Router } from '@angular/router';  // Import Router

export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const router = inject(Router); // Inject the Router service

    let newReq = req.clone({
        withCredentials: true
    });

    if (authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)) {
        newReq = req.clone({
            headers: req.headers.set('Authorization', 'Bearer ' + authService.accessToken),
        });
    }

    return next(newReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                return authService.refreshAccessToken().pipe(
                    switchMap((newAccessToken) => {
                        const clonedReq = req.clone({
                            headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`)
                        });
                        return next(clonedReq);
                    }),
                    catchError(refreshError => {
                        console.error('Error refreshing token, logging out', refreshError);
                        authService.signOut();
                        return throwError(refreshError);
                    })
                );
            }

            if (error.status === 400 && error.error === "Session ID is invalid") {
                console.warn('Session invalid, logging out');
                window.alert("Session ended. Another session opened.");
                authService._clearSession()
                window.location.reload();
                return throwError(error);
            }

            return throwError(error);
        })
    );
};
