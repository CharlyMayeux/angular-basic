import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { BehaviorSubject, finalize, map, Observable, shareReplay, Subject, switchMap, take, tap } from 'rxjs';

import { WebApiResponse } from './web-api.model';
import { errorOperator } from './web-api.utils';

type PostResponse = {
  id: string;
  title: string;
  views: number;
  content: string;
};

export type Post = PostResponse;

@Injectable({
  providedIn: 'root',
})
export class PostsDataProvider {
  private readonly _http = inject(HttpClient);

  private readonly _refresh  = new BehaviorSubject<boolean>(false);
  private readonly _postsResponse$: Observable<WebApiResponse<Post[]>> = this._http.get<PostResponse[]>('http://localhost:3000/posts').pipe(
    map((response) => ({ data: response } as WebApiResponse<Post[]>)),
    errorOperator<PostResponse[]>(),
  );
  public readonly postsResponse$: Observable<WebApiResponse<Post[]>> = this._refresh.pipe(
    tap(() => console.log('refreshing posts...')),
    // switchMap pour annuler les requêtes en cours si on déclenche un refresh avant la fin de la précédente
    switchMap(() => this._postsResponse$),
    // shareReplay pour partager la même réponse entre tous les abonnés et éviter de faire plusieurs requêtes si plusieurs composants s'abonnent à postsResponse$ en même temps
    // ou lorsqu'on passe d'une page à une autre et qu'on revient sur la page des posts, on ne veut pas faire une nouvelle requête à chaque fois, mais réutiliser la même réponse tant qu'on n'a pas déclenché un refresh
    shareReplay(1)
  );

  public reload() {
    this._refresh.next(true);
  }

  public update(post: Post): Observable<WebApiResponse<Post>> {
    return this._http.put<PostResponse>(`http://localhost:3000/posts/${post.id}`, post).pipe(
      map((response) => ({ data: response } as WebApiResponse<Post>)),
      errorOperator<Post>(),
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  private readonly _postsDP = inject(PostsDataProvider);
  // Pas d'interet d'avoir un service + data provider si on fait juste un passe plat
  // => boilerplate inutile
  public readonly postsResponse$: Observable<WebApiResponse<Post[]>> = this._postsDP.postsResponse$;
  // on sépare donc la couche de service de la couche de data provider pour pouvoir faire du mapping, du caching, etc... dans le service sans impacter le data provider
  public readonly posts$ = this.postsResponse$.pipe(map((response) => (response.data ?? []) as Post[]));
  public readonly error$ = this.postsResponse$.pipe(map((response) => (response.error ?? [])));
  public readonly hasError$ = this.postsResponse$.pipe(map((response) => !!response.error));

  public update(post: Post): void {
    this._postsDP.update(post).pipe(take(1), finalize(() => {
      // on refetch les posts après la mise à jour pour avoir les données à jour,
      // mais on pourrait aussi faire du cache management pour éviter de faire un refetch complet
      // en gérant un BehaviorSubject dans ce service
      this._postsDP.reload();
    })).subscribe();
  }
}

