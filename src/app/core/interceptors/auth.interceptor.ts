import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface RefreshResponse { accessToken: string; refreshToken: string; }

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'authRefreshToken';
let refreshRequest: Observable<RefreshResponse> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return next(req);

  const http = inject(HttpClient);
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);
  const authenticatedRequest = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const isAuthRequest = req.url.includes('/admin/login') || req.url.includes('/api/auth/refresh');
      if (error.status !== 401 || isAuthRequest) return throwError(() => error);
      if (!refreshToken) {
        redirectToLogin(router);
        return throwError(() => error);
      }

      if (!refreshRequest) {
        refreshRequest = http.post<RefreshResponse>(`${environment.apiBaseUrl}/api/auth/refresh`, { refreshToken }).pipe(
          shareReplay(1),
          finalize(() => { refreshRequest = null; })
        );
      }

      return refreshRequest.pipe(
        switchMap(tokens => {
          localStorage.setItem(TOKEN_KEY, tokens.accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } }));
        }),
        catchError(refreshError => {
          redirectToLogin(router);
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function redirectToLogin(router: Router): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('authAdmin');
  const returnUrl = router.url && router.url !== '/login' ? router.url : '/dashboard';
  void router.navigate(['/login'], { queryParams: { returnUrl } });
}
