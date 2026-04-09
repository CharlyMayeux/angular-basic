import { HttpClient } from '@angular/common/http';

import { toSignal } from '@angular/core/rxjs-interop';
import { computed, inject, Injectable, Injector } from '@angular/core';

import { BehaviorSubject, finalize, firstValueFrom, map, Observable, shareReplay, switchMap, take, tap } from 'rxjs';

import { Post, PostResponse } from './post.model';
import { WebApiResponse } from './web-api.model';
import { errorOperator } from './web-api.utils';


@Injectable({
  providedIn: 'root',
})
export class PostsDataProviderUsingSignals  {
  private readonly _http = inject(HttpClient);

  private readonly _refresh  = new BehaviorSubject<void>(void 0);
  private readonly _postsResponse$: Observable<WebApiResponse<Post[]>> = this._http.get<PostResponse[]>('http://localhost:3000/posts').pipe(
    map((response) => ({ data: response } as WebApiResponse<Post[]>)),
    errorOperator<PostResponse[]>(),
  );
  public readonly postsResponse$: Observable<WebApiResponse<Post[]>> = this._refresh.pipe(
    tap((v) => console.log('refreshing posts...', v)),
    // switchMap pour annuler les requêtes en cours si on déclenche un refresh avant la fin de la précédente
    switchMap(() => this._postsResponse$),
    // shareReplay pour partager la même réponse entre tous les abonnés et éviter de faire plusieurs requêtes si plusieurs composants s'abonnent à postsResponse$ en même temps
    // ou lorsqu'on passe d'une page à une autre et qu'on revient sur la page des posts, on ne veut pas faire une nouvelle requête à chaque fois, mais réutiliser la même réponse tant qu'on n'a pas déclenché un refresh
    shareReplay(1)
  );

  public reload() {
    this._refresh.next(void 0);
  }

  public update(post: Post): Observable<WebApiResponse<Post>> {
    return this._http.put<PostResponse>(`http://localhost:3000/posts/${post.id}`, post).pipe(
      map((response) => ({ data: response } as WebApiResponse<Post>)),
      errorOperator<Post>(),
    );
  }
  public updateUsingPromise(post: Post): Promise<WebApiResponse<Post>> {
    return firstValueFrom(this._http.put<PostResponse>(`http://localhost:3000/posts/${post.id}`, post).pipe(
      map((response) => ({ data: response } as WebApiResponse<Post>)),
      errorOperator<Post>(),
    ));
  }
}



@Injectable({
  providedIn: 'root',
})
export class PostsServiceUsingToSignals {
  private readonly _injector = inject(Injector);
  private readonly _postsDP = inject(PostsDataProviderUsingSignals);
  // Pas d'interet d'avoir un service + data provider si on fait juste un passe plat
  // => boilerplate inutile
  public readonly postsResponse = toSignal(this._postsDP.postsResponse$, {
    initialValue: { data: [], error: [] } as WebApiResponse<Post[]>,
  });
  // on sépare donc la couche de service de la couche de data provider pour pouvoir faire du mapping, du caching, etc... dans le service sans impacter le data provider
  public readonly posts = computed(() => this.postsResponse().data ?? []);
  public readonly error = computed(() => this.postsResponse().error ?? []);
  public readonly hasError = computed(() => !!this.postsResponse().error);

  public update(post: Post): Observable<WebApiResponse<Post>> {

    const action = this._postsDP.update(post).pipe(take(1), finalize(() => {
      // on refetch les posts après la mise à jour pour avoir les données à jour,
      // mais on pourrait aussi faire du cache management pour éviter de faire un refetch complet
      // en gérant un BehaviorSubject dans ce service
      this._postsDP.reload();
    }));
    // On peut retourner un signal techniquement,
    // mais l 'interet est limité, car on perd la possibilité de faire du subscribe, du pipe, etc... sur l'observable retourné,
    // et on ne gagne pas grand chose à avoir un signal pour une action qui est censée être déclenchée par un événement utilisateur (click sur un bouton submit)
    // et qui n'est pas censée être utilisée dans le template pour faire du data binding
    // on est dans un cas où, une promise est envisageable (tant que ne cherche pas à faire du chaining d'actions),
    // c'est d'autent plus vraie que la gestiond es forms attend une promise pour la partie subtmit,
    // donc on pourrait retourner une promise à la place d'un signal pour être plus dans les clous de ce qui est attendu par les forms,
    // et éviter de faire du toSignal dans la fonction onSubmit du composant
    // https://angular.dev/guide/forms/signals/validation voir le code
    // const signalAction = toSignal(action, {
    //   injector: this._injector,
    // });
    return action;
  }
  public async updateUsingPromise(post: Post): Promise<WebApiResponse<Post>> {
    const response = await this._postsDP.updateUsingPromise(post);
    this._postsDP.reload();
    return response;
  }
}
