import { Component, inject, signal } from '@angular/core';
import { PostsServiceUsingToSignals } from '../posts-with-signals.data-provider';
import { JsonPipe } from '@angular/common';
import { take } from 'rxjs';
import { form, FormField, submit } from '@angular/forms/signals';
import { Post } from '../post.model';

@Component({
  selector: 'app-posts.page',
  imports: [JsonPipe, FormField],
  templateUrl: './posts.page.html',
  styleUrl: './posts.page.scss',
})
export class PostsPage {
  private readonly _postsService = inject(PostsServiceUsingToSignals);
  public readonly posts = this._postsService.posts;
  public readonly hasError = this._postsService.hasError;
  public readonly error = this._postsService.error;

  // Le problème qu on a tjr eu avec angular :
  // l'intégration de rxjs n a jamais été réussie, on a tjr eu besoin de faire du state management à la main pour gérer les sélections, les formulaires, etc... alors que c'est justement ce que rxjs est censé nous éviter de faire
  // contrairement aux signals
  private readonly _currentSelection  = signal<Post>({
    id: '',
    title: '',
    content: '',
    views: 0,
  });
  public readonly currentSelection = form<Post>(this._currentSelection);
  public onSelection(post: Post) {
    // shallow copie : on ne veut pas que les modifications faites dans le formulaire modifient directement l'objet de la liste, sinon on aurait des modifications en temps réel dans la liste au lieu d'avoir une validation à faire via un bouton submit
    this._currentSelection.set({...post});
  }


  public onSubmit(event: Event) {
    event.preventDefault();

    submit(this.currentSelection, {
      action: async (field) => {
        const selection = field().value();
        if (selection) {
          // this._postsService.update(selection).pipe(take(1)).subscribe();
          await this._postsService.updateUsingPromise(selection);
          // l await ne sert à rien dans ce cas
        }
      },
    })
  }
}
