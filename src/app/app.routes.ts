import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import("./posts.page/posts.page").then((m) => m.PostsPage),
    }
];
