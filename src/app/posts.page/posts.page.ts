import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostsService } from '../posts.data-provider';

import { BehaviorSubject, Observable, take } from 'rxjs';

import { Post } from '../post.model';
import { ErrorResponse } from '../web-api.model';

@Component({
  selector: 'app-posts.page',
  imports: [AsyncPipe, JsonPipe, FormsModule],
  templateUrl: './posts.page.html',
  styleUrl: './posts.page.scss',
})
export class PostsPage {
  private readonly _postsService: PostsService = inject(PostsService);
  public readonly posts$: Observable<Post[]> = this._postsService.posts$;
  public readonly hasError$: Observable<boolean> = this._postsService.hasError$;
  public readonly error$: Observable<ErrorResponse[]> = this._postsService.error$;

  // Le problème qu on a tjr eu avec angular :
  // l'intégration de rxjs n a jamais été réussie, on a tjr eu besoin de faire du state management à la main pour gérer les sélections, les formulaires, etc... alors que c'est justement ce que rxjs est censé nous éviter de faire
  // contrairement aux signals
  public readonly currentSelection: BehaviorSubject<Post | null>  = new BehaviorSubject<Post | null>(null);
  public onSelection(post: Post): void {
    // shallow copie : on ne veut pas que les modifications faites dans le formulaire modifient directement l'objet de la liste, sinon on aurait des modifications en temps réel dans la liste au lieu d'avoir une validation à faire via un bouton submit
    this.currentSelection.next({...post});
  }


  public onSubmit(): void {
    const selection = this.currentSelection.getValue();
    if (selection) {
      this._postsService.update(selection).pipe(take(1)).subscribe();
    }
  }
}
