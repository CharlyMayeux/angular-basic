import { Component, inject, Signal, signal, WritableSignal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FieldTree, form, FormField, submit } from '@angular/forms/signals';
import { Post, PostResponse } from '../post.model';
import { ErrorResponse } from '../web-api.model';
import { PostsServiceUsingSignals } from '../posts-with-signals.data-provider';

@Component({
  selector: 'app-posts.page',
  imports: [JsonPipe, FormField],
  templateUrl: './posts.page.html',
  styleUrl: './posts.page.scss',
})
export class PostsPage {
  private readonly _postsService: PostsServiceUsingSignals = inject(PostsServiceUsingSignals);
  public readonly posts: Signal<Post[]> = this._postsService.posts;
  public readonly hasError: Signal<boolean> = this._postsService.hasError;
  public readonly error: Signal<ErrorResponse[]> = this._postsService.error;
  
  private readonly _currentSelection: WritableSignal<Post>  = signal<Post>({
    id: '',
    title: '',
    content: '',
    views: 0,
  });
  public readonly currentSelection: FieldTree<PostResponse, string | number> = form<Post>(this._currentSelection);
  public onSelection(post: Post):void {
    this._currentSelection.set({...post});
  }


  public onSubmit(event: Event): void {
    event.preventDefault();

    submit(this.currentSelection, {
      action: async (field) => {
        const selection = field().value();
        if (selection) {
          await this._postsService.updateUsingPromise(selection);
          // l await ne sert à rien dans ce cas
        }
      },
    })
  }
}
