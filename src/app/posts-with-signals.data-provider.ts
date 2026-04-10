import { HttpClient, httpResource } from '@angular/common/http';

import { toSignal } from '@angular/core/rxjs-interop';
import { computed, inject, Injectable, Injector, Signal } from '@angular/core';

import { BehaviorSubject, finalize, firstValueFrom, map, Observable, shareReplay, switchMap, take, tap } from 'rxjs';

import { Post, PostResponse } from './post.model';
import { ErrorResponse, WebApiResponse } from './web-api.model';
import { errorOperator } from './web-api.utils';


@Injectable({
  providedIn: 'root',
})
export class PostsDataProviderUsingSignals  {
  private readonly _http: HttpClient = inject(HttpClient);

  public readonly _postResponse = httpResource<WebApiResponse<Post[]>> (() => {
    return 'http://localhost:3000/posts' ;
  }, {
    parse: (response) => ({ data: response } as WebApiResponse<Post[]>),
  });

  public readonly postResponse = computed(() => {
    const response = this._postResponse.value();
    const error = this._postResponse.error();
    if (response) {
      return response;
    } else if (error) {
      return { data: [], error: [error] } as WebApiResponse<Post[]>;
    } else {
      return { data: [], error: [] } as WebApiResponse<Post[]>;
    }
  });
  
  public reload(): void {
    this._postResponse.reload();
  }

  public update(post: Post): Promise<WebApiResponse<Post>> {
    return firstValueFrom(this._http.put<PostResponse>(`http://localhost:3000/posts/${post.id}`, post).pipe(
      map((response) => ({ data: response } as WebApiResponse<Post>)),
      errorOperator<Post>(),
    ));
  }
}

@Injectable({
  providedIn: 'root',
})
export class PostsServiceUsingSignals {
  private readonly _postsDP: PostsDataProviderUsingSignals = inject(PostsDataProviderUsingSignals);
  public readonly postsResponse: Signal<WebApiResponse<Post[]>> = this._postsDP.postResponse;
  public readonly posts: Signal<Post[]> = computed(() => this.postsResponse().data ?? []);
  public readonly error: Signal<ErrorResponse[]> = computed(() => this.postsResponse().error ?? []);
  public readonly hasError: Signal<boolean> = computed(() => !!this.postsResponse().error);

  public async updateUsingPromise(post: Post): Promise<WebApiResponse<Post>> {
    const response = await this._postsDP.update(post);
    this._postsDP.reload();
    return response;
  }
}
