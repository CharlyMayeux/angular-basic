import { HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, of, pipe, UnaryFunction } from 'rxjs';

import { WebApiResponse } from './web-api.model';

export function errorOperator<T>(): UnaryFunction<Observable<WebApiResponse<T>>, Observable<WebApiResponse<T>>> {
  return pipe(
    // CMAYEUX : le typage imposé par TypeScript n a aucun sens
    // le vraie typage est T et non pas WebApiResponse<T>
    // caught n aura jamais le type WebApiResponse<T> mais plutôt T
    catchError<WebApiResponse<T>, Observable<WebApiResponse<T>>>((err) => {
      if (err instanceof HttpErrorResponse) {
        return of({ data: null, error: [{ message: err.message }] } as WebApiResponse<T>);
      }
      if (err instanceof Error) {
        return of({ data: null, error: [{ message: err.message }] } as WebApiResponse<T>);
      }
      return of({ data: null, error: [{ message: 'An unknown error occurred' }] } as WebApiResponse<T>);
    })
  );
}